'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LEVEL_NAMES_ARR } from '@/lib/valam'
import Link from 'next/link'

interface DashboardData {
  name: string
  age: number
  valamScore: number
  valamLevel: number
  valamLevelName: string
  potentialScore: number
  potentialLevel: number
  potentialLevelName: string
  goal: string
  investments: string
  scoreStatus: 'promotion' | 'regression' | 'stable'
  calculatedScore: number
  currentScore: number
  breakdown: {
    savingsScore: number
    investmentsScore: number
    incomeScore: number
    experienceScore: number
    ageScore: number
  }
}

interface UserTask {
  priority: number
  task_code: string
  title: string
  description: string
  progress: number
}

interface InvestmentEntry {
  id: string
  date?: string
  type: string
  amount: number
}

interface NetworthItem {
  id: string
  category: string
  label: string
  amount: number
}

interface RoadmapTaskEntry {
  rank: number
  factor: string
  taskType: string
  title: string
  detail?: string
  allowAllocationDiscussion: boolean
}

interface RoadmapTaskResult {
  weakestFactor: string
  weightedGap: number
  task: RoadmapTaskEntry
  tasks: RoadmapTaskEntry[]
  currentLevel: number
  currentLevelName: string
  nextLevelName: string | null
  progressToNextLevel: number
}

interface RoadmapResponse {
  task: RoadmapTaskResult | null
  tasks?: RoadmapTaskEntry[]
  explanation: string
  source: 'llm' | 'cache' | 'fallback' | 'error'
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

function getPotentialLevel(age: number): number {
  if (age < 40) return 8  // Legend
  if (age <= 70) return 7  // Wealth Architect
  return 6                 // Wealth Creator
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [investments, setInvestments] = useState<InvestmentEntry[]>([])
  const [networthItems, setNetworthItems] = useState<NetworthItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'none'>('none')
  const [dark, setDark] = useState(false)
  const [milestonesUnlocked, setMilestonesUnlocked] = useState(0)
  const [recentMilestones, setRecentMilestones] = useState<{ name: string; unlocked_at: string }[]>([])
  const [savingsRate, setSavingsRate] = useState(0)
  const [monthlySavingsRate, setMonthlySavingsRate] = useState<number | null>(null)
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null)
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [recentLearning, setRecentLearning] = useState<{ topicName: string; status: string }[]>([])

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
      const headers = { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }

      try {
        const [profileRes, tasksRes, milestonesRes, roadmapRes, learningRes] = await Promise.all([
          fetch(`${BASE}/profile`, { headers }),
          fetch(`${BASE}/tasks`, { headers }),
          fetch(`${BASE}/milestones`, { headers }),
          fetch(`${BASE}/roadmap`, { headers }),
          fetch(`${BASE}/learning/recent`, { headers }),
        ])
        if (profileRes.ok) {
          const json = await profileRes.json() as {
            profile: {
              name: string; age: number; valamScore: number; valamLevel: number
              valamLevelName: string; potentialScore?: number
              potentialLevel?: number; potentialLevelName?: string
              goal: string; investments: string
              breakdown: DashboardData['breakdown']
            }
            scoreStatus?: 'promotion' | 'regression' | 'stable'
            calculatedScore?: number
            currentScore?: number
            investments?: InvestmentEntry[]
            networthItems?: NetworthItem[]
            liveSavingsRate?: number
            monthlySavingsRate?: number | null
          }
          const p = json.profile
          const computedPotLevel = getPotentialLevel(p.age ?? 0)
          const status = json.scoreStatus ?? 'stable'
          if (status === 'promotion') {
            sessionStorage.setItem('valam_promoted', '1')
          }
          setData({
            name: p.name,
            age: p.age ?? 0,
            valamScore: json.currentScore ?? p.valamScore,
            valamLevel: p.valamLevel,
            valamLevelName: p.valamLevelName,
            potentialScore: p.potentialScore ?? 0,
            potentialLevel: computedPotLevel,
            potentialLevelName: LEVEL_NAMES_ARR[computedPotLevel - 1],
            goal: p.goal,
            investments: p.investments,
            scoreStatus: status,
            calculatedScore: json.calculatedScore ?? p.valamScore,
            currentScore: json.currentScore ?? p.valamScore,
            breakdown: p.breakdown,
          })
          if (tasksRes.ok) {
            console.log('tasks response',tasksRes)
            const json = await tasksRes.json()
            setTasks(json.tasks ?? [])
}
          setInvestments(json.investments ?? [])
          setNetworthItems(json.networthItems ?? [])
          setSavingsRate(json.liveSavingsRate ?? 0)
          setMonthlySavingsRate(json.monthlySavingsRate ?? null)
          setDataSource('live')
        }
        if (milestonesRes.ok) {
          const mJson = await milestonesRes.json() as {
            milestones: { name: string; unlocked: boolean; unlocked_at: string | null }[]
            unlockedCount: number
          }
          setMilestonesUnlocked(mJson.unlockedCount ?? 0)
          const recent = (mJson.milestones ?? [])
            .filter(m => m.unlocked && m.unlocked_at)
            .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
            .slice(0, 3)
            .map(m => ({ name: m.name, unlocked_at: m.unlocked_at! }))
          setRecentMilestones(recent)
        }
        if (roadmapRes.ok) {
          const rJson = await roadmapRes.json() as RoadmapResponse
          setRoadmap(rJson)
        }
        if (learningRes.ok) {
          const lJson = await learningRes.json() as { recent: { topicName: string; status: string }[] }
          setRecentLearning(lJson.recent ?? [])
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err)
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

  const liveScore = data?.calculatedScore ?? data?.currentScore ?? 0
  const liveLevel = liveScore >= 7.5 ? 8 : Math.floor(liveScore)
  const liveLevelName = LEVEL_NAMES_ARR[Math.max(0, liveLevel - 1)] ?? 'Seed'

  const currentLevel = liveLevel
  const potentialLevel = data?.potentialLevel ?? Math.min(8, currentLevel + 2)

  const portfolioTotal = investments.reduce((s, i) => s + i.amount, 0)

  useEffect(() => {
  async function updateTotalInvestments() {
    if (investments.length === 0) return

    const portfolioTotal = investments.reduce(
      (sum, inv) => sum + inv.amount,
      0
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const BASE =
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      'http://localhost:5000'

    await fetch(`${BASE}/profile/inv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        totalinvestments: portfolioTotal,
      }),
    })
  }

  updateTotalInvestments()
}, [investments])

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
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`
    if (v === 0) return '₹0'
    return `₹${v.toFixed(0)}`
  }

  const portfolioByType = Object.entries(
    investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] ?? 0) + inv.amount
      return acc
    }, {} as Record<string, number>)
  )


  const LIABILITY_CATS = ['debt', 'emi', 'other_liability', 'vehicle_loan']
  const totalAssets = networthItems
    .filter(i => !LIABILITY_CATS.includes(i.category))
    .reduce((s, i) => s + i.amount, 0)
  const totalLiabilities = networthItems
    .filter(i => LIABILITY_CATS.includes(i.category))
    .reduce((s, i) => s + i.amount, 0)
  const netWorth = portfolioTotal + totalAssets - totalLiabilities

  if (loading) return (
    <main style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
        <p style={{ fontFamily: 'Inter,sans-serif' }}>Loading...</p>
      </div>
    </main>
  )

  if (!data) return (
    <main style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 24px' }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>📋</div>
        <p style={{
          fontFamily: 'Playfair Display,serif', fontSize: 18,
          color: 'var(--text)', marginBottom: 12
        }}>No assessment found</p>
        <p style={{ fontSize: 13, marginBottom: 24 }}>
          Complete the onboarding to see your dashboard.
        </p>
        <a href="/onboarding/step1"
          style={{
            color: 'var(--gold)', textDecoration: 'none', fontWeight: 600,
            fontSize: 14, padding: '10px 24px',
            border: '1px solid var(--gold)', borderRadius: 24
          }}>
          Start Assessment →
        </a>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif' }}>
      <style>{CSS}</style>

      {/* TOP NAV */}
      <nav style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Link href={'/'}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>V</span> </Link>
          </div>
          <span style={{
            fontFamily: 'Playfair Display,serif', fontWeight: 600,
            fontSize: 16, color: 'var(--text)'
          }}><Link href='/'>VALAM</Link></span>
        </div>


        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
            background: 'var(--surface2)', borderRadius: 20, padding: '3px 10px',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: dataSource === 'live' ? '#4CAF50' : '#FFC107'
            }} />
            <span style={{ color: 'var(--muted)' }}>
              {dataSource === 'live' ? 'Live' : 'Local'}
            </span>
          </div>

          <button onClick={() => setDark(!dark)}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 12px', fontSize: 11,
              color: 'var(--muted)', cursor: 'pointer'
            }}>
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button onClick={handleSignOut}
            style={{
              background: 'none', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 20, padding: '4px 14px', fontSize: 11,
              color: 'var(--muted)', cursor: 'pointer'
            }}>
            Sign Out
          </button>

          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--gold),var(--bronze))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 600
          }}>
            {data.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </div>
      </nav>

      {/* TAB BAR */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 44, display: 'flex', alignItems: 'stretch',
        position: 'sticky', top: 52, zIndex: 19
      }}>
        {(['Dashboard', 'Portfolio', 'Net Worth', 'Goals', 'Allocation'] as const).map(tab => (
          <div key={tab}
            onClick={() => {
              if (tab === 'Portfolio') router.push('/portfolio')
              if (tab === 'Net Worth') router.push('/networth')
              if (tab === 'Allocation') router.push('/allocation')
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0 18px', fontSize: 12, fontWeight: 500,
              color: tab === 'Dashboard' ? 'var(--gold)' : 'var(--muted)',
              borderBottom: tab === 'Dashboard'
                ? '2.5px solid var(--gold)' : '2.5px solid transparent',
              cursor: tab === 'Portfolio' || tab === 'Net Worth' || tab === 'Allocation' ? 'pointer' : 'default'
            }}>
            {tab}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 80px' }}>

        {/* HERO */}
        <div style={{
          background: 'var(--surface)', borderRadius: 18, padding: '20px 24px',
          border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: 14
        }}>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: 18
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--gold),var(--bronze))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'Playfair Display,serif',
                fontSize: 18, fontWeight: 600
              }}>
                {data.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Good evening</div>
                <div style={{
                  fontFamily: 'Playfair Display,serif', fontSize: 22,
                  fontWeight: 500, color: 'var(--text)'
                }}>{data.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {liveLevelName} · Level {liveLevel}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                     · Score:  {liveScore}
                  </span>
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(143,104,40,0.08)', border: '1px solid rgba(143,104,40,0.25)',
              borderRadius: 12, padding: '5px 12px'
            }}>
              <span style={{
                fontSize: 10, color: 'var(--bronze)', fontWeight: 700,
                letterSpacing: '.4px'
              }}>
                ✦ YOUR POTENTIAL: {data.potentialLevelName.toUpperCase()}
              </span>
            </div>
          </div>

          {/* SCORE STATUS PILL */}
          {data.scoreStatus === 'promotion' && (
            <div style={{
              marginBottom: 14,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)',
              borderRadius: 20, padding: '5px 14px'
            }}>
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>
                ↑ Level up! Keep going
              </span>
            </div>
          )}
          

        {/* WEALTH JOURNEY METER */}
          <div style={{ position: 'relative', padding: '6px 0 0' }}>
            <div style={{
              position: 'absolute', top: 18, left: '6.25%', right: '6.25%',
              height: 4, background: 'rgba(180,155,110,0.15)', borderRadius: 4
            }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg,var(--gold),var(--bronze))',
                width: `${(currentLevel - 1) / 7 * 100}%`
              }} />
              <div style={{
                position: 'absolute', top: 0,
                left: `${(currentLevel - 1) / 7 * 100}%`,
                width: `${(potentialLevel - currentLevel) / 7 * 100}%`,
                height: '100%', borderRadius: 4,
                background: 'rgba(143,104,40,0.2)',
                borderRight: '2px dashed var(--bronze)'
              }} />
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              position: 'relative', zIndex: 1
            }}>
              {LEVEL_NAMES_ARR.map((name, i) => {
                const lvl = i + 1
                const isCurrent = lvl === currentLevel
                const isDone = lvl < currentLevel
                const isPotential = lvl === potentialLevel
                const dotSize = isCurrent ? 36 : isPotential ? 30 : isDone ? 28 : 24
                return (
                  <div key={name} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', flex: 1
                  }}>
                    <div style={{
                      width: dotSize, height: dotSize, borderRadius: '50%',
                      background: isDone || isCurrent ? 'var(--gold)'
                        : isPotential ? 'rgba(143,104,40,0.1)' : 'var(--surface2)',
                      border: isPotential ? '2.5px dashed var(--bronze)' : 'none',
                      boxShadow: isCurrent
                        ? '0 0 0 5px rgba(184,146,74,0.15),0 0 0 9px rgba(184,146,74,0.07)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: isCurrent ? -4 : isPotential ? -2 : 2,
                      transition: 'all .2s'
                    }}>
                      {isDone && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      {isCurrent && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{lvl}</span>}
                    </div>
                    <div style={{
                      fontSize: 8, fontWeight: 600, marginTop: 5,
                      color: isCurrent ? 'var(--gold)' : isPotential ? 'var(--bronze)' : 'var(--muted)'
                    }}>
                      {lvl}
                    </div>
                    <div style={{
                      fontSize: 8.5, textAlign: 'center', lineHeight: 1.25, marginTop: 1,
                      color: isCurrent ? 'var(--text)' : 'var(--muted)'
                    }}>{name}</div>
                    {isCurrent && <div style={{ fontSize: 7.5, fontWeight: 700, color: 'var(--gold)', letterSpacing: '.4px', textTransform: 'uppercase', marginTop: 2 }}>← YOU</div>}
                    {isPotential && <div style={{ fontSize: 7.5, fontWeight: 700, color: 'var(--bronze)', letterSpacing: '.4px', textTransform: 'uppercase', marginTop: 2 }}>POTENTIAL</div>}
                  </div>
                )
              })}
            </div>

            
          </div>
        </div>

        {/* ── ROW 1: 4-COL GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>

          {/* NET WORTH */}
          <div
            onClick={() => router.push('/networth')}
            style={{
              background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
              border: '1px solid var(--border)', cursor: 'pointer',
              transition: 'border-color .15s, box-shadow .15s',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)'
                ; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(184,146,74,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(180,155,110,0.18)'
                ; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
            }}>
            <div>
              <div style={{
                fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
                textTransform: 'uppercase', fontWeight: 500, marginBottom: 8
              }}>Net Worth</div>
              <div style={{
                fontFamily: 'Playfair Display,serif', fontSize: 22, marginBottom: 6,
                color: netWorth >= 0 ? 'var(--text)' : 'var(--red)'
              }}>
                {formatPortfolioAmt(Math.abs(netWorth))}
                {netWorth < 0 && <span style={{ fontSize: 12, color: 'var(--red)', marginLeft: 4 }}>debt</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Assets</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', marginLeft: 'auto' }}>
                  {formatPortfolioAmt(portfolioTotal + totalAssets)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)' }} />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Liabilities</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--red)', marginLeft: 'auto' }}>
                  −{formatPortfolioAmt(totalLiabilities)}
                </span>
              </div>
              {(portfolioTotal + totalAssets) > 0 && (
                <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg,var(--green),var(--gold))',
                    width: `${Math.min(100, Math.round(netWorth / (portfolioTotal + totalAssets) * 100))}%`
                  }} />
                </div>
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>Manage Net Worth →</span>
          </div>

          {/* INCOME & SAVINGS */}
          <div
            onClick={() => router.push('/income')}
            style={{
              background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
              border: '1px solid var(--border)', cursor: 'pointer',
              transition: 'border-color .15s, box-shadow .15s',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)'
                ; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(184,146,74,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(180,155,110,0.18)'
                ; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
            }}>
            <div>
              <div style={{
                fontSize: 10, color: 'var(--muted)',
                letterSpacing: '.45px', textTransform: 'uppercase',
                fontWeight: 500, marginBottom: 8
              }}>Income &amp; Savings</div>
              {savingsRate > 0 ? (
                <>
                  <div style={{
                    fontFamily: 'Playfair Display,serif',
                    fontSize: 24, color: 'var(--text)', marginBottom: 4
                  }}>
                    {savingsRate}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                    Savings rate (FY)
                  </div>
                  {monthlySavingsRate !== null && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
                      This month:{' '}
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                        {monthlySavingsRate}%
                      </span>
                    </div>
                  )}
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(74,122,74,0.08)', borderRadius: 10,
                    border: '1px solid rgba(74,122,74,0.15)', marginBottom: 8
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6 }}>
                      invested ÷ income this financial year
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    fontFamily: 'Playfair Display,serif',
                    fontSize: 24, color: 'var(--text)', marginBottom: 4
                  }}>
                    —
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
                    Add income to calculate
                  </div>
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(184,146,74,0.06)', borderRadius: 10,
                    border: '1px dashed rgba(184,146,74,0.2)', marginBottom: 8
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6 }}>
                      Track your income sources and savings rate on the Income page.
                    </div>
                  </div>
                </>
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>Track Income →</span>
          </div>

          {/* MILESTONES */}
          <div onClick={() => router.push('/milestones')}
            style={{
              background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
              cursor: 'pointer'
            }}>
            <div style={{
              fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 14
            }}>Milestones</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,var(--gold),var(--bronze))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0
              }}>🏆</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
                  {milestonesUnlocked}
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>/80</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>unlocked</div>
              </div>
            </div>
            {recentMilestones.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {recentMilestones.map(m => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--gold)' }}>✓</span>
                    <span style={{ fontSize: 10, color: 'var(--text-sm)', lineHeight: 1.3 }}>{m.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>
                Add investments & income to start unlocking milestones.
              </div>
            )}
            <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
              <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>View All →</span>
            </div>
          </div>

          {/* LEARNING */}
          <div style={{
            background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 14
            }}>Learning</div>
            {recentLearning.length === 0 ? (
              <div style={{
                fontSize: 12, color: 'var(--muted)', lineHeight: 1.7,
                padding: '8px 0 4px'
              }}>
                Start learning to track your progress.
              </div>
            ) : recentLearning.map((item, i) => {
              const emojis = ['📘', '📗', '📙']
              const isDone = item.status === 'completed'
              const isContinue = item.status === 'continue'
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: i < recentLearning.length - 1
                    ? '1px solid rgba(180,155,110,0.08)' : 'none'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isDone
                      ? 'linear-gradient(135deg,var(--gold),var(--bronze))'
                      : 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                  }}>
                    {emojis[i] ?? '📖'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, color: 'var(--text)', fontWeight: 500,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {item.topicName}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 500,
                    color: isDone ? 'var(--green)' : isContinue ? 'var(--gold)' : 'var(--muted)',
                    background: isDone
                      ? 'rgba(74,122,74,0.1)'
                      : isContinue ? 'rgba(184,146,74,0.1)' : 'var(--surface2)',
                    padding: '2px 8px', borderRadius: 8, flexShrink: 0
                  }}>
                    {isDone ? '✓' : isContinue ? 'Continue' : 'Soon'}
                  </div>
                </div>
              )
            })}
            <Link href={`/learning/${currentLevel}`}
              style={{
                marginTop: 12, display: 'inline-block', fontSize: 9,
                color: 'var(--gold)', fontWeight: 600, letterSpacing: '.3px',
                textDecoration: 'none'
              }}>
              OPEN LEARNING HUB →
            </Link>
          </div>

        </div>

       {/* ── ROW 2: TASKS ── */}
<div style={{
  background: 'var(--surface)', borderRadius: 18, padding: '20px 22px',
  border: '1px solid var(--border)', marginBottom: 14
}}>
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14
  }}>
    <div>
      <div style={{
        fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
        textTransform: 'uppercase', fontWeight: 500, marginBottom: 4
      }}>
        Tasks
      </div>
      <div style={{ fontSize: 12, color: 'var(--gold)' }}>
        Your top priorities
      </div>
    </div>

    <div style={{
      background: 'var(--gold)', color: '#fff', fontSize: 11,
      fontWeight: 600, padding: '4px 12px', borderRadius: 12
    }}>
      {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
    </div>
  </div>

  {tasks.length === 0 ? (
    <div style={{ padding: '12px 0' }}>
      <span style={{
        fontSize: 12,
        color: 'var(--muted)',
        lineHeight: 1.6
      }}>
        No tasks yet. Try adding your financial data to discover personalized
        tasks that will help grow your VALAM!
      </span>
    </div>
  ) : (
    <div style={{ paddingTop: 4 }}>
      {tasks.map((task, idx) => (
        <div
          key={task.task_code}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: idx < tasks.length - 1 ? 14 : 0,
            paddingBottom: idx < tasks.length - 1 ? 14 : 0,
            borderBottom:
              idx < tasks.length - 1
                ? '1px solid var(--border)'
                : 'none'
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              flexShrink: 0,
              marginTop: 1,
              background: idx === 0 ? 'var(--gold)' : 'var(--surface2)',
              border: idx > 0 ? '1px solid var(--border)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                color: idx === 0 ? '#fff' : 'var(--muted)',
                fontSize: 10,
                fontWeight: 700
              }}
            >
              {idx + 1}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: idx === 0 ? 13 : 12,
                fontWeight: idx === 0 ? 600 : 500,
                color: idx === 0 ? 'var(--text)' : 'var(--text-sm)',
                lineHeight: 1.4,
                marginBottom: 5
              }}
            >
              {task.title}
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                lineHeight: 1.55,
                marginBottom: 8
              }}
            >
              {task.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        {/* ── ROW 3: 3-COL GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 12 }}>

          {/* COL 1: INVESTMENTS */}
          <div
            onClick={() => router.push('/portfolio')}
            style={{
              background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
              border: '1px solid var(--border)', cursor: 'pointer',
              transition: 'border-color .15s, box-shadow .15s'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)'
                ; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(184,146,74,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(180,155,110,0.18)'
                ; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
            }}>
            <div style={{
              fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 8
            }}>Investments</div>
            <div style={{
              fontFamily: 'Playfair Display,serif', fontSize: 22,
              color: 'var(--text)', marginBottom: 4
            }}>
              {portfolioTotal > 0 ? formatPortfolioAmt(portfolioTotal) : '₹0'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
              {portfolioTotal > 0 ? `${investments.length} entries tracked` : 'No entries yet'}
            </div>
            {portfolioByType.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                {[...portfolioByType].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type, amt]) => (
                  <div key={type}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 10, color: 'var(--muted)', marginBottom: 2
                    }}>
                      <span>{TYPE_LABELS[type] ?? type}</span>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                        {Math.round(amt / portfolioTotal * 100)}%
                      </span>
                    </div>
                    <div style={{
                      height: 3, background: 'var(--surface2)',
                      borderRadius: 4, overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round(amt / portfolioTotal * 100)}%`,
                        background: TYPE_COLORS[type] ?? 'var(--gold)', borderRadius: 4
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>
              {portfolioTotal > 0 ? 'Manage Portfolio →' : '+ Add Investments →'}
            </div>
          </div>

          {/* COL 2: CHART */}
          <div style={{
            background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginBottom: 10
            }}>
              <div style={{
                fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
                textTransform: 'uppercase', fontWeight: 500
              }}>Total Invested Amount vs Time</div>
              {portfolioTotal > 0
                ? <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>Live</span>
                : <span style={{ fontSize: 10, color: 'var(--muted)' }}>No data</span>}
            </div>
            {investments.length === 0 ? (
              <div style={{
                height: 130, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--muted)', fontSize: 11,
                flexDirection: 'column', gap: 8
              }}>
                <span style={{ fontSize: 24 }}>📊</span>
                <span>Add investments to see growth</span>
              </div>
            ) : (() => {
              const W = 360, H = 120
              const todayStr = new Date().toISOString().slice(0, 10)
              const sortedDates = [...new Set(investments.map(i => i.date ?? todayStr))].sort()
              const totalByDate = sortedDates.map(d => ({
                date: d,
                total: investments.filter(i => (i.date ?? todayStr) <= d).reduce((s, i) => s + i.amount, 0)
              }))
              const maxV = Math.max(...totalByDate.map(p => p.total), 1)
              function toXY(idx: number, total: number): [number, number] {
                const x = totalByDate.length === 1 ? W / 2 : (idx / (totalByDate.length - 1)) * W
                const y = H - (total / maxV) * (H - 10)
                return [x, y]
              }
              const pts = totalByDate.map((p, i) => toXY(i, p.total))
              const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ')
              const area = `0,${H} ${polyline} ${W},${H}`
              function fmtV(v: number) {
                if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`
                if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
                if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
                return `₹${v}`
              }
              return (
                <div>
                  <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%"
                    style={{ display: 'block', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="tg2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75, 1].map(f => (
                      <line key={f} x1={0} y1={H - f * H} x2={W} y2={H - f * H}
                        stroke="rgba(180,155,110,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    ))}
                    <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(180,155,110,0.18)" strokeWidth="1" />
                    <polygon points={area} fill="url(#tg2)" />
                    <polyline points={polyline} fill="none" stroke="var(--gold)"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="3.5" fill="var(--gold)" />
                    ))}
                    {totalByDate
                      .filter((_, i) => i === 0 || i === totalByDate.length - 1 ||
                        (totalByDate.length > 2 && i === Math.floor(totalByDate.length / 2)))
                      .map(p => {
                        const idx = totalByDate.findIndex(d => d.date === p.date)
                        const [x] = toXY(idx, 0)
                        return (
                          <text key={p.date} x={x} y={H + 14} fontSize="8" fill="var(--muted)"
                            textAnchor="middle" fontFamily="Inter,sans-serif">
                            {p.date.slice(5)}
                          </text>
                        )
                      })}
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 9, color: 'var(--muted)' }}>₹0</span>
                    <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>{fmtV(maxV)}</span>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* COL 3: ASSET ALLOCATION */}
          <div onClick={() => router.push('/allocation')}
            style={{
              background: 'var(--surface)', borderRadius: 18, padding: '18px 20px',
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
              cursor: 'pointer'
            }}>
            <div style={{
              fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 16
            }}>Asset Allocation</div>
            {portfolioByType.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', flex: 1
              }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
                  Add investments to see allocation
                </div>
              </div>
            ) : (() => {
              const grand = portfolioByType.reduce((s, [, v]) => s + v, 0) || 1
              const circumference = 2 * Math.PI * 52
              let offset = 0
              const sorted = [...portfolioByType].sort((a, b) => b[1] - a[1])
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ position: 'relative', width: 130, height: 130, marginBottom: 20 }}>
                    <svg viewBox="0 0 130 130" width="130" height="130">
                      <circle cx="65" cy="65" r="52" fill="none" stroke="var(--surface2)" strokeWidth="22" />
                      {sorted.map(([type, amt], i) => {
                        const dash = (amt / grand) * circumference
                        const startOffset = offset
                        offset += dash
                        const rotate = -90 + (startOffset / circumference) * 360
                        return (
                          <circle key={i} cx="65" cy="65" r="52" fill="none"
                            stroke={TYPE_COLORS[type] ?? 'var(--gold)'} strokeWidth="22"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            transform={`rotate(${rotate} 65 65)`} />
                        )
                      })}
                    </svg>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)', textAlign: 'center'
                    }}>
                      <div style={{
                        fontFamily: 'Playfair Display,serif',
                        fontSize: 13, color: 'var(--text)', fontWeight: 500
                      }}>{sorted.length}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)' }}>types</div>
                    </div>
                  </div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sorted.map(([type, amt]) => (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: 3,
                            background: TYPE_COLORS[type] ?? 'var(--gold)'
                          }} />
                          <span style={{ fontSize: 11, color: 'var(--text-sm)' }}>{TYPE_LABELS[type] ?? type}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
                          {Math.round(amt / grand * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </main>
  )
}
