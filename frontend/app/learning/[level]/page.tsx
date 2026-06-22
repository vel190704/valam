'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LEVEL_NAMES_ARR } from '@/lib/valam'
import Link from 'next/link'

// ── Static content maps ───────────────────────────────────────────────────────

const LEVEL_OBJECTIVES: Record<number, string> = {
  2: 'Understand why investing works before learning investment products.',
  3: 'Understand the financial products available and when to use them.',
  4: 'Learn how to combine financial products into a proper financial plan.',
  5: 'Build long-term wealth systematically.',
  6: 'Protect the wealth you\'ve built.',
  7: 'Think strategically like experienced investors and wealth managers.',
}

const TOPIC_PREVIEWS: Record<string, string> = {
  '2-1': 'Why putting money to work beats letting it sit still',
  '2-2': 'How interest on interest turns time into your most powerful asset',
  '2-3': 'Why money today is worth more than the same amount in the future',
  '2-4': 'The fundamental trade-off between uncertainty and potential reward',
  '2-5': 'How to define and prioritize what you\'re actually investing toward',
  '2-6': 'A first look at stocks, bonds, gold, cash, and real estate',
  '2-7': 'The emotional forces that cause investing mistakes — and how to counter them',
  '2-8': 'The most common early errors in investing, and how to avoid them',
  '3-1': 'What owning a share actually means and how you make money from it',
  '3-2': 'How pooled, professionally managed funds give instant diversification',
  '3-3': 'Passive investing: matching the market rather than trying to beat it',
  '3-4': 'Fixed deposits, bonds, and government debt — the safer end of the spectrum',
  '3-5': 'Physical gold, digital gold, ETFs, and Sovereign Gold Bonds compared',
  '3-6': 'PPF, EPF, NPS, and other government-backed savings schemes',
  '3-7': 'Property ownership, rental income, appreciation, and REITs',
  '3-8': 'Matching the right product to your goal, timeline, and risk tolerance',
  '4-1': 'How to split money across asset classes based on your goals and risk profile',
  '4-2': 'Assembling investments deliberately to work together toward your goals',
  '4-3': 'Spreading risk so no single loss significantly damages your overall plan',
  '4-4': 'Regular installments vs investing all at once — trade-offs explained',
  '4-5': 'Choosing investments based on specific objectives and their timelines',
  '4-6': 'Understanding how much risk you\'re both willing and able to take',
  '4-7': 'Periodically restoring your intended asset allocation as markets shift',
  '4-8': 'Income tax, capital gains, and tax-saving investments explained',
  '5-1': 'Measuring your total financial position: what you own minus what you owe',
  '5-2': 'Having enough wealth that active employment becomes a choice, not a need',
  '5-3': 'Tracking income vs expenses to maintain a consistent investing surplus',
  '5-4': 'Reducing single-source dependency while accelerating wealth growth',
  '5-5': 'The consistent habits that compound into lasting wealth over time',
  '5-6': 'The value of what you give up with every financial decision you make',
  '5-7': 'How psychological biases shape investment decisions beyond pure logic',
  '5-8': 'Building toward a financial position where active income becomes optional',
  '6-1': 'Health, life, vehicle, and property coverage — protecting what you\'ve built',
  '6-2': 'Deciding in advance how your assets will be distributed after your death',
  '6-3': 'Naming recipients for specific accounts to simplify asset transfer',
  '6-4': 'Making sure your protection is organized, documented, and usable',
  '6-5': 'Recognizing and guarding against financial fraud in the digital age',
  '6-6': 'Keeping your wealth growing faster than inflation erodes its value',
  '6-7': 'Legally structuring finances to minimize unnecessary tax liability',
  '6-8': 'Shifting focus from pure growth to protecting what you\'ve accumulated',
  '7-1': 'Correlations, factor exposures, and deliberate multi-asset structure',
  '7-2': 'Extending beyond domestic markets for broader growth and diversification',
  '7-3': 'REITs, InvITs, commodities, and venture capital beyond stocks and bonds',
  '7-4': 'How expansion, contraction, and recovery phases affect different investments',
  '7-5': 'What balance sheets, income statements, and cash flows reveal',
  '7-6': 'How collective investor behavior creates patterns beyond individual bias',
  '7-7': 'Estate transfer, family wealth, and philanthropy as one plan',
  '7-8': 'Annual reports, macroeconomics, and building your investment philosophy',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubConcept {
  subConceptOrder: number
  subConceptName:  string
  explanation:     string
  checkQuestion:   string
  checkAnswer:     string
}

interface TopicData {
  topicOrder:   number
  topicName:    string
  subConcepts:  SubConcept[]
  status:       'not_started' | 'continue' | 'completed'
  lastViewedAt: string | null
  completedAt:  string | null
}

interface LevelData {
  level:     number
  levelName: string
  topics:    TopicData[]
  summary: {
    totalTopics:     number
    topicsCompleted: number
    topicsRemaining: number
  }
}

interface RecentTopic {
  level:        number
  levelName:    string
  topicOrder:   number
  topicName:    string
  status:       string
  lastViewedAt: string
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  :root {
    --bg:#EFEDE8; --surface:#F5F3EF; --surface2:#EAE7E1;
    --border:rgba(180,155,110,0.18); --border-md:rgba(180,155,110,0.28);
    --gold:#B8924A; --gold-lt:#D4AD72; --bronze:#8F6828;
    --muted:#7A6E5F; --text:#1E1C18; --text-sm:#3A3630; --green:#4A7A4A;
  }
  body.dark {
    --bg:#231512; --surface:#2C1A16; --surface2:#3A2218;
    --border:rgba(201,168,76,0.15); --border-md:rgba(201,168,76,0.28);
    --gold:#C9A84C; --gold-lt:#F0D080; --bronze:#8B6914;
    --muted:#B89A72; --text:#F5F0E8; --text-sm:#D4C4A8; --green:#4CAF50;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:Inter,sans-serif;}
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
`

// ── Status helpers ────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function LearningLevelPage() {
  const router  = useRouter()
  const params  = useParams()
  const levelParam = Number(params?.level)

  const [dark, setDark]           = useState(false)
  const [loading, setLoading]     = useState(true)
  const [userLevel, setUserLevel] = useState<number | null>(null)
  const [levelData, setLevelData] = useState<LevelData | null>(null)
  const [recent, setRecent]       = useState<RecentTopic[]>([])
  const [dataSource, setDataSource] = useState<'live' | 'none'>('none')

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    if (!levelParam || levelParam < 1 || levelParam > 8) {
      router.replace('/dashboard')
      return
    }
    void load()
  }, [levelParam])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.replace('/login'); return }

    const BASE    = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const headers = { Authorization: `Bearer ${session.access_token}` }

    try {
      const [profileRes, levelRes, recentRes] = await Promise.all([
        fetch(`${BASE}/profile`,                 { headers }),
        fetch(`${BASE}/learning/${levelParam}`,  { headers }),
        fetch(`${BASE}/learning/recent`,         { headers }),
      ])

      if (profileRes.ok) {
        const pJson = await profileRes.json() as { profile: { valamLevel: number } }
        setUserLevel(pJson.profile?.valamLevel ?? 1)
        setDataSource('live')
      }

      if (levelRes.ok) {
        const lJson = await levelRes.json() as LevelData
        setLevelData(lJson)
      }

      if (recentRes.ok) {
        const rJson = await recentRes.json() as { recent: RecentTopic[] }
        setRecent(rJson.recent ?? [])
      }
    } catch (err) {
      console.error('[Learning] Load error:', err)
    }

    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    sessionStorage.clear()
    localStorage.clear()
    router.push('/')
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const isLocked   = userLevel !== null && levelParam > (userLevel + 1)
  const levelName  = LEVEL_NAMES_ARR[levelParam - 1] ?? `Level ${levelParam}`
  const objective  = LEVEL_OBJECTIVES[levelParam] ?? ''

  const continueTopic = levelData?.topics.find(t => t.status === 'continue') ?? null

  const totalEstTime = levelData?.topics.reduce(
    (sum, t) => sum + t.subConcepts.length * 4, 0
  ) ?? 0

  const completedEstTime = levelData?.topics
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.subConcepts.length * 4, 0) ?? 0

  const remainingEstTime = totalEstTime - completedEstTime

  // ── Loading ─────────────────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif' }}>
      <style>{CSS}</style>

      {/* NAV */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link href="/">
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>V</span>
            </Link>
          </div>
          <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 600,
            fontSize: 16, color: 'var(--text)' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>VALAM</Link>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
            background: 'var(--surface2)', borderRadius: 20, padding: '3px 10px',
            border: '1px solid var(--border)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%',
              background: dataSource === 'live' ? '#4CAF50' : '#FFC107' }} />
            <span style={{ color: 'var(--muted)' }}>
              {dataSource === 'live' ? 'Live' : 'Offline'}
            </span>
          </div>

          <button onClick={() => setDark(!dark)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 12px', fontSize: 11,
              color: 'var(--muted)', cursor: 'pointer' }}>
            {dark ? '☀ Light' : '◑ Dark'}
          </button>

          <button onClick={handleSignOut}
            style={{ background: 'transparent', border: '1px solid var(--border-md)',
              borderRadius: 20, padding: '4px 14px', fontSize: 11,
              color: 'var(--muted)', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
          <Link href="/dashboard"
            style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <span>/</span>
          <span>Learning</span>
          <span>/</span>
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{levelName}</span>
        </div>

        {/* LEVEL SWITCHER */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 24, flexWrap: 'wrap' }}>
          {LEVEL_NAMES_ARR.map((name, i) => {
            const lvl = i + 1
            const isActive  = lvl === levelParam
            const lvlLocked = userLevel !== null && lvl > (userLevel + 1)

            const pill = (
              <div style={{
                fontSize: 11, padding: '5px 13px', borderRadius: 20,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'var(--gold)' : 'var(--surface2)',
                color:  isActive ? '#fff' : 'var(--muted)',
                border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
                cursor: lvlLocked ? 'not-allowed' : isActive ? 'default' : 'pointer',
                opacity: lvlLocked ? 0.42 : 1,
                userSelect: 'none' as const,
                whiteSpace: 'nowrap' as const,
                transition: 'opacity 0.15s',
              }}>
                {lvl} · {name}
              </div>
            )

            if (isActive || lvlLocked) return <div key={lvl}>{pill}</div>
            return (
              <Link key={lvl} href={`/learning/${lvl}`}
                style={{ textDecoration: 'none' }}>
                {pill}
              </Link>
            )
          })}
        </div>

        {/* LEVEL HERO */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '28px 32px', marginBottom: 32,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 24, flexWrap: 'wrap' }}>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--gold), var(--bronze))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: '#fff',
                fontFamily: 'Playfair Display,serif' }}>
                {levelParam}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  Level {levelParam}
                </div>
                <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22,
                  fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                  {levelName}
                  {isLocked && (
                    <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--muted)',
                      fontFamily: 'Inter,sans-serif', fontWeight: 400 }}>
                      🔒 Locked
                    </span>
                  )}
                </h1>
              </div>
            </div>
            {objective && (
              <p style={{ fontSize: 14, color: 'var(--text-sm)', lineHeight: 1.6,
                maxWidth: 520 }}>
                {objective}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center',
            flexShrink: 0, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '12px 20px',
              background: 'var(--surface2)', borderRadius: 12,
              border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22,
                fontWeight: 700, color: 'var(--gold)' }}>
                {levelData?.summary.totalTopics ?? 8}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Topics</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px',
              background: 'var(--surface2)', borderRadius: 12,
              border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22,
                fontWeight: 700, color: 'var(--text)' }}>
                {totalEstTime}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Est. min</div>
            </div>
            {levelData && (
              <div style={{ textAlign: 'center', padding: '12px 20px',
                background: levelData.summary.topicsCompleted > 0
                  ? 'rgba(74,122,74,0.08)' : 'var(--surface2)',
                borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22,
                  fontWeight: 700, color: levelData.summary.topicsCompleted > 0
                    ? 'var(--green)' : 'var(--muted)' }}>
                  {levelData.summary.topicsCompleted}/{levelData.summary.totalTopics}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Done</div>
              </div>
            )}
          </div>
        </div>

        {/* LOCKED BANNER */}
        {isLocked && (
          <div style={{ background: 'rgba(122,110,95,0.1)',
            border: '1px solid var(--border-md)', borderRadius: 12,
            padding: '14px 20px', marginBottom: 28, fontSize: 13,
            color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <span>
              This level is locked. Reach Level {levelParam - 1} first to unlock it.{' '}
              <Link href="/dashboard"
                style={{ color: 'var(--gold)', fontWeight: 500, textDecoration: 'none' }}>
                Back to dashboard →
              </Link>
            </span>
          </div>
        )}

        {/* CONTINUE LEARNING */}
        {continueTopic && !isLocked && (
          <div style={{ background: 'rgba(184,146,74,0.08)',
            border: '1px solid rgba(184,146,74,0.25)', borderRadius: 14,
            padding: '18px 24px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                Continue Learning
              </div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16,
                fontWeight: 600, color: 'var(--text)' }}>
                {continueTopic.topicName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                Topic {continueTopic.topicOrder} · {continueTopic.subConcepts.length * 4} min
              </div>
            </div>
            <Link href={`/learning/${levelParam}/${continueTopic.topicOrder}`}
              style={{ background: 'var(--gold)', color: '#fff', fontWeight: 600,
                fontSize: 13, padding: '9px 22px', borderRadius: 24,
                textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Resume →
            </Link>
          </div>
        )}

        {/* TOPIC GRID */}
        <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 17,
          fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
          Topics
        </h2>

        {levelData !== null && levelData.topics.length === 0 && (
          <div style={{ padding: '36px 24px', textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, marginBottom: 40 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>📚</div>
            <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 16,
              color: 'var(--text)', marginBottom: 6 }}>
              Content coming soon
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              Learning content for Level {levelParam} ({levelName}) is being prepared.
            </p>
          </div>
        )}

        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 16, marginBottom: 40 }}>
          {(levelData?.topics ?? Array.from({ length: 8 }, (_, i) => ({
            topicOrder: i + 1, topicName: `Topic ${i + 1}`,
            subConcepts: [], status: 'not_started' as const,
            lastViewedAt: null, completedAt: null,
          }))).map((topic) => {
            const previewKey = `${levelParam}-${topic.topicOrder}`
            const preview    = TOPIC_PREVIEWS[previewKey] ?? ''
            const estMin     = topic.subConcepts.length * 4
            const locked     = isLocked

            const card = (
              <div style={{ background: 'var(--surface)',
                border: `1px solid ${topic.status === 'continue'
                  ? 'rgba(184,146,74,0.35)' : 'var(--border)'}`,
                borderRadius: 14, padding: '18px 20px',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.5 : 1,
                transition: 'box-shadow 0.15s, border-color 0.15s',
                display: 'flex', flexDirection: 'column', gap: 10,
                height: '100%',
                ...(locked ? {} : { boxShadow: 'none' }),
              }}>

                {/* Status badge + topic number */}
                <div style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)',
                    background: 'var(--surface2)', borderRadius: 6,
                    padding: '2px 8px', fontWeight: 500 }}>
                    {locked ? '🔒' : `${topic.topicOrder}`}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600,
                    color: statusColor(topic.status),
                    background: statusBg(topic.status),
                    borderRadius: 10, padding: '2px 8px' }}>
                    {statusLabel(topic.status)}
                  </span>
                </div>

                {/* Topic name */}
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 15,
                  fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                  {topic.topicName}
                </div>

                {/* Preview */}
                {preview && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5,
                    flexGrow: 1 }}>
                    {preview}
                  </div>
                )}

                {/* Footer: time + concepts */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                  paddingTop: 8, borderTop: '1px solid var(--border)',
                  marginTop: 'auto' }}>
                  {estMin > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      ⏱ {estMin} min
                    </span>
                  )}
                  {topic.subConcepts.length > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      · {topic.subConcepts.length} concept{topic.subConcepts.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )

            return locked ? (
              <div key={topic.topicOrder}>{card}</div>
            ) : (
              <Link
                key={topic.topicOrder}
                href={`/learning/${levelParam}/${topic.topicOrder}`}
                style={{ textDecoration: 'none', color: 'inherit' }}>
                {card}
              </Link>
            )
          })}
        </div>

        {/* RECENTLY VIEWED */}
        {recent.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 17,
              fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
              Recently Viewed
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {recent.map((r, idx) => (
                <Link
                  key={idx}
                  href={`/learning/${r.level}/${r.topicOrder}`}
                  style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Level {r.level} · {r.levelName}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {r.topicName}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 500,
                      color: statusColor(r.status) }}>
                      {statusLabel(r.status)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* LEVEL SUMMARY FOOTER */}
        {levelData && levelData.summary.totalTopics > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px 28px',
            display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>

            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>
                Topics completed
              </div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18,
                fontWeight: 700, color: 'var(--green)' }}>
                {levelData.summary.topicsCompleted} / {levelData.summary.totalTopics}
              </div>
            </div>

            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />

            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>
                Remaining topics
              </div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18,
                fontWeight: 700, color: 'var(--text)' }}>
                {levelData.summary.topicsRemaining}
              </div>
            </div>

            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />

            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>
                Est. time remaining
              </div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18,
                fontWeight: 700, color: 'var(--text)' }}>
                {remainingEstTime} min
              </div>
            </div>

            {levelData.summary.totalTopics > 0 && (
              <>
                <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>
                    <span>Progress</span>
                    <span>
                      {Math.round(levelData.summary.topicsCompleted /
                        levelData.summary.totalTopics * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3,
                    background: 'var(--surface2)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: 'linear-gradient(90deg, var(--gold), var(--bronze))',
                      width: `${Math.round(levelData.summary.topicsCompleted /
                        levelData.summary.totalTopics * 100)}%`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
