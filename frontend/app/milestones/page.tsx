'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Milestone {
  id: number
  name: string
  category: string
  threshold: number
  description: string
  unlocked: boolean
  unlocked_at: string | null
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  networth:   { label: 'Net Worth',    icon: '💰' },
  savings:    { label: 'Savings Rate', icon: '🐷' },
  investment: { label: 'Investments',  icon: '📈' },
  income:     { label: 'Income',       icon: '👛' },
}

const CATEGORY_ORDER = ['networth', 'savings', 'investment', 'income']

function fmt(n: number, cat: string) {
  if (cat === 'savings') return `${n}%`
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(0)}Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)}L`
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function MilestonesPage() {
  const router = useRouter()
  const [milestones, setMilestones]       = useState<Milestone[]>([])
  const [unlockedCount, setUnlockedCount] = useState(0)
  const [loading, setLoading]             = useState(true)
  const [dark, setDark]                   = useState(false)
  const [expanded, setExpanded]           = useState<number | null>(null)

  useEffect(() => {
    const isDark = document.body.classList.contains('dark') ||
                   localStorage.getItem('theme') === 'dark'
    setDark(isDark)
    document.body.classList.toggle('dark', isDark)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }

      const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
      const res = await fetch(`${BASE}/milestones`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const json = await res.json() as { milestones: Milestone[]; unlockedCount: number }
        setMilestones(json.milestones ?? [])
        setUnlockedCount(json.unlockedCount ?? 0)
      }
      setLoading(false)
    }
    void load()
  }, [router])

  const grouped = CATEGORY_ORDER.reduce<Record<string, Milestone[]>>((acc, cat) => {
    acc[cat] = milestones.filter(m => m.category === cat)
    return acc
  }, {})

  return (
    <>
      <style>{`
        :root {
          --bg:#EFEDE8; --surface:#F5F3EF; --surface2:#EAE7E1;
          --border:rgba(180,155,110,0.18); --gold:#B8924A; --bronze:#8F6828;
          --muted:#7A6E5F; --text:#1E1C18; --text-sm:#3A3630;
          --nav-bg:rgba(239,237,232,0.92); --tab-bg:rgba(239,237,232,0.97);
          --gold-rgb:184,146,74;
        }
        body.dark {
          --bg:#1a0f0a; --surface:rgba(245,240,232,0.06); --surface2:rgba(245,240,232,0.03);
          --border:rgba(201,168,76,0.15); --gold:#C9A84C; --bronze:#8B6914;
          --muted:#B89A72; --text:#F5F0E8; --text-sm:#D4C4A8;
          --nav-bg:rgba(26,15,10,0.9); --tab-bg:rgba(26,15,10,0.96);
          --gold-rgb:201,168,76;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);color:var(--text);font-family:Inter,sans-serif;}
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:50,
        background:'var(--nav-bg)', backdropFilter:'blur(12px)',
        borderBottom:'1px solid var(--border)', height:56,
        display:'flex', alignItems:'center', padding:'0 20px', gap:12 }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background:'none', border:'none', cursor:'pointer',
            color:'var(--muted)', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
          ← Dashboard
        </button>
        <div style={{ flex:1, textAlign:'center' }}>
          <span style={{ fontFamily:'Playfair Display,serif', color:'var(--gold)',
            fontWeight:700, letterSpacing:'.08em', fontSize:15 }}>
            Milestones
          </span>
        </div>
        <button onClick={() => setDark(d => !d)}
          style={{ background:'none', border:'none', cursor:'pointer',
            color:'var(--muted)', fontSize:16 }}>
          {dark ? '☀️' : '🌙'}
        </button>
      </nav>

      <main style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:72, paddingBottom:100 }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 20px' }}>

          {/* HEADER */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:28,
              fontWeight:700, color:'var(--text)', marginBottom:6 }}>
              Your Milestones
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8,
              background:`rgba(var(--gold-rgb),0.1)`, border:'1px solid rgba(var(--gold-rgb),0.25)',
              borderRadius:20, padding:'6px 18px' }}>
              <span style={{ fontSize:18 }}>🏆</span>
              <span style={{ fontFamily:'Playfair Display,serif', fontSize:20,
                fontWeight:700, color:'var(--gold)' }}>{unlockedCount}</span>
              <span style={{ fontSize:13, color:'var(--muted)' }}>/80 unlocked</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', color:'var(--muted)', padding:60, fontSize:13 }}>
              Loading milestones…
            </div>
          ) : (
            CATEGORY_ORDER.map(cat => {
              const meta  = CATEGORY_META[cat]
              const items = grouped[cat] ?? []
              const catUnlocked = items.filter(m => m.unlocked).length
              return (
                <div key={cat} style={{ marginBottom:40 }}>
                  {/* Section header */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <span style={{ fontSize:20 }}>{meta.icon}</span>
                    <span style={{ fontFamily:'Playfair Display,serif', fontSize:17,
                      fontWeight:600, color:'var(--text)' }}>{meta.label}</span>
                    <span style={{ fontSize:11, color:'var(--muted)',
                      background:'var(--surface)', borderRadius:10,
                      padding:'2px 8px', marginLeft:4 }}>
                      {catUnlocked}/{items.length}
                    </span>
                  </div>

                  {/* Badge grid */}
                  <div style={{ display:'grid',
                    gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))',
                    gap:12 }}>
                    {items.map(m => {
                      const isExpanded = expanded === m.id
                      return (
                        <div key={m.id}
                          onClick={() => setExpanded(isExpanded ? null : m.id)}
                          style={{
                            borderRadius:12,
                            border: m.unlocked
                              ? '2px solid var(--gold)'
                              : '1px solid var(--border)',
                            background: m.unlocked
                              ? `rgba(var(--gold-rgb),0.07)`
                              : 'var(--surface2)',
                            opacity: m.unlocked ? 1 : 0.5,
                            cursor:'pointer',
                            padding: isExpanded ? '12px' : '0',
                            transition:'all 0.15s',
                            position:'relative',
                            overflow:'hidden',
                          }}>

                          {/* Square icon area */}
                          {!isExpanded && (
                            <div style={{ aspectRatio:'1', display:'flex',
                              flexDirection:'column', alignItems:'center',
                              justifyContent:'center', gap:6, padding:12 }}>
                              {m.unlocked && (
                                <span style={{ position:'absolute', top:6, right:8,
                                  fontSize:10, color:'var(--gold)' }}>✓</span>
                              )}
                              <span style={{ fontSize:22 }}>{meta.icon}</span>
                              <div style={{ fontSize:9.5, fontWeight:600, textAlign:'center',
                                color: m.unlocked ? 'var(--text)' : 'var(--muted)',
                                lineHeight:1.3, paddingTop:2 }}>
                                {m.name}
                              </div>
                              <div style={{ fontSize:9, color:'var(--gold)', fontWeight:600 }}>
                                {fmt(Number(m.threshold), cat)}
                              </div>
                              {m.unlocked && m.unlocked_at && (
                                <div style={{ fontSize:8, color:'var(--muted)', marginTop:2 }}>
                                  {fmtDate(m.unlocked_at)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div>
                              <div style={{ display:'flex', justifyContent:'space-between',
                                alignItems:'flex-start', marginBottom:8 }}>
                                <span style={{ fontSize:18 }}>{meta.icon}</span>
                                <span style={{ fontSize:10, color:'var(--muted)' }}>tap to close</span>
                              </div>
                              <div style={{ fontSize:12, fontWeight:700,
                                color: m.unlocked ? 'var(--gold)' : 'var(--muted)',
                                marginBottom:4 }}>{m.name}</div>
                              <div style={{ fontSize:10, color:'var(--muted)',
                                lineHeight:1.5, marginBottom:6 }}>{m.description}</div>
                              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:600 }}>
                                Target: {fmt(Number(m.threshold), cat)}
                              </div>
                              {m.unlocked && m.unlocked_at && (
                                <div style={{ fontSize:9, color:'var(--muted)', marginTop:4 }}>
                                  Unlocked {fmtDate(m.unlocked_at)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* BOTTOM TAB BAR */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0,
        background:'var(--tab-bg)', backdropFilter:'blur(12px)',
        borderTop:'1px solid var(--border)', display:'flex',
        justifyContent:'space-around', padding:'8px 0 12px', zIndex:50 }}>
        {[
          { label:'Dashboard',   icon:'⊞', path:'/dashboard'   },
          { label:'Portfolio',   icon:'📊', path:'/portfolio'   },
          { label:'Net Worth',   icon:'💎', path:'/networth'    },
          { label:'Income',      icon:'💳', path:'/income'      },
          { label:'Milestones',  icon:'🏆', path:'/milestones', active: true },
        ].map(tab => (
          <button key={tab.label} onClick={() => router.push(tab.path)}
            style={{ background:'none', border:'none', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:18 }}>{tab.icon}</span>
            <span style={{ fontSize:9, color: tab.active ? 'var(--gold)' : 'var(--muted)',
              fontWeight: tab.active ? 700 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
