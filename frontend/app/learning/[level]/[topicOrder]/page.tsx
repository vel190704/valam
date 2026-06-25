'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LEVEL_NAMES_ARR } from '@/lib/valam'
import { useTheme } from '../../../context/themecontext'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubConcept {
  subConceptOrder: number
  subConceptName:  string
  explanation:     string
  checkQuestion:   string
  checkAnswer:     string
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
`

// ── Component ─────────────────────────────────────────────────────────────────

export default function TopicDetailPage() {
  const router = useRouter()
  const params = useParams()

  const level      = Number(params?.level)
  const topicOrder = Number(params?.topicOrder)

  const { dark, toggleTheme }         = useTheme()
  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [subConcepts, setSubConcepts] = useState<SubConcept[]>([])
  const [topicName, setTopicName]     = useState('')
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [showAnswer, setShowAnswer]   = useState(false)
  const [completing, setCompleting]   = useState(false)
  const [token, setToken]             = useState<string | null>(null)

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'

  const postProgress = useCallback(async (status: 'continue' | 'completed', tok: string) => {
    try {
      await fetch(`${BASE}/learning/progress`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ level, topicOrder, status }),
      })
    } catch {
      // non-fatal — progress tracking failure shouldn't block the user
    }
  }, [BASE, level, topicOrder])

  useEffect(() => {
    if (!level || !topicOrder || Number.isNaN(level) || Number.isNaN(topicOrder)) {
      setNotFound(true)
      setLoading(false)
      return
    }
    void load()
  }, [level, topicOrder])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.replace('/login'); return }

    const tok     = session.access_token
    setToken(tok)
    const headers = { Authorization: `Bearer ${tok}` }

    try {
      const res = await fetch(`${BASE}/learning/${level}`, { headers })
      if (!res.ok) { setNotFound(true); setLoading(false); return }

      const json = await res.json() as {
        topics: { topicOrder: number; topicName: string; subConcepts: SubConcept[] }[]
      }

      const topic = (json.topics ?? []).find(t => t.topicOrder === topicOrder)
      if (!topic || !topic.subConcepts?.length) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setTopicName(topic.topicName)
      setSubConcepts(topic.subConcepts)
      setLoading(false)

      // Mark as 'continue' on load — fire and forget
      void postProgress('continue', tok)
    } catch {
      setNotFound(true)
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    sessionStorage.clear()
    localStorage.clear()
    router.push('/')
  }

  function goTo(idx: number) {
    setCurrentIdx(idx)
    setShowAnswer(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleComplete() {
    if (completing || !token) return
    setCompleting(true)
    await postProgress('completed', token)
    router.push(`/learning/${level}`)
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const levelName = LEVEL_NAMES_ARR[level - 1] ?? `Level ${level}`
  const total     = subConcepts.length
  const current   = subConcepts[currentIdx] ?? null
  const isFirst   = currentIdx === 0
  const isLast    = currentIdx === total - 1

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{CSS}</style>
      <p style={{ color: 'var(--muted)', fontFamily: 'Inter,sans-serif' }}>Loading…</p>
    </main>
  )

  // ── Not found ─────────────────────────────────────────────────────────────

  if (notFound || !current) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: '0 24px' }}>
      <style>{CSS}</style>
      <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 20,
        color: 'var(--text)' }}>Topic not found</p>
      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
        This topic doesn't exist or the content hasn't been loaded yet.
      </p>
      <Link href={`/learning/${level}`}
        style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14,
          textDecoration: 'none', padding: '9px 22px',
          border: '1px solid var(--gold)', borderRadius: 24 }}>
        ← Back to Level {level}
      </Link>
    </main>
  )

  // ── Render ────────────────────────────────────────────────────────────────

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
          <button onClick={toggleTheme}
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

      {/* PAGE */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--muted)', marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/dashboard"
            style={{ color: 'var(--muted)', textDecoration: 'none' }}>Dashboard</Link>
          <span>/</span>
          <Link href={`/learning/${level}`}
            style={{ color: 'var(--muted)', textDecoration: 'none' }}>Learning</Link>
          <span>/</span>
          <Link href={`/learning/${level}`}
            style={{ color: 'var(--muted)', textDecoration: 'none' }}>{levelName}</Link>
          <span>/</span>
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{topicName}</span>
        </div>

        {/* TOPIC HEADER */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Level {level} · {levelName}
          </div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22,
            fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginBottom: 4 }}>
            {topicName}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Concept {currentIdx + 1} of {total}
          </div>
        </div>

        {/* PROGRESS DOTS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
          {subConcepts.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={subConcepts[i].subConceptName}
              style={{
                width: 28, height: 6, borderRadius: 3, border: 'none',
                cursor: 'pointer', transition: 'background 0.2s',
                background: i < currentIdx
                  ? 'var(--green)'
                  : i === currentIdx
                    ? 'var(--gold)'
                    : 'var(--surface2)',
              }}
            />
          ))}
        </div>

        {/* SUB-CONCEPT CARD */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 18, padding: '32px 36px', marginBottom: 24 }}>

          {/* Sub-concept name */}
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 19,
            fontWeight: 600, color: 'var(--gold)', marginBottom: 18, lineHeight: 1.3 }}>
            {current.subConceptName}
          </h2>

          {/* Explanation */}
          <p style={{ fontSize: 15, color: 'var(--text-sm)', lineHeight: 1.75,
            marginBottom: 28 }}>
            {current.explanation}
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)',
            marginBottom: 24 }} />

          {/* Check question */}
          <div style={{ marginBottom: showAnswer ? 20 : 0 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Check yourself
            </div>
            <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500,
              lineHeight: 1.55, fontStyle: 'italic' }}>
              {current.checkQuestion}
            </p>
          </div>

          {/* Answer reveal */}
          {showAnswer ? (
            <div style={{ marginTop: 16, padding: '16px 20px',
              background: 'rgba(74,122,74,0.08)',
              border: '1px solid rgba(74,122,74,0.22)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Answer
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-sm)', lineHeight: 1.6 }}>
                {current.checkAnswer}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowAnswer(true)}
              style={{ marginTop: 16, background: 'transparent',
                border: '1px solid var(--border-md)', borderRadius: 22,
                padding: '7px 18px', fontSize: 12, color: 'var(--muted)',
                cursor: 'pointer', fontWeight: 500 }}>
              Show answer
            </button>
          )}
        </div>

        {/* NAVIGATION */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 12 }}>

          {/* Previous */}
          <button
            onClick={() => !isFirst && goTo(currentIdx - 1)}
            disabled={isFirst}
            style={{ background: 'var(--surface)',
              border: `1px solid ${isFirst ? 'var(--border)' : 'var(--border-md)'}`,
              borderRadius: 24, padding: '10px 22px', fontSize: 13, fontWeight: 500,
              color: isFirst ? 'var(--border-md)' : 'var(--muted)',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              opacity: isFirst ? 0.45 : 1 }}>
            ← Previous
          </button>

          {/* Concept counter (centre) */}
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {currentIdx + 1} / {total}
          </span>

          {/* Next / Complete */}
          {isLast ? (
            <button
              onClick={handleComplete}
              disabled={completing}
              style={{ background: completing ? 'var(--surface2)' : 'var(--gold)',
                border: 'none', borderRadius: 24, padding: '10px 22px',
                fontSize: 13, fontWeight: 600, color: completing ? 'var(--muted)' : '#fff',
                cursor: completing ? 'not-allowed' : 'pointer' }}>
              {completing ? 'Saving…' : 'Complete Topic ✓'}
            </button>
          ) : (
            <button
              onClick={() => goTo(currentIdx + 1)}
              style={{ background: 'var(--gold)', border: 'none',
                borderRadius: 24, padding: '10px 22px', fontSize: 13,
                fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Next →
            </button>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href={`/learning/${level}`}
            style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
            ← Back to {levelName} overview
          </Link>
        </div>
      </div>
    </main>
  )
}
