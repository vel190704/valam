// frontend/lib/api.ts
// Central API client — all calls go to Express backend at port 5000

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'

async function authHeaders(token?: string): Promise<HeadersInit> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// ── Profile ──────────────────────────────────────────────────────────────────
export async function saveProfile(token: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/profile/save-assessment`, {
    method: 'POST',
    headers: await authHeaders(token),
    body: JSON.stringify(body),
  })
  return res
}

export async function getProfile(userId: string) {
  const res = await fetch(`${BASE}/profile`, {
    headers: { 'Content-Type': 'application/json' }
  })
  return res
}

export async function ensureProfile(token: string, name: string, age: number) {
  const res = await fetch(`${BASE}/profile/ensure`, {
    method: 'POST',
    headers: await authHeaders(token),
    body: JSON.stringify({ name, age }),
  })
  return res
}

// ── Recommendations ──────────────────────────────────────────────────────────
export async function getRecommendations(level: number, goal: string) {
  const res = await fetch(
    `${BASE}/recommendations?level=${level}&goal=${goal}`
  )
  return res
}

// ── Investments ──────────────────────────────────────────────────────────────
export async function getInvestments(token: string) {
  const res = await fetch(`${BASE}/investments`, {
    headers: await authHeaders(token),
  })
  return res
}

export async function addInvestment(
  token: string,
  body: { date: string; type: string; amount: number; note?: string }
) {
  const res = await fetch(`${BASE}/investments`, {
    method: 'POST',
    headers: await authHeaders(token),
    body: JSON.stringify(body),
  })
  return res
}

export async function deleteInvestment(token: string, id: string) {
  const res = await fetch(`${BASE}/investments/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(token),
  })
  return res
}

// ── Net Worth ────────────────────────────────────────────────────────────────
export async function getNetworth(token: string) {
  const res = await fetch(`${BASE}/networth`, {
    headers: await authHeaders(token),
  })
  return res
}

export async function addNetworthItem(
  token: string,
  body: { category: string; label: string; amount: number; note?: string }
) {
  const res = await fetch(`${BASE}/networth`, {
    method: 'POST',
    headers: await authHeaders(token),
    body: JSON.stringify(body),
  })
  return res
}

export async function deleteNetworthItem(token: string, id: string) {
  const res = await fetch(`${BASE}/networth/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(token),
  })
  return res
}

// ── Income ───────────────────────────────────────────────────────────────────
export async function getIncome(token: string) {
  const res = await fetch(`${BASE}/income`, {
    headers: await authHeaders(token),
  })
  return res
}

export async function addIncomeEntry(
  token: string,
  body: {
    date: string; source: string;
    category: string; amount: number; note?: string
  }
) {
  const res = await fetch(`${BASE}/income`, {
    method: 'POST',
    headers: await authHeaders(token),
    body: JSON.stringify(body),
  })
  return res
}

export async function deleteIncomeEntry(token: string, id: string) {
  const res = await fetch(`${BASE}/income/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(token),
  })
  return res
}
