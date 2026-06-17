'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type IncomeCategory =
  | 'salary' | 'freelance' | 'business'
  | 'rental' | 'interest' | 'dividend' | 'other'

interface IncomeEntry {
  id: string
  date: string
  source: string
  category: IncomeCategory
  amount: number
  note?: string
}

const CAT_META: Record<IncomeCategory, { label: string; color: string; emoji: string }> = {
  salary:    { label:'Salary',    color:'#B8924A', emoji:'💼' },
  freelance: { label:'Freelance', color:'#5B8DB8', emoji:'💻' },
  business:  { label:'Business',  color:'#27AE60', emoji:'🏢' },
  rental:    { label:'Rental',    color:'#8E44AD', emoji:'🏠' },
  interest:  { label:'Interest',  color:'#16A085', emoji:'🏦' },
  dividend:  { label:'Dividend',  color:'#E07B54', emoji:'📈' },
  other:     { label:'Other',     color:'#7F8C8D', emoji:'💰' },
}

const CATS = Object.keys(CAT_META) as IncomeCategory[]

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
  input,select{outline:none;font-family:Inter,sans-serif;}
  button{font-family:Inter,sans-serif;cursor:pointer;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:var(--surface2);}
  ::-webkit-scrollbar-thumb{background:var(--border-md);border-radius:10px;}
`

function fmt(v: number): string {
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)}Cr`
  if (v >= 100000)   return `₹${(v/100000).toFixed(2)}L`
  if (v >= 1000)     return `₹${(v/1000).toFixed(1)}K`
  return `₹${v.toFixed(0)}`
}

function SavingsGauge({ rate }: { rate: number }) {
  if (rate === 0) return (
    <div style={{ padding:'16px 0', textAlign:'center',
      color:'var(--muted)', fontSize:12 }}>
      Savings rate will be calculated once expense tracking is added.
      <br/>
      <span style={{ fontSize:11, color:'var(--gold)',
        marginTop:6, display:'block' }}>
        Coming soon: Expense Tracker
      </span>
    </div>
  )
  const MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50]
  const next = MILESTONES.find(m => m > rate) ?? 50
  const prev = MILESTONES.filter(m => m <= rate).pop() ?? 0
  const progress = prev === next ? 100
    : Math.round(((rate - prev) / (next - prev)) * 100)

  return (
    <div style={{ marginTop:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between',
        fontSize:11, color:'var(--muted)', marginBottom:6 }}>
        <span>Current: <strong style={{ color:'var(--gold)' }}>{rate}%</strong></span>
        <span>Next milestone: <strong style={{ color:'var(--text)' }}>{next}%</strong></span>
      </div>
      <div style={{ height:8, background:'var(--surface2)',
        borderRadius:4, overflow:'hidden', marginBottom:8 }}>
        <div style={{ height:'100%', borderRadius:4,
          background:'linear-gradient(90deg,var(--gold),var(--bronze))',
          width:`${progress}%`, transition:'width .4s ease' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        {MILESTONES.map(m => (
          <div key={m} style={{ display:'flex', flexDirection:'column',
            alignItems:'center', gap:2 }}>
            <div style={{ width:8, height:8, borderRadius:'50%',
              background: rate >= m ? 'var(--gold)' : 'var(--surface2)',
              border: rate >= m ? 'none' : '1.5px solid rgba(180,155,110,0.3)' }}/>
            <span style={{ fontSize:8, color: rate >= m ? 'var(--gold)' : 'var(--muted)' }}>
              {m}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function IncomeDonut({ entries }: { entries: IncomeEntry[] }) {
  if (entries.length === 0) return (
    <div style={{ height:100, display:'flex', alignItems:'center',
      justifyContent:'center', color:'var(--muted)', fontSize:11 }}>
      No income entries yet
    </div>
  )
  const totals: Partial<Record<IncomeCategory, number>> = {}
  entries.forEach(e => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
  const grand = Object.values(totals).reduce((a, b) => a + (b ?? 0), 0) || 1
  const slices = (Object.entries(totals) as [IncomeCategory, number][]).sort((a, b) => b[1] - a[1])
  const circumference = 2 * Math.PI * 52
  let offset = 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      <div style={{ position:'relative', width:110, height:110, flexShrink:0 }}>
        <svg viewBox="0 0 130 130" width="110" height="110">
          <circle cx="65" cy="65" r="52" fill="none"
            stroke="var(--surface2)" strokeWidth="22"/>
          {slices.map(([cat, amt], i) => {
            const dash = (amt / grand) * circumference
            const so = offset; offset += dash
            return (
              <circle key={i} cx="65" cy="65" r="52"
                fill="none" stroke={CAT_META[cat].color} strokeWidth="22"
                strokeDasharray={`${dash} ${circumference - dash}`}
                transform={`rotate(${-90 + (so / circumference) * 360} 65 65)`}/>
            )
          })}
        </svg>
        <div style={{ position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)', textAlign:'center' }}>
          <div style={{ fontSize:9, color:'var(--muted)' }}>sources</div>
          <div style={{ fontFamily:'Playfair Display,serif',
            fontSize:14, color:'var(--text)' }}>{slices.length}</div>
        </div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
        {slices.map(([cat, amt]) => (
          <div key={cat} style={{ display:'flex', alignItems:'center',
            justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:2,
                background:CAT_META[cat].color }}/>
              <span style={{ fontSize:11, color:'var(--text-sm)' }}>
                {CAT_META[cat].emoji} {CAT_META[cat].label}
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
}

function IncomeTrendChart({ entries }: { entries: IncomeEntry[] }) {
  if (entries.length < 2) return (
    <div style={{ height:100, display:'flex', alignItems:'center',
      justifyContent:'center', color:'var(--muted)', fontSize:11,
      flexDirection:'column', gap:6 }}>
      <span style={{ fontSize:20 }}>📈</span>
      <span>Add more entries to see trend</span>
    </div>
  )
  const byMonth: Record<string, number> = {}
  entries.forEach(e => {
    const month = e.date.slice(0, 7)
    byMonth[month] = (byMonth[month] ?? 0) + e.amount
  })
  const months = Object.keys(byMonth).sort()
  const values = months.map(m => byMonth[m])
  const maxV = Math.max(...values, 1)
  const W = 400, H = 90
  const pts = months.map((_, i): [number, number] => {
    const x = months.length === 1 ? W / 2 : (i / (months.length - 1)) * W
    const y = H - (values[i] / maxV) * (H - 10)
    return [x, y]
  })
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `0,${H} ${polyline} ${W},${H}`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%"
        style={{ display:'block', overflow:'visible' }}>
        <defs>
          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={0} y1={H - f * H} x2={W} y2={H - f * H}
            stroke="rgba(180,155,110,0.08)" strokeWidth="1" strokeDasharray="4 4"/>
        ))}
        <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(180,155,110,0.15)" strokeWidth="1"/>
        <polygon points={area} fill="url(#incGrad)"/>
        <polyline points={polyline} fill="none" stroke="var(--gold)"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4"
            fill="var(--gold)" stroke="var(--surface)" strokeWidth="1.5"/>
        ))}
        {months
          .filter((_, i) => i === 0 || i === months.length - 1 ||
            (months.length > 2 && i === Math.floor(months.length / 2)))
          .map(m => {
            const idx = months.indexOf(m)
            const [x] = pts[idx]
            return (
              <text key={m} x={x} y={H + 14} fontSize="9"
                fill="var(--muted)" textAnchor="middle" fontFamily="Inter,sans-serif">
                {m.slice(5)}
              </text>
            )
          })}
      </svg>
    </div>
  )
}

export default function IncomePage() {
  const router = useRouter()
  const [entries, setEntries]         = useState<IncomeEntry[]>([])
  const [loading, setLoading]         = useState(true)
  const [dark, setDark]               = useState(false)
  const savingsRate = 0

  const [fDate, setFDate]     = useState('')
  const [fSource, setFSource] = useState('')
  const [fCat, setFCat]       = useState<IncomeCategory>('salary')
  const [fAmount, setFAmount] = useState('')
  const [fNote, setFNote]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [formErr, setFormErr] = useState('')

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setLoading(false); return }

    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/income`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const json = await res.json() as { entries: IncomeEntry[] }
      setEntries(json.entries ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleAdd() {
    setFormErr('')
    if (!fDate) { setFormErr('Select a date'); return }
    if (!fSource.trim()) { setFormErr('Enter income source'); return }
    const amt = parseFloat(fAmount)
    if (!fAmount || isNaN(amt) || amt <= 0) { setFormErr('Enter a valid amount'); return }
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setFormErr('Not logged in'); setSaving(false); return }

    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/income`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        date: fDate,
        source: fSource.trim(),
        category: fCat,
        amount: amt,
        note: fNote.trim() || undefined,
      }),
    })
    const json = await res.json() as { entry?: IncomeEntry; error?: string }
    if (!res.ok) { setFormErr(json.error ?? 'Failed to save'); setSaving(false); return }
    setEntries(prev => [json.entry!, ...prev])
    setFDate(''); setFSource(''); setFAmount(''); setFNote(''); setFCat('salary')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    await fetch(`${BASE}/income/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const totalIncome = entries.reduce((s, e) => s + e.amount, 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthlyIncome = entries
    .filter(e => e.date.slice(0, 7) === thisMonth)
    .reduce((s, e) => s + e.amount, 0)
  const prevMonth = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })()
  const prevMonthIncome = entries
    .filter(e => e.date.slice(0, 7) === prevMonth)
    .reduce((s, e) => s + e.amount, 0)
  const growthPct = prevMonthIncome > 0
    ? Math.round(((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100)
    : null
  const uniqueSources = new Set(entries.map(e => e.category)).size

  const stability      = uniqueSources >= 3 ? 'Strong' : uniqueSources === 2 ? 'Moderate' : 'Weak'
  const growth         = growthPct !== null ? growthPct > 5 ? 'Strong' : growthPct > 0 ? 'Moderate' : 'Weak' : 'Moderate'
  const diversification = uniqueSources >= 3 ? 'Strong' : uniqueSources === 2 ? 'Moderate' : 'Weak'
  const healthColor    = (s: string) =>
    s === 'Strong' ? 'var(--green)' : s === 'Moderate' ? 'var(--gold)' : 'var(--red)'

  if (loading) return (
    <main style={{ minHeight:'100vh', background:'var(--bg)',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{CSS}</style>
      <p style={{ color:'var(--muted)' }}>Loading…</p>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'Inter,sans-serif' }}>
      <style>{CSS}</style>

      {/* NAV */}
      <nav style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)',
        padding:'0 28px', height:52, display:'flex', alignItems:'center',
        justifyContent:'space-between', position:'sticky', top:0, zIndex:20,
        boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ background:'none', border:'none',
              color:'var(--muted)', fontSize:18, cursor:'pointer', padding:'0 4px' }}>←</button>
          <div style={{ width:30, height:30, borderRadius:8, background:'var(--gold)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:14 }}>V</span>
          </div>
          <span style={{ fontFamily:'Playfair Display,serif', fontWeight:600,
            fontSize:16, color:'var(--text)' }}>VALAM · Income &amp; Savings</span>
        </div>
        <button onClick={() => setDark(!dark)}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)',
            borderRadius:20, padding:'4px 12px', fontSize:11,
            color:'var(--muted)', cursor:'pointer' }}>
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 24px 80px' }}>

        {/* SUMMARY ROW */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr',
          gap:12, marginBottom:16 }}>
          {[
            { label:'Monthly Income',   value: fmt(monthlyIncome), sub:'this month' },
            { label:'Savings Rate',     value:'—',                 sub:'Add expense data to calculate' },
            { label:'Income Sources',   value:`${uniqueSources}`,  sub:'categories tracked' },
            {
              label:'Income Growth',
              value: growthPct !== null ? `${growthPct > 0 ? '+' : ''}${growthPct}%` : '—',
              sub:'vs last month',
              color: growthPct !== null
                ? growthPct > 0 ? 'var(--green)' : 'var(--red)'
                : 'var(--text)',
            },
          ].map(card => (
            <div key={card.label} style={{ background:'var(--surface)', borderRadius:18,
              padding:'18px 20px', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.45px',
                textTransform:'uppercase', fontWeight:500, marginBottom:8 }}>{card.label}</div>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:24,
                color:(card as {color?: string}).color ?? 'var(--text)', marginBottom:4 }}>
                {card.value}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* ADD INCOME FORM */}
        <div style={{ background:'var(--surface)', borderRadius:18, padding:'22px 24px',
          border:'1px solid var(--border)', marginBottom:16 }}>
          <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.45px',
            textTransform:'uppercase', fontWeight:500, marginBottom:14 }}>Add Income Entry</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr',
            gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:10, color:'var(--muted)', fontWeight:500,
                display:'block', marginBottom:5 }}>Date</label>
              <input type="date" value={fDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setFDate(e.target.value)}
                style={{ width:'100%', background:'var(--surface2)',
                  border:'1px solid var(--border-md)', borderRadius:10,
                  padding:'10px 12px', fontSize:12, color:'var(--text)' }}/>
            </div>
            <div>
              <label style={{ fontSize:10, color:'var(--muted)', fontWeight:500,
                display:'block', marginBottom:5 }}>Source</label>
              <input type="text" value={fSource} placeholder="e.g. TCS Salary"
                onChange={e => setFSource(e.target.value)}
                style={{ width:'100%', background:'var(--surface2)',
                  border:'1px solid var(--border-md)', borderRadius:10,
                  padding:'10px 12px', fontSize:12, color:'var(--text)' }}/>
            </div>
            <div>
              <label style={{ fontSize:10, color:'var(--muted)', fontWeight:500,
                display:'block', marginBottom:5 }}>Category</label>
              <select value={fCat} onChange={e => setFCat(e.target.value as IncomeCategory)}
                style={{ width:'100%', background:'var(--surface2)',
                  border:'1px solid var(--border-md)', borderRadius:10,
                  padding:'10px 12px', fontSize:12, color:'var(--text)', appearance:'none' }}>
                {CATS.map(c => (
                  <option key={c} value={c}>{CAT_META[c].emoji} {CAT_META[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, color:'var(--muted)', fontWeight:500,
                display:'block', marginBottom:5 }}>Amount (₹)</label>
              <input type="number" step="0.01" min="0" value={fAmount}
                placeholder="e.g. 120000"
                onChange={e => setFAmount(e.target.value)}
                style={{ width:'100%', background:'var(--surface2)',
                  border:'1px solid var(--border-md)', borderRadius:10,
                  padding:'10px 12px', fontSize:12, color:'var(--text)' }}/>
            </div>
          </div>
          {formErr && (
            <div style={{ fontSize:11, color:'var(--red)', marginBottom:10 }}>{formErr}</div>
          )}
          <button onClick={handleAdd} disabled={saving}
            style={{ background:'var(--gold)', color:'#fff', border:'none',
              borderRadius:12, padding:'10px 28px', fontSize:13, fontWeight:600,
              opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : '+ Add Income'}
          </button>
        </div>

        {/* TREND + BREAKDOWN */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr',
          gap:12, marginBottom:16 }}>
          <div style={{ background:'var(--surface)', borderRadius:18, padding:'20px 22px',
            border:'1px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.45px',
              textTransform:'uppercase', fontWeight:500, marginBottom:14 }}>Income Trend</div>
            <IncomeTrendChart entries={entries}/>
          </div>
          <div style={{ background:'var(--surface)', borderRadius:18, padding:'20px 22px',
            border:'1px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.45px',
              textTransform:'uppercase', fontWeight:500, marginBottom:14 }}>
              Income Source Breakdown
            </div>
            <IncomeDonut entries={entries}/>
            {entries.length > 0 && uniqueSources < 2 && (
              <div style={{ marginTop:12, padding:'10px 12px',
                background:'rgba(184,146,74,0.08)', borderRadius:10,
                borderLeft:'3px solid var(--gold)', fontSize:11,
                color:'var(--muted)', lineHeight:1.6 }}>
                💡 Most income from one source. Building additional
                income streams improves financial resilience.
              </div>
            )}
          </div>
        </div>

        {/* SAVINGS MILESTONE TRACKER */}
        <div style={{ background:'var(--surface)', borderRadius:18, padding:'20px 22px',
          border:'1px solid var(--border)', marginBottom:16 }}>
          <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.45px',
            textTransform:'uppercase', fontWeight:500, marginBottom:4 }}>Savings Rate Progress</div>
          <SavingsGauge rate={0}/>
        </div>

        {/* INCOME HEALTH */}
        <div style={{ background:'var(--surface)', borderRadius:18, padding:'20px 22px',
          border:'1px solid var(--border)', marginBottom:16 }}>
          <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.45px',
            textTransform:'uppercase', fontWeight:500, marginBottom:14 }}>Income Health</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { label:'Income Stability',        status: stability      },
              { label:'Income Growth',           status: growth         },
              { label:'Income Diversification',  status: diversification },
            ].map(({ label, status }) => (
              <div key={label} style={{ background:'var(--surface2)', borderRadius:12,
                padding:'14px 16px', border:'1px solid var(--border)',
                borderLeft:`3px solid ${healthColor(status)}` }}>
                <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500,
                  marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:16, fontWeight:700,
                  color:healthColor(status) }}>{status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* INCOME LOGBOOK */}
        {entries.length > 0 && (
          <div style={{ background:'var(--surface)', borderRadius:18, padding:'20px 22px',
            border:'1px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.45px',
              textTransform:'uppercase', fontWeight:500, marginBottom:14 }}>
              Income Logbook
              <span style={{ marginLeft:8, fontWeight:400, color:'var(--muted)' }}>
                · {fmt(totalIncome)} total
              </span>
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:'110px 1fr 120px 130px 80px',
              gap:12, padding:'6px 10px',
              background:'var(--surface2)', borderRadius:8, marginBottom:8 }}>
              {['Date','Source','Category','Amount',''].map(h => (
                <div key={h} style={{ fontSize:10, color:'var(--muted)', fontWeight:600,
                  letterSpacing:'.4px', textTransform:'uppercase',
                  textAlign: h === 'Amount' ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>
            {entries.map((e, i) => (
              <div key={e.id} style={{ display:'grid',
                gridTemplateColumns:'110px 1fr 120px 130px 80px',
                gap:12, padding:'10px 10px', alignItems:'center',
                borderBottom: i < entries.length - 1
                  ? '1px solid rgba(180,155,110,0.08)' : 'none' }}>
                <div style={{ fontSize:12, color:'var(--muted)' }}>
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', {
                    day:'numeric', month:'short', year:'numeric'
                  })}
                </div>
                <div>
                  <div style={{ fontSize:13, color:'var(--text)', fontWeight:500 }}>{e.source}</div>
                  {e.note && (
                    <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>{e.note}</div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%',
                    background:CAT_META[e.category]?.color ?? '#999', flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'var(--text-sm)' }}>
                    {CAT_META[e.category]?.label ?? e.category}
                  </span>
                </div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:13,
                  color:'var(--green)', fontWeight:500, textAlign:'right' }}>
                  {fmt(e.amount)}
                </div>
                <div>
                  <button onClick={() => handleDelete(e.id)}
                    style={{ background:'rgba(192,57,43,0.08)',
                      border:'1px solid rgba(192,57,43,0.2)',
                      color:'var(--red)', borderRadius:8,
                      padding:'3px 10px', fontSize:10 }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
