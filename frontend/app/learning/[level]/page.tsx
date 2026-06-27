'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '../../context/themecontext'
import Link from 'next/link'

// ── Phase 1: Constants ────────────────────────────────────────────────────────

const EXPERIENCE_TIERS = [
  { key: 'beginner',     label: 'Beginner',      levels: [1],     accent: '#639922' },
  { key: 'learner',      label: 'Learner',        levels: [2, 3],  accent: '#378ADD' },
  { key: 'intermediate', label: 'Intermediate',   levels: [4, 5],  accent: '#7F77DD' },
  { key: 'advanced',     label: 'Advanced',       levels: [6, 7],  accent: '#B8963E' },
]

const LEVEL_META: Record<number, { name: string; tagline: string }> = {
  1: { name: 'Seed',             tagline: 'Build the foundation of financial literacy.' },
  2: { name: 'Explorer',         tagline: 'Understand why investing works before learning products.' },
  3: { name: 'Builder',          tagline: 'Understand the financial products available and when to use them.' },
  4: { name: 'Accelerator',      tagline: 'Learn how to combine financial products into a proper financial plan.' },
  5: { name: 'Achiever',         tagline: 'Build long-term wealth systematically.' },
  6: { name: 'Wealth Creator',   tagline: "Protect the wealth you've built." },
  7: { name: 'Wealth Architect', tagline: 'Think strategically like experienced investors and wealth managers.' },
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LESSON_TYPES: Record<string, { label: string; color: string }> = {
  theory:   { label: 'Theory',   color: '#378ADD' },
  practice: { label: 'Practice', color: '#639922' },
  quiz:     { label: 'Quiz',     color: '#7F77DD' },
}

// ── Phase 2: TypeScript interfaces ───────────────────────────────────────────

interface SubConcept {
  subConceptOrder: number
  subConceptName:  string
  explanation:     string
  checkQuestion:   string
  checkAnswer:     string
}

interface TopicGroup {
  topicOrder:   number
  topicName:    string
  subConcepts:  SubConcept[]
  status:       'not_started' | 'continue' | 'completed'
  lastViewedAt: string | null
  completedAt:  string | null
}

interface OverallStats {
  totalLevels:     number
  userLevel:       number
  topicsCompleted: number
  totalTopics:     number
}

interface RecentTopic {
  level:        number
  levelName:    string
  topicOrder:   number
  topicName:    string
  status:       string
  lastViewedAt: string
}

interface LevelData {
  level:     number
  levelName: string
  topics:    TopicGroup[]
  summary: {
    totalTopics:     number
    topicsCompleted: number
    topicsRemaining: number
  }
}

const TOTAL_TOPICS_ALL_LEVELS = 115

// ── Phase 10: CSS keyframes + dark mode via CSS variables ─────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
  :root {
    --bg:#EFEDE8; --surface:#F5F3EF; --surface2:#EAE7E1;
    --border:rgba(180,155,110,0.18); --border-md:rgba(180,155,110,0.28);
    --gold:#B8924A; --gold-lt:#D4AD72; --bronze:#8F6828;
    --muted:#7A6E5F; --text:#1E1C18; --text-sm:#3A3630; --green:#4A7A4A;
    --shadow:0 2px 10px rgba(0,0,0,0.07);
  }
  body.dark {
    --bg:#231512; --surface:#2C1A16; --surface2:#3A2218;
    --border:rgba(201,168,76,0.15); --border-md:rgba(201,168,76,0.28);
    --gold:#C9A84C; --gold-lt:#F0D080; --bronze:#8B6914;
    --muted:#B89A72; --text:#F5F0E8; --text-sm:#D4C4A8; --green:#4CAF50;
    --shadow:0 2px 10px rgba(0,0,0,0.3);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:Inter,sans-serif;}
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes spin {
    to { transform:rotate(360deg); }
  }
  .lh-card-enter { animation:fadeUp 0.26s ease both; }
  .lh-tier-tab { flex:1; padding:12px 8px; background:none; border:none; border-bottom:2px solid transparent; font-family:Inter,sans-serif; font-size:13px; cursor:pointer; transition:all 0.15s; color:var(--muted); font-weight:400; }
  .lh-tier-tab:hover { color:var(--text); }
  .lh-pill { display:block; background:var(--surface2); border:1px solid var(--border); border-radius:6px; padding:6px 10px; font-size:12px; color:var(--text-sm); line-height:1.4; }
  .lh-accordion-btn { width:100%; background:none; border:none; cursor:pointer; text-align:left; display:grid; grid-template-columns:56px 1fr auto auto; align-items:center; padding:0 20px 0 0; height:72px; }
  .lh-accordion-btn:disabled { cursor:not-allowed; }
  .lh-learn-link { font-size:11px; font-weight:500; text-decoration:none; border-radius:8px; padding:3px 10px; white-space:nowrap; transition:opacity 0.15s; }
  .lh-learn-link:hover { opacity:0.75; }
`

// ── Phase 1 helpers ───────────────────────────────────────────────────────────

function tierForLevel(level: number) {
  return EXPERIENCE_TIERS.find(t => t.levels.includes(level)) ?? EXPERIENCE_TIERS[0]
}

function statusColor(status: string): string {
  if (status === 'completed') return 'var(--green)'
  if (status === 'continue')  return 'var(--gold)'
  return 'var(--muted)'
}

function statusLabel(status: string): string {
  if (status === 'completed') return 'Completed'
  if (status === 'continue')  return 'In Progress'
  return 'Not Started'
}

function statusBg(status: string): string {
  if (status === 'completed') return 'rgba(74,122,74,0.12)'
  if (status === 'continue')  return 'rgba(184,146,74,0.12)'
  return 'var(--surface2)'
}

// ── Phase 4 sub-component: SVG Progress Ring ──────────────────────────────────

function ProgressRing({ pct, accent }: { pct: number; accent: string }) {
  const r             = 50
  const cx            = 64
  const circumference = 2 * Math.PI * r
  const offset        = circumference * (1 - Math.min(pct, 100) / 100)
  return (
    <svg width={128} height={128} style={{ display: 'block' }}>
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke="var(--surface2)" strokeWidth={10}
        transform="rotate(-90 64 64)"
      />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={accent} strokeWidth={10}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={cx} y={cx + 6}
        textAnchor="middle"
        fontSize={18} fontWeight={700}
        fontFamily="Playfair Display,serif"
        fill="var(--text)"
      >
        {pct}%
      </text>
    </svg>
  )
}

// ── Stat box (hero 2×2 grid cell) ─────────────────────────────────────────────

function StatBox({
  label, value, sub, accent,
}: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase',
        letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18,
        fontWeight: 700, color: accent, lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  )
}

// ── Phase 8: Topic group card ─────────────────────────────────────────────────

function TopicGroupCard({
  topic, level, accent, animDelay,
}: {
  topic:     TopicGroup
  level:     number
  accent:    string
  animDelay: number
}) {
  return (
    <div className="lh-card-enter" style={{ animationDelay: `${animDelay}s` }}>

      {/* Topic group header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        marginBottom: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, color: 'var(--muted)', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 6,
            padding: '2px 7px', fontWeight: 500, flexShrink: 0,
          }}>
            T{topic.topicOrder}
          </span>
          <span style={{
            fontFamily: 'Playfair Display,serif', fontSize: 14,
            fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
          }}>
            {topic.topicName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: statusColor(topic.status),
            background: statusBg(topic.status),
            borderRadius: 8, padding: '3px 9px',
          }}>
            {statusLabel(topic.status)}
          </span>
          <Link
            href={`/learning/${level}/${topic.topicOrder}`}
            className="lh-learn-link"
            style={{
              color: accent,
              border: `1px solid ${accent}40`,
              background: `${accent}0d`,
            }}>
            Learn More →
          </Link>
        </div>
      </div>

      {/* Sub-concept pills — 3-col grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 8,
      }}>
        {topic.subConcepts.map(sc => (
          <div key={sc.subConceptOrder} className="lh-pill">
            <span style={{ fontSize: 10, color: 'var(--muted)', marginRight: 5, fontWeight: 500 }}>
              {sc.subConceptOrder}.
            </span>
            {sc.subConceptName}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Phase 3 + 11: Main Page Component ────────────────────────────────────────

export default function LearningHubPage() {
  const router     = useRouter()
  const params     = useParams()
  const levelParam = Number(params?.level)

  const { dark, toggleTheme } = useTheme()

  // Phase 3: State
  const [loading,       setLoading]       = useState(true)
  const [userLevel,     setUserLevel]     = useState<number | null>(null)
  const [recentTopic,   setRecentTopic]   = useState<RecentTopic | null>(null)
  const [levelDataMap,  setLevelDataMap]  = useState<Record<number, LevelData>>({})
  const [openLevels,    setOpenLevels]    = useState<Set<number>>(new Set<number>())
  const [loadingLevels, setLoadingLevels] = useState<Set<number>>(new Set<number>())
  const [activeTier,    setActiveTier]    = useState<string>(
    tierForLevel(levelParam > 0 ? levelParam : 1).key
  )

  const tierRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const BASE     = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'

  // Phase 3: Data fetching on mount
  useEffect(() => {
    if (!levelParam || levelParam < 1 || levelParam > 7) {
      router.replace('/dashboard')
      return
    }
    void init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelParam])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.replace('/login'); return }

    const headers = { Authorization: `Bearer ${session.access_token}` }

    const [profileRes, recentRes] = await Promise.all([
      fetch(`${BASE}/profile`,         { headers }),
      fetch(`${BASE}/learning/recent`, { headers }),
    ])

    if (profileRes.ok) {
      const pJson = await profileRes.json() as {
        profile: { valamLevel: number }
        calculatedScore?: number
        currentScore?: number
      }
      const rawScore = pJson.calculatedScore ?? pJson.currentScore ?? 0
      const liveLevel = rawScore >= 7.5 ? 8 : (rawScore > 0 ? Math.floor(rawScore) : (pJson.profile?.valamLevel ?? 1))
      setUserLevel(liveLevel)
    }

    if (recentRes.ok) {
      const rJson = await recentRes.json() as { recent: RecentTopic[] }
      setRecentTopic(rJson.recent?.[0] ?? null)
    }

    setLoading(false)

    // Open URL-param level by default and fetch its data lazily
    setOpenLevels(new Set([levelParam]))
    void fetchLevel(levelParam, session.access_token)
  }

  async function fetchLevel(level: number, token?: string) {
    // Skip if already cached
    if (levelDataMap[level]) return

    setLoadingLevels(prev => { const s = new Set(prev); s.add(level); return s })

    let tok = token
    if (!tok) {
      const { data: { session } } = await supabase.auth.getSession()
      tok = session?.access_token
    }
    if (!tok) return

    try {
      const res = await fetch(`${BASE}/learning/${level}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.ok) {
        const data = await res.json() as LevelData
        setLevelDataMap(prev => ({ ...prev, [level]: data }))
      }
    } catch (e) {
      console.error('[LearningHub] fetchLevel error:', e)
    }

    setLoadingLevels(prev => { const s = new Set(prev); s.delete(level); return s })
  }

  function toggleLevel(level: number) {
    setOpenLevels(prev => {
      const next = new Set(prev)
      if (next.has(level)) {
        next.delete(level)
      } else {
        next.add(level)
        void fetchLevel(level)
      }
      return next
    })
  }

  function scrollToTier(key: string) {
    setActiveTier(key)
    const el = tierRefs.current[key]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    sessionStorage.clear()
    localStorage.clear()
    router.push('/')
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const activeTierData = EXPERIENCE_TIERS.find(t => t.key === activeTier) ?? EXPERIENCE_TIERS[0]

  const overallStats: OverallStats = {
    totalLevels:     7,
    userLevel:       userLevel ?? 1,
    topicsCompleted: Object.values(levelDataMap).reduce((s, d) => s + d.summary.topicsCompleted, 0),
    totalTopics:     Object.values(levelDataMap).reduce((s, d) => s + d.summary.totalTopics, 0),
  }

  const completedAcrossAllLevels = Object.values(levelDataMap)
    .reduce((s, d) => s + d.summary.topicsCompleted, 0)
  const journeyPct = TOTAL_TOPICS_ALL_LEVELS > 0
    ? Math.round((completedAcrossAllLevels / TOTAL_TOPICS_ALL_LEVELS) * 100)
    : 0
  const currentTier    = tierForLevel(overallStats.userLevel)
  const currentMeta    = LEVEL_META[overallStats.userLevel] ?? LEVEL_META[1]

  // ── Loading screen ─────────────────────────────────────────────────────────

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--gold)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 14px',
        }} />
        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }}>Loading Learning Hub…</p>
      </div>
    </main>
  )

  // ── Phase 11: Page wrapper — no own Navbar/Footer; has breadcrumb + dark toggle ──

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif' }}>
      <style>{CSS}</style>

      {/* Minimal sticky nav */}
      <nav style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 30,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', lineHeight: 1 }}>V</Link>
          </div>
          <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 600,
            fontSize: 16, color: 'var(--text)' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>VALAM</Link>
          </span>
          <span style={{ fontSize: 11, color: activeTierData.accent,
            background: `${activeTierData.accent}18`, borderRadius: 20,
            padding: '2px 10px', border: `1px solid ${activeTierData.accent}30`,
            marginLeft: 4, fontWeight: 500 }}>
            Learning Hub
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleTheme}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 12px', fontSize: 11,
              color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            {dark ? '☀ Light' : '◑ Dark'}
          </button>
          <button
            onClick={handleSignOut}
            style={{ background: 'transparent', border: '1px solid var(--border-md)',
              borderRadius: 20, padding: '4px 14px', fontSize: 11,
              color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Phase 9: Continue bar — only if recentTopic exists */}
      {recentTopic && (() => {
        const rt = tierForLevel(recentTopic.level)
        return (
          <div style={{
            background: `${rt.accent}12`,
            borderBottom: `1px solid ${rt.accent}30`,
            padding: '10px 28px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: rt.accent, marginBottom: 2 }}>
                Continue Learning
              </div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 14,
                fontWeight: 600, color: 'var(--text)' }}>
                {recentTopic.topicName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                Level {recentTopic.level} · {recentTopic.levelName}
              </div>
            </div>
            <Link
              href={`/learning/${recentTopic.level}/${recentTopic.topicOrder}`}
              style={{
                background: rt.accent, color: '#fff', fontWeight: 600, fontSize: 12,
                padding: '8px 20px', borderRadius: 20,
                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              Resume →
            </Link>
          </div>
        )
      })()}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
          <Link href="/dashboard" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Learning Hub</span>
        </div>

        {/* Phase 4: Hero — 2-col grid, SVG progress ring, 2×2 stats */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '32px',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: 32, alignItems: 'center',
          marginBottom: 36, boxShadow: 'var(--shadow)',
        }}>
          {/* Left col */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
              Your Financial Journey
            </div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 28,
              fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: 10 }}>
              Learning Hub
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-sm)', lineHeight: 1.6,
              maxWidth: 440, marginBottom: 22 }}>
              Build your financial knowledge level by level — from everyday money basics to wealth strategy.
            </p>

            {/* 2×2 stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 340 }}>
              <StatBox
                label="Your Level"
                value={`${overallStats.userLevel}`}
                sub={currentMeta.name}
                accent="var(--gold)"
              />
              <StatBox
                label="Current Tier"
                value={currentTier.label}
                sub={`Levels ${currentTier.levels.join(' & ')}`}
                accent={currentTier.accent}
              />
              <StatBox
                label="Topics Completed"
                value={`${completedAcrossAllLevels}`}
                sub={`of ${TOTAL_TOPICS_ALL_LEVELS} total`}
                accent="var(--green)"
              />
              <StatBox
                label="Levels Unlocked"
                value={`${Math.min(overallStats.userLevel + 1, 7)}`}
                sub="of 7 total"
                accent="var(--muted)"
              />
            </div>
          </div>

          {/* Right col: SVG progress ring */}
          <div style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <ProgressRing pct={journeyPct} accent={currentTier.accent} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Journey Progress
              </div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 13,
                fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                {completedAcrossAllLevels} of {TOTAL_TOPICS_ALL_LEVELS} topics
              </div>
            </div>
          </div>
        </div>

        {/* Phase 5: Sticky tier tabs bar */}
        <div style={{
          position: 'sticky', top: 52, zIndex: 20,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          display: 'flex', marginBottom: 40,
        }}>
          {EXPERIENCE_TIERS.map(tier => (
            <button
              key={tier.key}
              className="lh-tier-tab"
              onClick={() => scrollToTier(tier.key)}
              style={{
                borderBottom: activeTier === tier.key
                  ? `2px solid ${tier.accent}`
                  : '2px solid transparent',
                color:      activeTier === tier.key ? tier.accent : undefined,
                fontWeight: activeTier === tier.key ? 600          : undefined,
              }}>
              {tier.label}
            </button>
          ))}
        </div>

        {/* Phase 6: Tier sections */}
        {EXPERIENCE_TIERS.map(tier => (
          <div
            key={tier.key}
            ref={el => { tierRefs.current[tier.key] = el }}
            style={{ marginBottom: 56, scrollMarginTop: 104 }}>

            {/* Tier header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 28, borderRadius: 2,
                background: tier.accent, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 20,
                fontWeight: 600, color: 'var(--text)' }}>
                {tier.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)',
                background: 'var(--surface2)', borderRadius: 20,
                padding: '2px 10px', border: '1px solid var(--border)' }}>
                Level{tier.levels.length > 1 ? 's' : ''} {tier.levels.join(' & ')}
              </span>
            </div>

            {/* Phase 6: Level cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tier.levels.map(level => {
                const meta      = LEVEL_META[level]
                const isOpen    = openLevels.has(level)
                const isLoading = loadingLevels.has(level)
                const data      = levelDataMap[level]
                const locked    = userLevel !== null && level > (userLevel + 1)
                const pct       = data
                  ? Math.round(data.summary.topicsCompleted / Math.max(data.summary.totalTopics, 1) * 100)
                  : 0
                const isActive  = level === levelParam

                return (
                  <div
                    key={level}
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${isActive ? tier.accent + '50' : 'var(--border)'}`,
                      borderRadius: 16,
                      overflow: 'hidden',
                      boxShadow: isActive
                        ? `0 0 0 1px ${tier.accent}20, var(--shadow)`
                        : 'var(--shadow)',
                      opacity:   locked ? 0.55 : 1,
                      transition: 'opacity 0.2s',
                    }}>

                    {/* Phase 7: Accordion header — grid 56px 1fr auto auto */}
                    <button
                      className="lh-accordion-btn"
                      disabled={locked}
                      onClick={() => toggleLevel(level)}
                      aria-expanded={isOpen}
                      aria-label={`Level ${level}: ${meta?.name ?? ''}`}>

                      {/* Col 1 (56px): level badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: locked
                            ? 'var(--surface2)'
                            : `linear-gradient(135deg, ${tier.accent}, ${tier.accent}bb)`,
                          border: `1.5px solid ${locked ? 'var(--border)' : tier.accent + '60'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: locked ? 'var(--muted)' : '#fff',
                          fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 15,
                          flexShrink: 0,
                        }}>
                          {locked ? '🔒' : level}
                        </div>
                      </div>

                      {/* Col 2 (1fr): name + tagline */}
                      <div style={{ padding: '0 16px', overflow: 'hidden' }}>
                        <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16,
                          fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                          Level {level} · {meta?.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {locked
                            ? `Complete Level ${level - 1} to unlock`
                            : meta?.tagline}
                        </div>
                      </div>

                      {/* Col 3 (auto): status badge */}
                      <div style={{ marginRight: 12, textAlign: 'right', flexShrink: 0 }}>
                        {data ? (
                          <>
                            <div style={{
                              display: 'inline-block', fontSize: 11, fontWeight: 600,
                              color: pct === 100 ? 'var(--green)'
                                : pct > 0       ? 'var(--gold)' : 'var(--muted)',
                              background: pct === 100 ? 'rgba(74,122,74,0.12)'
                                : pct > 0       ? 'rgba(184,146,74,0.12)' : 'var(--surface2)',
                              borderRadius: 10, padding: '3px 10px',
                            }}>
                              {pct === 100 ? '✓ Complete' : pct > 0 ? `${pct}% done` : 'Not started'}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
                              {data.summary.topicsCompleted}/{data.summary.totalTopics} topics
                            </div>
                          </>
                        ) : (
                          <div style={{
                            display: 'inline-block', fontSize: 11, color: 'var(--muted)',
                            background: 'var(--surface2)', borderRadius: 10, padding: '3px 10px',
                          }}>
                            {isLoading ? 'Loading…' : locked ? 'Locked' : 'Expand'}
                          </div>
                        )}
                      </div>

                      {/* Col 4 (auto): chevron */}
                      <div style={{
                        color: 'var(--muted)', fontSize: 14, flexShrink: 0,
                        transition: 'transform 0.22s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}>
                        ▾
                      </div>
                    </button>

                    {/* Accordion body */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '24px 24px 20px' }}>
                        {isLoading ? (
                          <div style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>
                            <div style={{
                              width: 24, height: 24,
                              border: `2px solid var(--border)`,
                              borderTopColor: tier.accent, borderRadius: '50%',
                              animation: 'spin 0.7s linear infinite',
                              margin: '0 auto 10px',
                            }} />
                            <span style={{ fontSize: 13 }}>Loading topics…</span>
                          </div>
                        ) : data && data.topics.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                            {/* Phase 8: Topic groups */}
                            {data.topics.map((topic, ti) => (
                              <TopicGroupCard
                                key={topic.topicOrder}
                                topic={topic}
                                level={level}
                                accent={tier.accent}
                                animDelay={ti * 0.04}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '28px',
                            color: 'var(--muted)', fontSize: 13 }}>
                            Content coming soon for Level {level}.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Knowledge Hub Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push('/knowledge-hub')}
          onKeyDown={e => e.key === 'Enter' && router.push('/knowledge-hub')}
          style={{
            background: 'linear-gradient(135deg, var(--surface) 60%, rgba(184,150,62,0.08) 130%)',
            border: '0.5px solid rgba(184,150,62,0.25)',
            borderRadius: 20,
            padding: '32px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: 40,
            gap: 24,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(184,150,62,0.5)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(184,150,62,0.25)' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 16, height: 1.5, background: 'var(--gold)', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                KNOWLEDGE HUB
              </span>
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 400, color: 'var(--text)', marginBottom: 8 }}>
              Financial Concepts Library
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 400 }}>
              44 financial concepts — sourced, structured, and always close at hand. Search any term from VALAM.
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              {(['44 concepts', '7 collections', '✓ Searchable'] as const).map(label => (
                <span key={label} style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                  <b style={{ color: 'var(--gold)', fontWeight: 700 }}>{label.split(' ')[0]}</b>{' '}{label.split(' ').slice(1).join(' ')}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: 6 }}>
              {['⚖️', '🐻', '📈', '💡', '🏦', '📊'].map((emoji, i) => (
                <div key={i} style={{
                  width: 44, height: 44, background: 'var(--surface2)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{emoji}</div>
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
              Explore Knowledge Hub →
            </span>
          </div>
        </div>

      </div>
    </main>
  )
}
