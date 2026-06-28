'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/app/context/themecontext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicProgress {
  topicOrder: number
  topicName: string
  status: 'not_started' | 'continue' | 'completed'
}

interface LevelProgress {
  [topicName: string]: 'not_started' | 'continue' | 'completed'
}

interface AllProgress {
  [level: number]: LevelProgress
}

// ─── Static data ──────────────────────────────────────────────────────────────

const LEVELS = [
  {
    level: 1, name: 'Seed', icon: '🌱',
    objective: 'Money Foundations · Asset Classes · Investing Basics · Market Foundations · Safety Net',
    hours: '5 Hours',
    groups: [
      { name: 'Money Foundations', topics: ['Inflation', "Why Saving Alone Isn't Enough", 'Time Value of Money', 'What is Investing?', 'Difference Between Saving and Investing'] },
      { name: 'Asset Classes', topics: ['Equity', 'Debt', 'Commodities', 'Real Estate', 'Cash & Cash Equivalents'] },
      { name: 'Investment Vehicles', topics: ['Stocks', 'Mutual Funds'] },
      { name: 'Risk & Return Foundations', topics: ['Risk', 'Return', 'Risk vs Reward', 'Power of Compounding'] },
      { name: 'Investing Methods', topics: ['SIP (Systematic Investment Plan)', 'Lump Sum Investing'] },
      { name: 'Market Foundations', topics: ['How Markets Create Wealth', 'What is a Stock?', 'What is a Mutual Fund?'] },
      { name: 'Safety Net', topics: ['Emergency Fund Basics'] },
    ]
  },
  {
    level: 2, name: 'Explorer', icon: '🧭',
    objective: 'Investor Behaviour · Behavioural Biases · Portfolio Foundations · Market Behaviour',
    hours: '5 Hours',
    groups: [
      { name: 'Investor Behaviour', topics: ['Staying Invested', 'SIP Discipline', 'Rupee Cost Averaging', 'Goal-Based Investing'] },
      { name: 'Behavioural Biases', topics: ['FOMO', 'Panic Selling'] },
      { name: 'Portfolio Foundations', topics: ['Diversification', 'Why Diversification Matters'] },
      { name: 'Beginner Mistakes', topics: ['Common Beginner Mistakes'] },
      { name: 'Market Behaviour', topics: ['Bull Market', 'Bear Market', 'Market Volatility', 'Market Correction', 'Market Crash', 'Market Cycles'] },
    ]
  },
  {
    level: 3, name: 'Builder', icon: '🏗️',
    objective: 'Equity Investments · Debt Investments · Commodity · Portfolio Construction · Fund Concepts',
    hours: '5 Hours',
    groups: [
      { name: 'Equity Investments', topics: ['Index Funds', 'Large Cap Funds', 'Mid Cap Funds', 'Small Cap Funds', 'Flexi Cap Funds'] },
      { name: 'Debt Investments', topics: ['Debt Funds', 'Corporate Bond Funds', 'Money Market Funds'] },
      { name: 'Commodity Investments', topics: ['Gold Funds'] },
      { name: 'Portfolio Construction', topics: ['Asset Allocation', 'Portfolio Diversification', 'Risk Comparison', 'Correlation', 'Liquidity', 'Choosing Funds for Different Goals'] },
      { name: 'Fund Concepts', topics: ['NAV', 'Expense Ratio'] },
    ]
  },
  {
    level: 4, name: 'Accelerator', icon: '🚀',
    objective: 'Portfolio Management · Wealth Protection · Tax & Behaviour · Risk Awareness · Financial Planning',
    hours: '6 Hours',
    groups: [
      { name: 'Portfolio Management', topics: ['Risk vs Return', 'Portfolio Concentration Risk', 'Asset Allocation Rebalancing', 'Portfolio Review'] },
      { name: 'Wealth Protection', topics: ['Health Insurance', 'Term Insurance', 'Emergency Planning'] },
      { name: 'Tax & Behaviour', topics: ['Tax Efficiency', 'Behavioural Finance', 'Emotional Investing', 'Wealth-Destroying Mistakes'] },
      { name: 'Risk Awareness', topics: ['Inflation Risk', 'Interest Rate Risk'] },
      { name: 'Financial Planning', topics: ['Short-Term Goals', 'Medium-Term Goals', 'Long-Term Goals'] },
    ]
  },
  {
    level: 5, name: 'Achiever', icon: '🎯',
    objective: 'Wealth Management · Advanced Planning · Income & Independence · Long-Term Thinking',
    hours: '6 Hours',
    groups: [
      { name: 'Wealth Management', topics: ['Net Worth Tracking', 'Financial Independence', 'Sequence of Returns Risk', 'Safe Withdrawal Rate', 'Wealth Preservation'] },
      { name: 'Advanced Planning', topics: ['Asset Location', 'Taxation', 'Advanced Goal Planning', 'Income Growth Strategies'] },
      { name: 'Income & Independence', topics: ['Active Income', 'Passive Income'] },
      { name: 'Long-Term Thinking', topics: ['Life Stage Planning', 'Generational Wealth', 'Lifestyle Inflation', 'Wealth Systems'] },
    ]
  },
]

const LEVEL_ICONS = ['🌱', '🧭', '🏗️', '🚀', '🎯']
const LEVEL_ICON_BG = [
  'rgba(99,153,34,0.1)',
  'rgba(55,138,221,0.1)',
  'rgba(186,117,23,0.1)',
  'rgba(127,119,221,0.1)',
  'rgba(200,50,100,0.1)',
]

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
  :root {
    --bg: #EFEDE8; --surface: #F5F3EF; --surface2: #EAE7E1;
    --border: rgba(180,155,110,0.18); --border-md: rgba(180,155,110,0.28);
    --gold: #B8924A; --gold-lt: #D4AD72; --gold-bg: rgba(184,146,74,0.08);
    --muted: #7A6E5F; --text: #1E1C18; --text-sm: #3A3630;
    --green: #3B6D11; --green-bg: rgba(99,153,34,0.08);
    --blue-bg: rgba(55,138,221,0.08); --blue: #185FA5;
  }
  body.dark {
    --bg: #1A0F0A; --surface: #231308; --surface2: #2A1A0E;
    --border: rgba(201,168,76,0.15); --border-md: rgba(201,168,76,0.25);
    --gold: #C9A84C; --gold-lt: #F0D080; --gold-bg: rgba(201,168,76,0.08);
    --muted: #B89A72; --text: #F5F0E8; --text-sm: #D4C4A8;
    --green: #4CAF50; --green-bg: rgba(76,175,80,0.08);
    --blue-bg: rgba(55,138,221,0.08); --blue: #60A5FA;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .enter { animation: fadeUp 0.22s ease both; }
`

// ─── Main component ───────────────────────────────────────────────────────────

export default function LearningHubPage() {
  const { dark, toggleTheme } = useTheme()
  const router = useRouter()

  const [userLevel, setUserLevel] = useState(1)
  const [progress, setProgress] = useState<AllProgress>({})
  const [openLevels, setOpenLevels] = useState<Set<number>>(new Set([1]))
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { session: sess } } = await supabase.auth.getSession()
        setSession(sess)
        if (!sess) { setLoading(false); return }

        const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
        const headers = { Authorization: `Bearer ${sess.access_token}` }

        // Fetch profile for user level
        const profileRes = await fetch(`${BASE}/profile`, { headers })
        if (profileRes.ok) {
          const profileJson = await profileRes.json()
          const lvl = profileJson.profile?.valam_level ?? 1
          setUserLevel(lvl)
          setOpenLevels(new Set([Math.min(lvl, 5)]))
        }

        // Fetch progress for all levels 1–5
        const allProgress: AllProgress = {}
        await Promise.all([1, 2, 3, 4, 5].map(async (lvl) => {
          try {
            const res = await fetch(`${BASE}/learning/${lvl}`, { headers })
            if (res.ok) {
              const json = await res.json()
              const lvlProgress: LevelProgress = {}
              for (const topic of (json.topics ?? [])) {
                lvlProgress[topic.topicName] = topic.status
              }
              allProgress[lvl] = lvlProgress
            }
          } catch { /* level may have no content */ }
        }))
        setProgress(allProgress)
      } catch (e) {
        console.error('[learning-hub]', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function toggleLevel(lvl: number) {
    setOpenLevels(prev => {
      const next = new Set(prev)
      if (next.has(lvl)) next.delete(lvl)
      else next.add(lvl)
      return next
    })
  }

  function getTopicStatus(level: number, topicName: string): 'not_started' | 'continue' | 'completed' {
    return progress[level]?.[topicName] ?? 'not_started'
  }

  function getLevelTopicCount(levelData: typeof LEVELS[0]): number {
    return levelData.groups.reduce((sum, g) => sum + g.topics.length, 0)
  }

  function getLevelCompletedCount(levelData: typeof LEVELS[0]): number {
    const lvlProgress = progress[levelData.level] ?? {}
    return levelData.groups.reduce((sum, g) =>
      sum + g.topics.filter(t => lvlProgress[t] === 'completed').length, 0)
  }

  function getLevelBadge(lvl: number): { label: string; color: string; bg: string } {
    if (lvl < userLevel) return { label: 'Completed', color: 'var(--green)', bg: 'var(--green-bg)' }
    if (lvl === userLevel) return { label: 'In Progress', color: 'var(--gold)', bg: 'var(--gold-bg)' }
    if (lvl <= userLevel + 1) return { label: 'Unlocked', color: 'var(--blue)', bg: 'var(--blue-bg)' }
    return { label: 'Locked', color: 'var(--muted)', bg: 'var(--surface2)' }
  }

  function isLevelLocked(lvl: number): boolean {
    return lvl > userLevel + 1
  }

  // Compute overall progress for the ring
  const totalTopics = LEVELS.reduce((sum, ld) => sum + getLevelTopicCount(ld), 0)
  const completedTopics = LEVELS.reduce((sum, ld) => sum + getLevelCompletedCount(ld), 0)
  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
  const circumference = 2 * Math.PI * 34
  const dashOffset = circumference - (progressPct / 100) * circumference

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <style>{CSS}</style>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading your learning journey…</div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
      <style>{CSS}</style>

      {/* ── Nav ── */}
      <nav style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 48px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>V</Link>
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>VALAM</Link>
          </span>
          <span style={{ fontSize: 11, color: 'var(--gold)', background: 'var(--gold-bg)', borderRadius: 20, padding: '2px 10px', border: '1px solid rgba(184,146,74,0.25)', marginLeft: 4, fontWeight: 500 }}>
            Learning Hub
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggleTheme} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            {dark ? '☀ Light' : '◑ Dark'}
          </button>
          <Link href="/dashboard" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px' }}>
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 48px 32px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48 }}>
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 16 }}>
            Learning Hub
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 500, lineHeight: 1.15, color: 'var(--text)', marginBottom: 14, letterSpacing: '-0.02em' }}>
            Financial<br /><em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Learning Journey</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 400 }}>
            Master personal finance one level at a time — from money foundations to advanced wealth strategy.
          </p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 20 }}>Your Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--surface2)" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--gold)" strokeWidth="6"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{progressPct}%</span>
                <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>DONE</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                Level {Math.min(userLevel, 5)} — {LEVELS[Math.min(userLevel, 5) - 1]?.name ?? 'Seed'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {completedTopics} of {totalTopics} topics done
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Your Level', value: `${LEVEL_ICONS[Math.min(userLevel, 5) - 1]} ${LEVELS[Math.min(userLevel, 5) - 1]?.name}`, gold: true },
              { label: 'Topics Done', value: `${completedTopics} / ${totalTopics}`, gold: false },
              { label: 'Levels in Journey', value: '5 levels', gold: false },
              { label: 'Est. Total', value: '~28 Hours', gold: false },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{stat.label}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: stat.gold ? 'var(--gold)' : 'var(--text)' }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 20px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
        <Link href="/dashboard" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Dashboard</Link>
        <span>/</span>
        <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Learning Hub</span>
      </div>

      {/* ── Section header ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 6 }}>Learning Path</div>
        <div style={{ fontSize: 22, fontWeight: 400, color: 'var(--text)', fontFamily: 'Playfair Display, serif' }}>Five levels to financial clarity</div>
      </div>

      {/* ── Level accordion cards ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LEVELS.map((ld, idx) => {
            const isOpen = openLevels.has(ld.level)
            const locked = isLevelLocked(ld.level)
            const badge = getLevelBadge(ld.level)
            const totalCount = getLevelTopicCount(ld)
            const doneCount = getLevelCompletedCount(ld)

            return (
              <div key={ld.level} style={{
                background: 'var(--surface)',
                border: `1px solid ${isOpen ? 'var(--border-md)' : 'var(--border)'}`,
                borderRadius: 18,
                overflow: 'hidden',
                opacity: locked ? 0.5 : 1,
                transition: 'border-color 0.2s',
              }}>
                {/* Level header */}
                <div
                  onClick={() => !locked && toggleLevel(ld.level)}
                  style={{
                    display: 'grid', gridTemplateColumns: '56px 1fr auto',
                    gap: 20, alignItems: 'center', padding: '22px 28px',
                    cursor: locked ? 'default' : 'pointer',
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: LEVEL_ICON_BG[idx],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {locked ? '🔒' : ld.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>
                      Level {ld.level} — {ld.name}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ld.objective}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20,
                      color: badge.color, background: badge.bg, border: `1px solid ${badge.color}33`,
                    }}>{badge.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {doneCount}/{totalCount} done
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ld.hours}</span>
                    <span style={{ fontSize: 18, color: 'var(--gold)', transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                      ▾
                    </span>
                  </div>
                </div>

                {/* Level body — topic groups */}
                {isOpen && !locked && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '8px 28px 28px' }} className="enter">
                    {ld.groups.map(group => (
                      <div key={group.name} style={{ marginTop: 24 }}>
                        {/* Group label */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14,
                        }}>
                          {group.name}
                          <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>
                            {group.topics.length} {group.topics.length === 1 ? 'topic' : 'topics'}
                          </span>
                          <div style={{ flex: 1, height: 0.5, background: 'var(--border)' }} />
                        </div>
                        {/* Topic grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                          {group.topics.map(topicName => {
                            const status = getTopicStatus(ld.level, topicName)
                            const allTopics = ld.groups.flatMap(g => g.topics)
                            const topicIdx = allTopics.indexOf(topicName) + 1

                            return (
                              <div
                                key={topicName}
                                onClick={() => router.push(`/learning/${ld.level}/${topicIdx}`)}
                                style={{
                                  background: 'var(--surface2)',
                                  border: `1px solid ${status === 'completed' ? 'rgba(99,153,34,0.3)' : status === 'continue' ? 'rgba(184,146,74,0.4)' : 'var(--border)'}`,
                                  borderRadius: 12, padding: '14px 16px 36px',
                                  cursor: 'pointer', position: 'relative',
                                  transition: 'border-color 0.15s, transform 0.12s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)' }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLDivElement).style.transform = '';
                                  (e.currentTarget as HTMLDivElement).style.borderColor = status === 'completed' ? 'rgba(99,153,34,0.3)' : status === 'continue' ? 'rgba(184,146,74,0.4)' : 'var(--border)'
                                }}
                              >
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 8, lineHeight: 1.35 }}>
                                  {topicName}
                                </div>
                                <div style={{
                                  fontSize: 11, fontWeight: 500,
                                  color: status === 'completed' ? 'var(--green)' : status === 'continue' ? 'var(--gold)' : 'var(--muted)',
                                  position: 'absolute', bottom: 12, left: 16,
                                }}>
                                  {status === 'completed' ? '✓ Completed' : status === 'continue' ? '→ Continue' : 'Not started'}
                                </div>
                                <div style={{
                                  position: 'absolute', bottom: 10, right: 14,
                                  fontSize: 10, fontWeight: 600, color: 'var(--gold)',
                                }}>
                                  Learn →
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
