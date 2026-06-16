'use client'

import type { Recommendation } from '@/lib/recommendations'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
const TOKEN_KEY = 'valam_access_token'
const USER_KEY = 'valam_user'

export interface AuthUser {
  id: string
  email: string
  name: string
  age: number
}

export interface ProfileDTO {
  id: string
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
  onboarded: boolean
  breakdown: {
    savingsScore: number
    investmentsScore: number
    incomeScore: number
    experienceScore: number
    ageScore: number
  }
  createdAt: string
  recommendation: Recommendation
}

export interface SaveProfilePayload {
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
  breakdown: ProfileDTO['breakdown']
}

export interface SignupPayload {
  email: string
  password: string
  name: string
  age: number
  assessment?: SaveProfilePayload
}

function emitAuthChanged() {
  window.dispatchEvent(new Event('valam-auth-changed'))
}

function getAccessToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken()
  if (!token) throw new Error('No active session')
  return { Authorization: `Bearer ${token}` }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init)
  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(json.error ?? 'Request failed')
  }

  return json as T
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isLoggedIn() {
  return Boolean(getAccessToken())
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  emitAuthChanged()
}

export async function signup(input: SignupPayload): Promise<{ message: string; userId: string }> {
  return request('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const json = await request<{ accessToken: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  localStorage.setItem(TOKEN_KEY, json.accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(json.user))
  emitAuthChanged()

  return json.user
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!getAccessToken()) return null

  try {
    const json = await request<{ user: AuthUser }>('/auth/me', {
      headers: getAuthHeaders(),
    })
    localStorage.setItem(USER_KEY, JSON.stringify(json.user))
    return json.user
  } catch {
    logout()
    return null
  }
}

export async function fetchCurrentProfile(): Promise<ProfileDTO | null> {
  const res = await fetch(`${API_BASE_URL}/profile`, {
    headers: getAuthHeaders(),
  })

  if (res.status === 404) return null

  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Failed to fetch profile')

  return (json as { profile: ProfileDTO }).profile
}

export async function ensureCurrentProfile(input: {
  name?: string
  age?: number
}): Promise<{ profileId: string }> {
  return request('/profile/ensure', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export async function saveCurrentProfile(
  payload: SaveProfilePayload,
): Promise<{ profileId: string }> {
  return request('/profile/save-assessment', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchRecommendation(level: number, goal: string) {
  const params = new URLSearchParams({
    level: String(level),
    goal,
  })

  const json = await request<{ recommendation: Recommendation }>(`/recommendations?${params}`)
  return json.recommendation
}
