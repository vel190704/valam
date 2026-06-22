'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getAllocation, TYPE_TO_SUGGESTED } from '@/lib/allocation'

// ── Types ──────────────────────────────────────────────────────────────────
interface Investment {
  id: string
  type: string
  amount: number
  date?: string
  note?: string
}

interface AllocationItem {
  label: string
  pct: number
  color: string
}

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
  :root {
    --bg:#EFEDE8; --surface:#F5F3EF; --surface2:#EAE7E1;
    --border:rgba(180,155,110,0.18); --border-md:rgba(180,155,110,0.32);
    --gold:#B8924A; --gold-lt:#D4AD72; --bronze:#8F6828;
    --muted:#7A6E5F; --text:#1E1C18; --text-sm:#3A3630;
    --green:#4A7A4A; --red:#C0392B;
  }
  body.dark {
    --bg:#231512; --surface:#2C1A16; --surface2:#3A2218;
    --border:rgba(201,168,76,0.15); --border-md:rgba(201,168,76,0.28);
    --gold:#C9A84C; --gold-lt:#F0D080; --bronze:#8B6914;
    --muted:#B89A72; --text:#F5F0E8; --text-sm:#D4C4A8;
    --green:#4CAF50; --red:#E57373;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:Inter,sans-serif;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:var(--surface2);}
  ::-webkit-scrollbar-thumb{background:var(--border-md);border-radius:10px;}
`

// ── Donut SVG ─────────────────────────────────────────────────────────────
function Donut({ slices, label, total }: {
  slices: { pct: number; color: string; label: string }[]
  label: string
  total: string
}) {
  const R = 52
  const circumference = 2 * Math.PI * R
  let offset = 0
  const sorted = [...slices].sort((a, b) => b.pct - a.pct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg viewBox="0 0 130 130" width="140" height="140">
          <circle cx="65" cy="65" r={R} fill="none" stroke="var(--surface2)" strokeWidth={22} />
          {sorted.map((s, i) => {
            const dash = (s.pct / 100) * circumference
            const startOffset = offset
            offset += dash
            const rotate = -90 + (startOffset / circumference) * 360
            return (
              <circle key={i} cx="65" cy="65" r={R} fill="none"
                stroke={s.color} strokeWidth={22}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={0}
                transform={`rotate(${rotate} 65 65)`} />
            )
          })}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, letterSpacing: '.4px', textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{total}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
        {sorted.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-sm)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AllocationPage() {
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [valamLevel, setValamLevel] = useState(3)
  const [investments, setInvestments] = useState<Investment[]>([])

  useEffect(() => {
    const isDark = document.body.classList.contains('dark') || localStorage.getItem('theme') === 'dark'
    if (isDark) { document.body.classList.add('dark'); setDark(true) }
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.body.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/'); return }

      const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
      const res = await fetch(`${BASE}/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setError('Failed to load data'); setLoading(false); return }

      const json = await res.json()
      setValamLevel(json.profile?.valamLevel ?? 3)
      setInvestments(json.investments ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  // ── Compute actual allocation ─────────────────────────────────────────
  const portfolioByType: Record<string, number> = {}
  for (const inv of investments) {
    portfolioByType[inv.type] = (portfolioByType[inv.type] ?? 0) + inv.amount
  }
  const total = Object.values(portfolioByType).reduce((s, v) => s + v, 0) || 1

  const TYPE_COLORS: Record<string, string> = {
    mf: '#B8924A', stock: '#5B8DB8', fd: '#E07B54',
    crypto: '#9B59B6', bond: '#27AE60', etf: '#16A085', realestate: '#C0392B',
  }
  const TYPE_LABELS: Record<string, string> = {
    mf: 'Mutual Funds', stock: 'Stocks', fd: 'FDs',
    crypto: 'Crypto', bond: 'Bonds', etf: 'ETFs', realestate: 'Real Estate',
  }

  const actualSlices = Object.entries(portfolioByType).map(([type, amt]) => ({
    label: TYPE_LABELS[type] ?? type,
    pct: Math.round((amt / total) * 100),
    color: TYPE_COLORS[type] ?? '#888',
  }))

  const suggested: AllocationItem[] = getAllocation(valamLevel)

  // ── Gap analysis ──────────────────────────────────────────────────────
  // Compute actual % by suggested label (using TYPE_TO_SUGGESTED mapping)
  const actualByLabel: Record<string, number> = {}
  for (const [type, amt] of Object.entries(portfolioByType)) {
    const label = TYPE_TO_SUGGESTED[type]
    if (label) actualByLabel[label] = (actualByLabel[label] ?? 0) + amt
  }

  const gaps = suggested.map(s => {
    const actualAmt = actualByLabel[s.label] ?? 0
    const actualPct = Math.round((actualAmt / total) * 100)
    const delta = actualPct - s.pct
    return { label: s.label, suggestedPct: s.pct, actualPct, delta, color: s.color }
  })

  const totalAmt = Object.values(portfolioByType).reduce((s, v) => s + v, 0)
  const fmt = (n: number) =>
    n >= 10_00_000 ? `₹${(n / 10_00_000).toFixed(1)}L`
    : n >= 1_000 ? `₹${(n / 1_000).toFixed(0)}K`
    : `₹${n}`

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)' }}>
      <style>{CSS}</style>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 40 }}>
      <style>{CSS}</style>

      {/* Navbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
        gap: 10, padding: '0 20px', height: 52 }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: 'var(--muted)',
            fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>
          ←
        </button>
        <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 16,
          fontWeight: 700, color: 'var(--gold)', flex: 1 }}>
          Asset Allocation
        </span>
        <button onClick={toggleDark}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: 'var(--muted)' }}>
          {dark ? '☀' : '◑'}
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {error && (
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid var(--red)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            fontSize: 12, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {/* Level badge */}
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
          Suggestions are tailored for{' '}
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Level {valamLevel}</span>
          {' '}investors · Portfolio total{' '}
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(totalAmt)}</span>
        </div>

        {/* Donuts row */}
        {investments.length === 0 ? (
          <div style={{ background: 'var(--surface)', borderRadius: 18,
            border: '1px solid var(--border)', padding: '40px 24px',
            textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Add investments on the{' '}
              <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => router.push('/portfolio')}>
                Portfolio
              </span>{' '}
              page to see your allocation analysis.
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Actual donut */}
              <div style={{ background: 'var(--surface)', borderRadius: 18,
                border: '1px solid var(--border)', padding: '20px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
                  textTransform: 'uppercase', fontWeight: 500, marginBottom: 16 }}>
                  Your Portfolio
                </div>
                {actualSlices.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>No data</div>
                ) : (
                  <Donut slices={actualSlices} label="Actual" total={fmt(totalAmt)} />
                )}
              </div>

              {/* Suggested donut */}
              <div style={{ background: 'var(--surface)', borderRadius: 18,
                border: '1px solid var(--border)', padding: '20px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
                  textTransform: 'uppercase', fontWeight: 500, marginBottom: 16 }}>
                  Suggested · Level {valamLevel}
                </div>
                <Donut slices={suggested} label="Target" total="Ideal mix" />
              </div>
            </div>

            {/* Gap analysis table */}
            <div style={{ background: 'var(--surface)', borderRadius: 18,
              border: '1px solid var(--border)', padding: '20px 22px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
                textTransform: 'uppercase', fontWeight: 500, marginBottom: 16 }}>
                Gap Analysis
              </div>

              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
                gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)',
                fontSize: 9, color: 'var(--muted)', fontWeight: 600,
                letterSpacing: '.4px', textTransform: 'uppercase' }}>
                <span>Category</span>
                <span style={{ textAlign: 'right' }}>Suggested</span>
                <span style={{ textAlign: 'right' }}>Actual</span>
                <span style={{ textAlign: 'right' }}>Gap</span>
              </div>

              {gaps.map(g => (
                <div key={g.label} style={{ display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px 80px',
                  gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)',
                  alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>{g.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
                    {g.suggestedPct}%
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text)', textAlign: 'right', fontWeight: 600 }}>
                    {g.actualPct}%
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, textAlign: 'right',
                    color: g.delta === 0 ? 'var(--muted)'
                         : g.delta > 0 ? 'var(--green)'
                         : 'var(--red)',
                  }}>
                    {g.delta === 0 ? '—' : g.delta > 0 ? `+${g.delta}%` : `${g.delta}%`}
                  </span>
                </div>
              ))}

              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>Green</span> = over-allocated ·{' '}
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>Red</span> = under-allocated vs. suggested
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}