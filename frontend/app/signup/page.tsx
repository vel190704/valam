'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { VALAMResult } from '@/lib/valam'

// ── Read pending assessment from sessionStorage ───────────────────────────────
// If the user completed onboarding as a guest, bundle their full assessment  
// into the signup call so it's saved immediately on account creation.
interface AssessmentPayload {
  name: string
  age: number
  income: string
  savingsRate: string
  investments: string
  experience: string
  goal: string
  valamScore: number
  valamLevel: number
  valamLevelName: string
  potentialScore: number
  potentialLevel: number
  potentialLevelName: string
  wealthVelocity: number
  breakdown: {
    savingsScore: number
    investmentsScore: number
    incomeScore: number
    experienceScore: number
    ageScore: number
  }
}
function getPendingAssessment(
  nameOverride: string,
  ageOverride: number
): AssessmentPayload | undefined {
  try {
    const rawResult = sessionStorage.getItem('valam_result')
    if (!rawResult) return undefined

    const parsed = JSON.parse(rawResult) as VALAMResult

    const income      = sessionStorage.getItem('valam_income') ?? ''
    const savingsRate = sessionStorage.getItem('valam_savings') ?? ''
    const investments = sessionStorage.getItem('valam_investments') ?? ''
    const experience  = sessionStorage.getItem('valam_experience') ?? 'beginner'
    const goal        = sessionStorage.getItem('valam_goal') ?? 'wealth'

    if (!income || !savingsRate || !investments) return undefined

    return {
      name:               nameOverride,
      age:                ageOverride,
      income,
      savingsRate,
      investments,
      experience,
      goal,
      valamScore:         parsed.positionScore,
      valamLevel:         parsed.positionLevel,
      valamLevelName:     parsed.positionLevelName,
      potentialScore:     parsed.potentialScore,
      potentialLevel:     parsed.potentialLevel,
      potentialLevelName: parsed.potentialLevelName,
      wealthVelocity:     parsed.breakdown?.wealthVelocity ?? 0,
      breakdown: {
        savingsScore:     parsed.breakdown?.savingsScore        ?? 0,
        investmentsScore: parsed.breakdown?.wealthVelocityScore ?? 0,
        incomeScore:      parsed.breakdown?.incomeScore         ?? 0,
        experienceScore:  parsed.breakdown?.experienceScore     ?? 0,
        ageScore:         parsed.breakdown?.ageScore            ?? 0,
      },
    }
  } catch {
    return undefined
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter()
  
  const [name,                 setName]                 = useState('')
  const [age,                  setAge]                  = useState('')
  const [email,                setEmail]                = useState('')
  const [password,             setPassword]             = useState('')
  const [loading,              setLoading]              = useState(false)
  const [error,                setError]                = useState('')
  const [hasPendingAssessment, setHasPendingAssessment] = useState(false)

  // Pre-fill from sessionStorage and redirect if already logged in
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) { router.push('/'); return }
      setName(sessionStorage.getItem('valam_name') ?? '')
      setAge(sessionStorage.getItem('valam_age') ?? '')
      setHasPendingAssessment(!!sessionStorage.getItem('valam_result'))
    }
    void init()
  }, [router])

  // ── Email/password signup ──────────────────────────────────────────────────
  async function handleSignup() {
    setError('')
    if (!name.trim())     { setError('Please enter your name');     return }
    if (!age)             { setError('Please enter your age');      return }
    if (!email.trim())    { setError('Please enter your email');    return }
    if (!password)        { setError('Please enter a password');    return }
    if (password.length < 6) {
      setError('Password must be at least 6 characters'); return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), age: Number(age) },
      },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Signup failed. Please try again.')
      setLoading(false)
      return
    }

    // Bundle pending assessment into the account immediately
    const assessment = getPendingAssessment(name.trim(), Number(age))
    if (assessment && data.session?.access_token) {
      try {
        const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
        const saveRes = await fetch(`${BASE}/profile/save-assessment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify(assessment),
        })
        if (!saveRes.ok) {
          const body = await saveRes.text()
          console.warn('Assessment save failed after signup:', saveRes.status, body)
        }
      } catch {
        console.warn('Assessment save failed after signup')
      }
    }

    alert(
      'Your account was created successfully. ' +
      'Please verify your email from your inbox, then log in.'
    )
    router.push('/login')
    setLoading(false)
  }

  // ── Google OAuth signup ─────────────────────────────────────────────────────
  async function handleGoogle() {
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (oauthError) setError(oauthError.message)
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(245,240,232,0.06)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    color: '#F5F0E8',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    marginBottom: 12,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'rgba(245,240,232,0.5)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 4,
    fontFamily: 'Inter, sans-serif',
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-28 sm:px-6 lg:px-8"
      style={{ background: '#1a0f0a' }}>

      <div className="w-full max-w-[480px] px-5 py-8 sm:px-10 sm:py-12"
        style={{
          background: 'rgba(245,240,232,0.03)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#c9a84c',
            letterSpacing: '0.1em',
            marginBottom: 6,
          }}>
            VALAM
          </div>
          <div style={{
            fontSize: 13,
            color: 'rgba(245,240,232,0.55)',
            fontFamily: 'Inter, sans-serif',
          }}>
            Create your account
          </div>
          {/* Pre-fill notice if coming from onboarding */}
          {hasPendingAssessment && (
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 8,
              fontSize: 12,
              color: '#c9a84c',
              fontFamily: 'Inter, sans-serif',
            }}>
              ✓ Your assessment will be saved automatically on signup
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(192,57,43,0.12)',
            border: '1px solid rgba(192,57,43,0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: '#E57373',
            marginBottom: 16,
            fontFamily: 'Inter, sans-serif',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Age</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="e.g. 25"
              min={18}
              max={80}
              style={inputStyle}
            />
          </div>
        </div>

        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
        />

        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min 6 characters"
          style={{ ...inputStyle, marginBottom: 20 }}
        />

        {/* Signup button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #c9a84c, #8b6914)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '13px',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 14,
            letterSpacing: '0.02em',
          }}>
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 10, marginBottom: 14,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.15)' }}/>
          <span style={{ fontSize: 11, color: 'rgba(245,240,232,0.35)', fontFamily: 'Inter, sans-serif' }}>
            or
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.15)' }}/>
        </div>

        {/* Google OAuth button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            width: '100%',
            background: 'rgba(245,240,232,0.05)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 12,
            padding: '12px',
            fontSize: 14,
            fontWeight: 600,
            color: '#F5F0E8',
            fontFamily: 'Inter, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 20,
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        {/* Login link */}
        <div style={{
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(245,240,232,0.5)',
          fontFamily: 'Inter, sans-serif',
        }}>
          Already have an account?{' '}
          <a href="/login" style={{
            color: '#c9a84c',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Log in
          </a>
        </div>
      </div>
    </main>
  )
}
