'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LEVEL_NAMES_ARR } from '@/lib/valam'

interface DashboardData {
  name:               string
  valamScore:         number
  valamLevel:         number
  valamLevelName:     string
  potentialLevel:     number
  potentialLevelName: string
  goal:               string
  investments:        string
  breakdown: {
    savingsScore:     number
    investmentsScore: number
    incomeScore:      number
    experienceScore:  number
    ageScore:         number
  }
}

interface InvestmentEntry {
  id: string
  date: string
  type: string
  amount: number
}

interface NetworthItem {
  id: string
  category: string
  label: string
  amount: number
}

function getAllocation(level: number) {
  if (level <= 2) return [
    { label: 'Emergency Fund', pct: 50, color: 'var(--gold)'   },
    { label: 'FDs',            pct: 30, color: 'var(--bronze)' },
    { label: 'Mutual Funds',   pct: 20, color: '#C4A07A'       },
  ]
  if (level <= 4) return [
    { label: 'Mutual Funds',   pct: 40, color: 'var(--gold)'   },
    { label: 'FDs',            pct: 25, color: 'var(--bronze)' },
    { label: 'Stocks',         pct: 20, color: '#C4A07A'       },
    { label: 'Emergency Fund', pct: 15, color: '#7A9EAA'       },
  ]
  if (level <= 6) return [
    { label: 'Stocks',       pct: 40, color: 'var(--gold)'   },
    { label: 'Mutual Funds', pct: 30, color: 'var(--bronze)' },
    { label: 'Bonds',        pct: 15, color: '#C4A07A'       },
    { label: 'Gold',         pct: 15, color: '#7A9EAA'       },
  ]
  return [
    { label: 'Stocks',        pct: 35, color: 'var(--gold)'   },
    { label: 'International', pct: 25, color: 'var(--bronze)' },
    { label: 'Alternatives',  pct: 20, color: '#C4A07A'       },
    { label: 'Bonds',         pct: 20, color: '#7A9EAA'       },
  ]
}

function savingsRateLabel(score: number): string {
  const m: Record<number, string> = {
    1: '<2%', 2: '2–5%', 3: '5–10%', 4: '10–15%',
    5: '15–20%', 6: '20–30%', 7: '30–40%', 8: '40%+',
  }
  return m[score] ?? '—'
}

const CSS = `
  :root {
    --bg:#EFEDE8; --surface:#F5F3EF; --surface2:#EAE7E1;
    --border:rgba(180,155,110,0.18); --border-md:rgba(180,155,110,0.28);
    --gold:#B8924A; --gold-lt:#D4AD72; --bronze:#8F6828;
    --muted:#7A6E5F; --text:#1E1C18; --text-sm:#3A3630; --green:#4A7A4A; --red:#C0392B;
  }
  body.dark {
    --bg:#231512;
    --surface:#2C1A16;
    --surface2:#3A2218;
    --border:rgba(201,168,76,0.15);
    --border-md:rgba(201,168,76,0.28);
    --gold:#C9A84C;
    --gold-lt:#F0D080;
    --bronze:#8B6914;
    --muted:#B89A72;
    --text:#F5F0E8;
    --text-sm:#D4C4A8;
    --green:#4CAF50;
    --red:#E57373;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:Inter,sans-serif;}
`

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData]                     = useState<DashboardData | null>(null)
  const [investments, setInvestments]       = useState<InvestmentEntry[]>([])
  const [networthItems, setNetworthItems]   = useState<NetworthItem[]>([])
  const [loading, setLoading]               = useState(true)
  const [dataSource, setDataSource]   = useState<'live' | 'none'>('none')
  const [dark, setDark]               = useState(false)

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      try {
        const res = await fetch(`/api/profile?id=${encodeURIComponent(session.user.id)}`)
        if (res.ok) {
          const json = await res.json() as {
            profile: {
              name: string; valamScore: number; valamLevel: number
              valamLevelName: string; potentialLevel?: number
              potentialLevelName?: string; goal: string
              investments: string; breakdown: DashboardData['breakdown']
            }
            investments?:   InvestmentEntry[]
            networthItems?: NetworthItem[]
          }
          const p = json.profile
          setData({
            name:               p.name,
            valamScore:         p.valamScore,
            valamLevel:         p.valamLevel,
            valamLevelName:     p.valamLevelName,
            potentialLevel:     p.potentialLevel     ?? Math.min(8, p.valamLevel + 2),
            potentialLevelName: p.potentialLevelName ?? LEVEL_NAMES_ARR[Math.min(7, p.valamLevel + 1)],
            goal:               p.goal,
            investments:        p.investments,
            breakdown:          p.breakdown,
          })
          setInvestments(json.investments ?? [])
          setNetworthItems(json.networthItems ?? [])
          setDataSource('live')
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      }
      setLoading(false)
    }
    void load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    sessionStorage.clear()
    localStorage.clear()
    router.push('/')
  }

  const allocation     = getAllocation(data?.valamLevel ?? 3)
  const currentLevel   = data?.valamLevel ?? 1
  const potentialLevel = data?.potentialLevel ?? Math.min(8, currentLevel + 2)

  const portfolioTotal = investments.reduce((s, i) => s + i.amount, 0)

  const TYPE_COLORS: Record<string, string> = {
    mf: '#B8924A', stock: '#5B8DB8', fd: '#E07B54',
    crypto: '#9B59B6', bond: '#27AE60', etf: '#16A085', realestate: '#C0392B',
  }

  const TYPE_LABELS: Record<string, string> = {
    mf: 'Mutual Fund', stock: 'Stock', fd: 'Fixed Deposit',
    crypto: 'Crypto', bond: 'Bond', etf: 'ETF', realestate: 'Real Estate',
  }

  function formatPortfolioAmt(v: number): string {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`
    if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`
    if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`
    if (v === 0)       return '₹0'
    return `₹${v.toFixed(0)}`
  }

  const portfolioByType = Object.entries(
    investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] ?? 0) + inv.amount
      return acc
    }, {} as Record<string, number>)
  )


  const LIABILITY_CATS = ['debt', 'emi', 'other_liability']
  const totalAssets = networthItems
    .filter(i => !LIABILITY_CATS.includes(i.category))
    .reduce((s, i) => s + i.amount, 0)
  const totalLiabilities = networthItems
    .filter(i => LIABILITY_CATS.includes(i.category))
    .reduce((s, i) => s + i.amount, 0)
  const netWorth = portfolioTotal + totalAssets - totalLiabilities

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
        <p style={{ fontFamily: 'Inter,sans-serif' }}>Loading...</p>
      </div>
    </main>
  )

  if (!data) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 24px' }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>📋</div>
        <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 18,
          color: 'var(--text)', marginBottom: 12 }}>No assessment found</p>
        <p style={{ fontSize: 13, marginBottom: 24 }}>
          Complete the onboarding to see your dashboard.
        </p>
        <a href="/onboarding/step1"
          style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600,
            fontSize: 14, padding: '10px 24px',
            border: '1px solid var(--gold)', borderRadius: 24 }}>
          Start Assessment →
        </a>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif' }}>
      <style>{CSS}</style>

      {/* TOP NAV */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>V</span>
          </div>
          <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 600,
            fontSize: 16, color: 'var(--text)' }}>VALAM</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
            background: 'var(--surface2)', borderRadius: 20, padding: '3px 10px',
            border: '1px solid var(--border)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%',
              background: dataSource === 'live' ? '#4CAF50' : '#FFC107' }} />
            <span style={{ color: 'var(--muted)' }}>
              {dataSource === 'live' ? 'Live' : 'Local'}
            </span>
          </div>

          <button onClick={() => setDark(!dark)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 12px', fontSize: 11,
              color: 'var(--muted)', cursor: 'pointer' }}>
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button onClick={handleSignOut}
            style={{ background: 'none', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 20, padding: '4px 14px', fontSize: 11,
              color: 'var(--muted)', cursor: 'pointer' }}>
            Sign Out
          </button>

          <div style={{ width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--gold),var(--bronze))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 600 }}>
            {data.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </div>
      </nav>

      {/* TAB BAR */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 44, display: 'flex', alignItems: 'stretch',
        position: 'sticky', top: 52, zIndex: 19 }}>
        {(['Dashboard', 'Portfolio', 'Net Worth', 'Goals', 'SIP'] as const).map(tab => (
          <div key={tab}
            onClick={() => {
              if (tab === 'Portfolio') router.push('/portfolio')
              if (tab === 'Net Worth') router.push('/networth')
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 7,
              padding: '0 18px', fontSize: 12, fontWeight: 500,
              color: tab === 'Dashboard' ? 'var(--gold)' : 'var(--muted)',
              borderBottom: tab === 'Dashboard'
                ? '2.5px solid var(--gold)' : '2.5px solid transparent',
              cursor: tab === 'Portfolio' || tab === 'Net Worth' ? 'pointer' : 'default' }}>
            {tab}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 80px' }}>

        {/* HERO */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '20px 24px',
          border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: 14 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--gold),var(--bronze))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'Playfair Display,serif',
                fontSize: 18, fontWeight: 600 }}>
                {data.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Good evening</div>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22,
                  fontWeight: 500, color: 'var(--text)' }}>{data.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {data.valamLevelName} · Level {data.valamLevel}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(143,104,40,0.08)', border: '1px solid rgba(143,104,40,0.25)',
              borderRadius: 12, padding: '5px 12px' }}>
              <span style={{ fontSize: 10, color: 'var(--bronze)', fontWeight: 700,
                letterSpacing: '.4px' }}>
                ✦ YOUR POTENTIAL: {data.potentialLevelName.toUpperCase()}
              </span>
            </div>
          </div>

          {/* WEALTH JOURNEY METER */}
          <div style={{ position: 'relative', padding: '6px 0 36px' }}>
            <div style={{ position: 'absolute', top: 18, left: '6.25%', right: '6.25%',
              height: 4, background: 'rgba(180,155,110,0.15)', borderRadius: 4 }}>
              <div style={{ height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg,var(--gold),var(--bronze))',
                width: `${(currentLevel - 1) / 7 * 100}%` }} />
              <div style={{ position: 'absolute', top: 0,
                left: `${(currentLevel - 1) / 7 * 100}%`,
                width: `${(potentialLevel - currentLevel) / 7 * 100}%`,
                height: '100%', borderRadius: 4,
                background: 'rgba(143,104,40,0.2)',
                borderRight: '2px dashed var(--bronze)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between',
              position: 'relative', zIndex: 1 }}>
              {LEVEL_NAMES_ARR.map((name, i) => {
                const lvl         = i + 1
                const isCurrent   = lvl === currentLevel
                const isDone      = lvl < currentLevel
                const isPotential = lvl === potentialLevel
                const dotSize     = isCurrent ? 36 : isPotential ? 30 : isDone ? 28 : 24
                return (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column',
                    alignItems: 'center', flex: 1 }}>
                    <div style={{ width: dotSize, height: dotSize, borderRadius: '50%',
                      background: isDone || isCurrent ? 'var(--gold)'
                        : isPotential ? 'rgba(143,104,40,0.1)' : 'var(--surface2)',
                      border: isPotential ? '2.5px dashed var(--bronze)' : 'none',
                      boxShadow: isCurrent
                        ? '0 0 0 5px rgba(184,146,74,0.15),0 0 0 9px rgba(184,146,74,0.07)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: isCurrent ? -4 : isPotential ? -2 : 2,
                      transition: 'all .2s' }}>
                      {isDone    && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      {isCurrent && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{lvl}</span>}
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 600, marginTop: 5,
                      color: isCurrent ? 'var(--gold)' : isPotential ? 'var(--bronze)' : 'var(--muted)' }}>
                      {lvl}
                    </div>
                    <div style={{ fontSize: 8.5, textAlign: 'center', lineHeight: 1.25, marginTop: 1,
                      color: isCurrent ? 'var(--text)' : 'var(--muted)' }}>{name}</div>
                    {isCurrent   && <div style={{ fontSize: 7.5, fontWeight: 700, color: 'var(--gold)',   letterSpacing: '.4px', textTransform: 'uppercase', marginTop: 2 }}>← YOU</div>}
                    {isPotential && <div style={{ fontSize: 7.5, fontWeight: 700, color: 'var(--bronze)', letterSpacing: '.4px', textTransform: 'uppercase', marginTop: 2 }}>POTENTIAL</div>}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
              {[
                { color: 'var(--gold)',     label: 'Current level',    dashed: false },
                { color: 'var(--bronze)',   label: 'Potential range',  dashed: true  },
                { color: 'var(--surface2)', label: 'Upcoming levels',  dashed: false },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color,
                    border: l.dashed ? '1.5px dashed var(--bronze)' : 'none' }} />
                  <span style={{ fontSize: 9.5, color: 'var(--muted)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 14 }}>
          <div
            onClick={() => router.push('/portfolio')}
            style={{ background:'var(--surface)',
              borderRadius:18, padding:'18px 20px',
              border:'1px solid var(--border)',
              cursor:'pointer',
              transition:'border-color .15s, box-shadow .15s' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 0 0 2px rgba(184,146,74,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                'rgba(180,155,110,0.18)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
            }}>
            <div style={{ fontSize:10, color:'var(--muted)',
              letterSpacing:'.45px', textTransform:'uppercase',
              fontWeight:500, marginBottom:8 }}>
              Investments
            </div>
            <div style={{ fontFamily:'Playfair Display,serif',
              fontSize:22, color:'var(--text)', marginBottom:4 }}>
              {portfolioTotal > 0
                ? formatPortfolioAmt(portfolioTotal)
                : '₹0'}
            </div>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>
              {portfolioTotal > 0
                ? `${investments.length} entries tracked`
                : 'No entries yet'}
            </div>
            <div style={{ fontSize:11, color:'var(--gold)', fontWeight:600 }}>
              {portfolioTotal > 0 ? 'Manage Portfolio →' : '+ Add Investments →'}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
            border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Savings Rate</div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, color: 'var(--text)' }}>
              {savingsRateLabel(data.breakdown.savingsScore)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>of monthly income</div>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
            border: '1px solid var(--border)', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
                textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Next Milestone</div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16,
                color: 'var(--text)', marginBottom: 6 }}>
                Reach {LEVEL_NAMES_ARR[Math.min(7, currentLevel)]} Level
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                Your potential is{' '}
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{data.potentialLevelName}</span>
                {' '}— keep building your wealth velocity.
              </div>
            </div>
            <div style={{ width: 32, height: 32, border: '1px solid var(--border)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--muted)', fontSize: 14,
              flexShrink: 0, marginLeft: 12 }}>→</div>
          </div>
        </div>

        {/* ROADMAP */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '20px 22px',
          border: '1px solid var(--border)', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
                textTransform: 'uppercase', fontWeight: 500, marginBottom: 4 }}>
                Roadmap to next level
              </div>
              <div style={{ fontSize: 12, color: 'var(--gold)' }}>
                {data.valamLevelName} → {LEVEL_NAMES_ARR[Math.min(7, currentLevel)]}
              </div>
            </div>
            <div style={{ background: 'var(--gold)', color: '#fff', fontSize: 11,
              fontWeight: 600, padding: '4px 12px', borderRadius: 12 }}>
              Level {data.valamLevel}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between',
            fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>
            <span>Progress to {LEVEL_NAMES_ARR[Math.min(7, currentLevel)]}</span>
            <span style={{ color: 'var(--gold)' }}>
              {Math.round((data.valamScore - Math.floor(data.valamScore)) * 100)}%
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4,
            marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%',
              width: `${Math.round((data.valamScore - Math.floor(data.valamScore)) * 100)}%`,
              background: 'linear-gradient(90deg,var(--gold),var(--bronze))', borderRadius: 4 }} />
          </div>

          {[
            { label: 'Review your current investment allocation',        done: true  },
            { label: 'Increase monthly SIP contribution',               done: false },
            { label: 'Build 6-month emergency fund',                    done: false },
            { label: 'Explore tax-saving investments (ELSS, NPS)',      done: false },
          ].map((task, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '8px 0',
              borderBottom: i < 3 ? '1px solid rgba(180,155,110,0.1)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%',
                  background: task.done ? 'var(--gold)' : 'transparent',
                  border: task.done ? 'none' : '1.5px solid var(--border-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0 }}>
                  {task.done && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, color: task.done ? 'var(--muted)' : 'var(--text)',
                  textDecoration: task.done ? 'line-through' : 'none' }}>{task.label}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 500,
                color: task.done ? 'var(--green)' : 'var(--muted)',
                background: task.done ? 'rgba(74,122,74,0.1)' : 'var(--surface2)',
                padding: '2px 10px', borderRadius: 10 }}>
                {task.done ? 'Done' : 'Pending'}
              </div>
            </div>
          ))}
        </div>

        {/* ── BOTTOM 3-COL GRID ── */}
        <div style={{ display:'grid',
          gridTemplateColumns:'1fr 1.4fr 1fr',
          gap:12 }}>

          {/* ── COL 1: NET WORTH ── */}
          <div
            onClick={() => router.push('/networth')}
            style={{ background:'var(--surface)',
              borderRadius:18, padding:'18px 20px',
              border:'1px solid var(--border)',
              cursor:'pointer',
              transition:'border-color .15s, box-shadow .15s',
              display:'flex', flexDirection:'column',
              justifyContent:'space-between' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 0 0 2px rgba(184,146,74,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                'rgba(180,155,110,0.18)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
            }}>

            <div>
              <div style={{ fontSize:10, color:'var(--muted)',
                letterSpacing:'.45px', textTransform:'uppercase',
                fontWeight:500, marginBottom:8 }}>Net Worth</div>

              <div style={{ fontFamily:'Playfair Display,serif',
                fontSize:26, marginBottom:6,
                color: netWorth >= 0 ? 'var(--text)' : 'var(--red)' }}>
                {formatPortfolioAmt(Math.abs(netWorth))}
                {netWorth < 0 && (
                  <span style={{ fontSize:12, color:'var(--red)',
                    marginLeft:4 }}>debt</span>
                )}
              </div>

              <div style={{ display:'flex', alignItems:'center',
                gap:6, marginBottom:6 }}>
                <div style={{ width:8, height:8, borderRadius:'50%',
                  background:'var(--green)' }}/>
                <span style={{ fontSize:11, color:'var(--muted)' }}>Assets</span>
                <span style={{ fontSize:11, fontWeight:600,
                  color:'var(--text)', marginLeft:'auto' }}>
                  {formatPortfolioAmt(portfolioTotal + totalAssets)}
                </span>
              </div>

              <div style={{ display:'flex', alignItems:'center',
                gap:6, marginBottom:16 }}>
                <div style={{ width:8, height:8, borderRadius:'50%',
                  background:'var(--red)' }}/>
                <span style={{ fontSize:11, color:'var(--muted)' }}>Liabilities</span>
                <span style={{ fontSize:11, fontWeight:600,
                  color:'var(--red)', marginLeft:'auto' }}>
                  −{formatPortfolioAmt(totalLiabilities)}
                </span>
              </div>

              {(portfolioTotal + totalAssets) > 0 && (
                <div style={{ height:6, background:'var(--surface2)',
                  borderRadius:4, overflow:'hidden', marginBottom:16 }}>
                  <div style={{ height:'100%', borderRadius:4,
                    background:'linear-gradient(90deg,var(--green),var(--gold))',
                    width:`${Math.min(100, Math.round(
                      netWorth / (portfolioTotal + totalAssets) * 100
                    ))}%` }}/>
                </div>
              )}
            </div>

            <span style={{ fontSize:11, color:'var(--gold)', fontWeight:600 }}>
              Manage Net Worth →
            </span>
          </div>

          {/* ── COL 2: TOTAL INVESTED AMOUNT VS TIME ── */}
          <div style={{ background:'var(--surface)',
            borderRadius:18, padding:'18px 20px',
            border:'1px solid var(--border)' }}>

            <div style={{ display:'flex',
              justifyContent:'space-between',
              alignItems:'baseline', marginBottom:10 }}>
              <div style={{ fontSize:10, color:'var(--muted)',
                letterSpacing:'.45px', textTransform:'uppercase',
                fontWeight:500 }}>Total Invested Amount vs Time</div>
              {portfolioTotal > 0 ? (
                <span style={{ fontSize:10, color:'var(--green)',
                  fontWeight:600 }}>Live</span>
              ) : (
                <span style={{ fontSize:10, color:'var(--muted)' }}>No data</span>
              )}
            </div>

            {investments.length === 0 ? (
              <div style={{ height:130, display:'flex',
                alignItems:'center', justifyContent:'center',
                color:'var(--muted)', fontSize:11,
                flexDirection:'column', gap:8 }}>
                <span style={{ fontSize:24 }}>📊</span>
                <span>Add investments to see growth</span>
              </div>
            ) : (() => {
              const W = 320, H = 110
              const sortedDates = [...new Set(investments.map(i => i.date))].sort()
              const totalByDate = sortedDates.map(d => ({
                date: d,
                total: investments
                  .filter(i => i.date <= d)
                  .reduce((s, i) => s + i.amount, 0)
              }))
              const maxV = Math.max(...totalByDate.map(p => p.total), 1)

              function toXY(idx: number, total: number): [number, number] {
                const x = totalByDate.length === 1 ? W / 2
                  : (idx / (totalByDate.length - 1)) * W
                const y = H - (total / maxV) * (H - 10)
                return [x, y]
              }

              const pts = totalByDate.map((p, i) => toXY(i, p.total))
              const polyline = pts.map(([x,y]) => `${x},${y}`).join(' ')
              const area = `0,${H} ${polyline} ${W},${H}`

              function fmtV(v: number) {
                if (v >= 10000000) return `₹${(v/10000000).toFixed(1)}Cr`
                if (v >= 100000)   return `₹${(v/100000).toFixed(1)}L`
                if (v >= 1000)     return `₹${(v/1000).toFixed(0)}K`
                return `₹${v}`
              }

              return (
                <div>
                  <svg viewBox={`0 0 ${W} ${H+20}`} width="100%"
                    style={{ display:'block', overflow:'visible' }}>
                    <defs>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.22"/>
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {[0.25,0.5,0.75,1].map(f => (
                      <line key={f} x1={0} y1={H-f*H} x2={W} y2={H-f*H}
                        stroke="rgba(180,155,110,0.1)" strokeWidth="1"
                        strokeDasharray="4 4"/>
                    ))}
                    <line x1={0} y1={H} x2={W} y2={H}
                      stroke="rgba(180,155,110,0.18)" strokeWidth="1"/>
                    <polygon points={area} fill="url(#totalGrad)"/>
                    <polyline points={polyline} fill="none"
                      stroke="var(--gold)" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                    {pts.map(([x,y], i) => (
                      <circle key={i} cx={x} cy={y} r="3.5" fill="var(--gold)"/>
                    ))}
                    {totalByDate
                      .filter((_, i) =>
                        i === 0 ||
                        i === totalByDate.length - 1 ||
                        (totalByDate.length > 2 &&
                          i === Math.floor(totalByDate.length / 2)))
                      .map(p => {
                        const idx = totalByDate.findIndex(d => d.date === p.date)
                        const [x] = toXY(idx, 0)
                        return (
                          <text key={p.date} x={x} y={H+14}
                            fontSize="8" fill="var(--muted)"
                            textAnchor="middle" fontFamily="Inter,sans-serif">
                            {p.date.slice(5)}
                          </text>
                        )
                      })}
                  </svg>
                  <div style={{ display:'flex',
                    justifyContent:'space-between', marginTop:2 }}>
                    <span style={{ fontSize:9, color:'var(--muted)' }}>₹0</span>
                    <span style={{ fontSize:10, color:'var(--gold)',
                      fontWeight:600 }}>{fmtV(maxV)}</span>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* ── COL 3: ASSET ALLOCATION — full height, donut top + legend below ── */}
          <div style={{ background:'var(--surface)',
            borderRadius:18, padding:'18px 20px',
            border:'1px solid var(--border)',
            display:'flex', flexDirection:'column' }}>

            <div style={{ fontSize:10, color:'var(--muted)',
              letterSpacing:'.45px', textTransform:'uppercase',
              fontWeight:500, marginBottom:16 }}>
              Asset Allocation
            </div>

            {portfolioByType.length === 0 ? (
              (() => {
                const allocation = getAllocation(currentLevel)
                const circumference = 2 * Math.PI * 52
                let offset = 0
                return (
                  <div style={{ display:'flex', flexDirection:'column',
                    alignItems:'center', flex:1 }}>
                    <div style={{ position:'relative',
                      width:130, height:130, marginBottom:20 }}>
                      <svg viewBox="0 0 130 130" width="130" height="130">
                        <circle cx="65" cy="65" r="52"
                          fill="none" stroke="var(--surface2)" strokeWidth="22"/>
                        {allocation.map((a, i) => {
                          const dash = (a.pct / 100) * circumference
                          const startOffset = offset
                          offset += dash
                          const rotate = -90 + (startOffset / circumference) * 360
                          return (
                            <circle key={i} cx="65" cy="65" r="52"
                              fill="none" stroke={a.color} strokeWidth="22"
                              strokeDasharray={`${dash} ${circumference - dash}`}
                              transform={`rotate(${rotate} 65 65)`}/>
                          )
                        })}
                      </svg>
                      <div style={{ position:'absolute', top:'50%', left:'50%',
                        transform:'translate(-50%,-50%)', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'var(--muted)' }}>Suggested</div>
                      </div>
                    </div>
                    <div style={{ width:'100%', display:'flex',
                      flexDirection:'column', gap:8 }}>
                      {allocation.map((a, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center',
                          justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <div style={{ width:10, height:10, borderRadius:3,
                              background:a.color }}/>
                            <span style={{ fontSize:11, color:'var(--text-sm)' }}>
                              {a.label}
                            </span>
                          </div>
                          <span style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>
                            {a.pct}%
                          </span>
                        </div>
                      ))}
                      <div style={{ fontSize:9, color:'var(--muted)', marginTop:4 }}>
                        Based on your level · add portfolio entries for real data
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              (() => {
                const grand = portfolioByType.reduce((s, [,v]) => s + v, 0) || 1
                const circumference = 2 * Math.PI * 52
                let offset = 0
                const sorted = [...portfolioByType].sort((a, b) => b[1] - a[1])
                return (
                  <div style={{ display:'flex', flexDirection:'column',
                    alignItems:'center', flex:1 }}>
                    <div style={{ position:'relative',
                      width:130, height:130, marginBottom:20 }}>
                      <svg viewBox="0 0 130 130" width="130" height="130">
                        <circle cx="65" cy="65" r="52"
                          fill="none" stroke="var(--surface2)" strokeWidth="22"/>
                        {sorted.map(([type, amt], i) => {
                          const dash = (amt / grand) * circumference
                          const startOffset = offset
                          offset += dash
                          const rotate = -90 + (startOffset / circumference) * 360
                          return (
                            <circle key={i} cx="65" cy="65" r="52"
                              fill="none"
                              stroke={TYPE_COLORS[type] ?? 'var(--gold)'}
                              strokeWidth="22"
                              strokeDasharray={`${dash} ${circumference - dash}`}
                              transform={`rotate(${rotate} 65 65)`}/>
                          )
                        })}
                      </svg>
                      <div style={{ position:'absolute', top:'50%', left:'50%',
                        transform:'translate(-50%,-50%)', textAlign:'center' }}>
                        <div style={{ fontFamily:'Playfair Display,serif',
                          fontSize:13, color:'var(--text)', fontWeight:500 }}>
                          {sorted.length}
                        </div>
                        <div style={{ fontSize:9, color:'var(--muted)' }}>types</div>
                      </div>
                    </div>
                    <div style={{ width:'100%', display:'flex',
                      flexDirection:'column', gap:8 }}>
                      {sorted.map(([type, amt]) => (
                        <div key={type} style={{ display:'flex', alignItems:'center',
                          justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <div style={{ width:10, height:10, borderRadius:3,
                              background: TYPE_COLORS[type] ?? 'var(--gold)' }}/>
                            <span style={{ fontSize:11, color:'var(--text-sm)' }}>
                              {TYPE_LABELS[type] ?? type}
                            </span>
                          </div>
                          <span style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>
                            {Math.round(amt / grand * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()
            )}
          </div>

        </div>

      </div>
    </main>
  )
}
