'use strict'
require('dotenv').config({ path: '/home/manivel/project/valamhq/backend/.env.local' })
require('dotenv').config({ path: '/home/manivel/project/valamhq/frontend/.env.local', override: false })

const { chromium } = require('@playwright/test')
const { createClient } = require('@supabase/supabase-js')
const fs   = require('fs')
const path = require('path')

const TEST_USER_ID  = '86c60e37-8102-448e-869c-e2aebfadca68'
const PROJECT_REF   = 'mtjaqptamwjcfvifomsc'
const RESULTS_DIR   = '/home/manivel/project/valamhq/test-results'
const AUTH_FILE     = path.join(RESULTS_DIR, 'auth-state.json')
const TEST_PASSWORD = 'VALAMtest_pw_9!2z'

module.exports = async function globalSetup() {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true })

  const supabaseUrl  = process.env.SUPABASE_URL
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceKey || !anonKey) {
    throw new Error('[globalSetup] Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Get user email
  const { data: { user }, error: ue } = await admin.auth.admin.getUserById(TEST_USER_ID)
  if (ue || !user) throw new Error('[globalSetup] Cannot get user: ' + (ue?.message ?? 'not found'))

  // Set a known test password so we can sign in via password flow (bypasses PKCE)
  const { error: pe } = await admin.auth.admin.updateUserById(TEST_USER_ID, {
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (pe) throw new Error('[globalSetup] Failed to set test password: ' + pe.message)

  // Exchange password for session tokens via REST (no browser needed for this step)
  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
    },
    body: JSON.stringify({ email: user.email, password: TEST_PASSWORD }),
  })
  const session = await tokenRes.json()

  if (!session.access_token) {
    throw new Error('[globalSetup] Token exchange failed: ' + JSON.stringify(session))
  }

  // Inject session into a real browser context and navigate to /dashboard
  // so the Next.js app picks up the auth state properly
  const browser = await chromium.launch({ headless: true })
  const ctx     = await browser.newContext()
  const page    = await ctx.newPage()

  // Navigate to the base URL first so we can set localStorage on the right origin
  await page.goto('http://localhost:3000', { timeout: 20000 })

  // Write the Supabase session to localStorage (same format the SDK expects)
  await page.evaluate(({ session, ref }) => {
    const stored = {
      access_token:  session.access_token,
      token_type:    'bearer',
      expires_in:    session.expires_in ?? 3600,
      expires_at:    session.expires_at ?? (Math.floor(Date.now() / 1000) + 3600),
      refresh_token: session.refresh_token,
      user:          session.user,
    }
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(stored))
  }, { session, ref: PROJECT_REF })

  // Navigate to dashboard — the app should read localStorage and stay logged in
  await page.goto('http://localhost:3000/dashboard', { timeout: 20000 })

  // Wait for the page to either stay on /dashboard or redirect (auth check)
  try {
    await page.waitForURL('**/dashboard', { timeout: 15000 })
  } catch {
    const url = page.url()
    // If still on dashboard (URL didn't change back), that's fine
    if (!url.includes('/dashboard')) {
      throw new Error('[globalSetup] Dashboard redirect failed — ended up at: ' + url)
    }
  }

  await ctx.storageState({ path: AUTH_FILE })
  await browser.close()

  // Verify the saved state contains the auth token
  const savedState = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'))
  const lsEntries  = savedState.origins?.[0]?.localStorage ?? []
  const hasToken   = lsEntries.some(e => e.name === `sb-${PROJECT_REF}-auth-token`)
  console.log('[globalSetup] Auth token in saved state:', hasToken)
  if (!hasToken) {
    console.warn('[globalSetup] WARNING: auth token not found in saved state — tests will likely fail auth')
  }

  console.log('[globalSetup] Done. User:', user.email.replace(/(.{2}).*(@.*)/, '$1***$2'))
}
