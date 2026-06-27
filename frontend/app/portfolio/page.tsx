'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DNavbar from '@/components/layout/dnavbar'

// ── Types ──────────────────────────────────────────────────────────────────
type InvestmentType = 'mf' | 'stock' | 'fd' | 'crypto' | 'bond' | 'etf' | 'realestate'
type MfType = 'index' | 'flexicap' | 'midcap' | 'largecap' | 'smallcap' | 'elss' | 'hybrid'
type MutualFundType = 'largecap' | 'midcap' | 'smallcap' | 'nifty50' | 'flexicap' | 'international' | 'debt' | 'commodity'
type SipFrequency = 'monthly' | 'weekly'
type SipStatus = 'active' | 'paused' | 'cancelled'

interface SipPlan {
  id: string
  investment_type: string
  mf_type: MfType | null
  amount: number
  frequency: SipFrequency
  start_date: string
  next_execution_date: string
  status: SipStatus
  note: string | null
  created_at: string
  history_count?: number
}

interface Investment {
  id: string
  date?: string
  type: InvestmentType
  mfType?: MutualFundType
  amount: number
  sip_id?: SipPlan
  note?: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const TYPE_META: Record<InvestmentType, { label: string; color: string; emoji: string }> = {
  mf:         { label: 'Mutual Fund',   color: '#B8924A', emoji: '📈' },
  stock:      { label: 'Stock',         color: '#5B8DB8', emoji: '📊' },
  fd:         { label: 'Fixed Deposit', color: '#E07B54', emoji: '🏦' },
  crypto:     { label: 'Crypto',        color: '#9B59B6', emoji: '₿'  },
  bond:       { label: 'Bond',          color: '#27AE60', emoji: '📜' },
  etf:        { label: 'ETF',           color: '#16A085', emoji: '🔷' },
  realestate: { label: 'Real Estate',   color: '#C0392B', emoji: '🏠' },
}

const TYPES = Object.keys(TYPE_META) as InvestmentType[]
// realestate excluded from new entries but kept in TYPE_META for displaying existing ones
const FORM_TYPES = TYPES.filter(t => t !== 'realestate')
// SIP-eligible types (same exclusion)
const SIP_TYPES = FORM_TYPES

const MF_TYPE_META: Record<MfType, string> = {
  index:    'Index Fund',
  flexicap: 'Flexi Cap',
  midcap:   'Mid Cap',
  largecap: 'Large Cap',
  smallcap: 'Small Cap',
  elss:     'ELSS (Tax Saver)',
  hybrid:   'Hybrid Fund',
}

const MF_META: Record<MutualFundType, { label: string; emoji: string }> = {
  largecap:      { label: 'Large Cap',      emoji: '🏢' },
  midcap:        { label: 'Mid Cap',        emoji: '📈' },
  smallcap:      { label: 'Small Cap',      emoji: '🚀' },
  nifty50:       { label: 'Nifty 50',       emoji: '🇮🇳' },
  flexicap:      { label: 'Flexi Cap',      emoji: '🔄' },
  international: { label: 'International',  emoji: '🌎' },
  debt:          { label: 'Debt Fund',      emoji: '🛡️' },
  commodity:     { label: 'Commodity',      emoji: '🥇' },
}

const MF_TYPES = Object.keys(MF_META) as MutualFundType[]

const MF_COLORS: Record<MutualFundType, string> = {
  largecap:      '#B8924A',
  midcap:        '#D4AD72',
  smallcap:      '#F0D080',
  nifty50:       '#5B8DB8',
  flexicap:      '#9B59B6',
  international: '#16A085',
  debt:          '#27AE60',
  commodity:     '#E07B54',
}

const CSS = `
  :root {
    --bg:#EFEDE8; --surface:#F5F3EF; --surface2:#EAE7E1;
    --border:rgba(180,155,110,0.18); --border-md:rgba(180,155,110,0.32);
    --gold:#B8924A; --gold-lt:#D4AD72; --bronze:#8F6828;
    --muted:#7A6E5F; --text:#1E1C18; --text-sm:#3A3630;
    --green:#4A7A4A; --red:#C0392B;
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
  input,select{outline:none;font-family:Inter,sans-serif;}
  button{font-family:Inter,sans-serif;cursor:pointer;}
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
  .cal-day{
    aspect-ratio:1;display:flex;align-items:center;justify-content:center;
    border-radius:50%;font-size:12px;cursor:pointer;color:var(--text);
    transition:background .15s;
  }
  .cal-day:hover{background:rgba(184,146,74,0.15);}
  .cal-day.today{color:var(--gold);font-weight:700;}
  .cal-day.selected{background:var(--gold);color:#fff;font-weight:700;}
  .cal-day.empty{cursor:default;}
  .cal-day.empty:hover{background:none;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:var(--surface2);}
  ::-webkit-scrollbar-thumb{background:var(--border-md);border-radius:10px;}
`


// ── Mini line chart ────────────────────────────────────────────────────────
function MiniChart({ entries, color }: {
  entries: { date?: string; amount: number }[]
  color: string
}) {
  if (entries.length < 2) {
    return (
      <div style={{ height: 80, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--muted)', fontSize: 11 }}>
        Add more entries to see trend
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const sorted = [...entries].sort((a, b) => (a.date ?? today).localeCompare(b.date ?? today))
  const cumulative: { date: string; total: number }[] = []
  let running = 0
  sorted.forEach(e => {
    running += e.amount
    cumulative.push({ date: e.date ?? today, total: running })
  })

  const W = 280, H = 80
  const maxV = Math.max(...cumulative.map(c => c.total))
  const pts = cumulative.map((c, i) => {
    const x = (i / (cumulative.length - 1)) * W
    const y = H - (c.total / (maxV || 1)) * (H - 8)
    return `${x},${y}`
  })
  const polyline = pts.join(' ')
  const area = `0,${H} ${polyline} ${W},${H}`
  const gradId = `mg${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`}/>
      <polyline points={polyline} fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {cumulative.map((_, i) => {
        const [x, y] = pts[i].split(',').map(Number)
        return <circle key={i} cx={x} cy={y} r="3" fill={color}/>
      })}
    </svg>
  )
}

// ── Combined growth chart ──────────────────────────────────────────────────
function CombinedChart({ investments }: { investments: Investment[] }) {
  if (investments.length === 0) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
        No investments yet
      </div>
    )
  }

  const W = 480, H = 150
  const types = [...new Set(investments.map(i => i.type))] as InvestmentType[]
  const today = new Date().toISOString().slice(0, 10)
  const allDates = [...new Set(investments.map(i => i.date ?? today))].sort()

  const series = types.map(type => {
    const byType = investments.filter(i => i.type === type)
    const points = allDates.map(d => ({
      date: d,
      total: byType.filter(i => (i.date ?? today) <= d).reduce((s, i) => s + i.amount, 0),
    }))
    return { type, points, color: TYPE_META[type].color }
  })

  const maxV = Math.max(...series.flatMap(s => s.points.map(p => p.total)), 1)

  function toXY(i: number, total: number): [number, number] {
    const x = allDates.length === 1 ? W / 2 : (i / (allDates.length - 1)) * W
    const y = H - (total / maxV) * (H - 10)
    return [x, y]
  }

  function fmtAmt(v: number) {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`
    if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`
    if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`
    return `₹${v}`
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%"
        style={{ display: 'block', overflow: 'visible' }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={0} y1={H - f * H} x2={W} y2={H - f * H}
            stroke="rgba(180,155,110,0.1)" strokeWidth="1" strokeDasharray="4 4"/>
        ))}
        <line x1={0} y1={H} x2={W} y2={H}
          stroke="rgba(180,155,110,0.18)" strokeWidth="1"/>

        {series.map(s => {
          const pts = s.points.map((p, i) => toXY(i, p.total))
          const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ')
          const area = `0,${H} ${pts.map(([x, y]) => `${x},${y}`).join(' ')} ${W},${H}`
          const gradId = `cg${s.color.replace('#', '')}`
          return (
            <g key={s.type}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.15"/>
                  <stop offset="100%" stopColor={s.color} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <polygon points={area} fill={`url(#${gradId})`}/>
              <polyline points={polyline} fill="none"
                stroke={s.color} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"/>
              {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill={s.color}/>
              ))}
            </g>
          )
        })}

        {allDates.map((d, i) => {
          const [x] = toXY(i, 0)
          return (
            <text key={d} x={x} y={H + 16} fontSize="9"
              fill="var(--muted)" textAnchor="middle"
              fontFamily="Inter,sans-serif">{d.slice(5)}</text>
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>₹0</span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>{fmtAmt(maxV)}</span>
      </div>
    </div>
  )
}

// ── Donut chart ────────────────────────────────────────────────────────────
function DonutChart({ investments }: { investments: Investment[] }) {
  const totals: Partial<Record<InvestmentType, number>> = {}
  investments.forEach(inv => {
    totals[inv.type] = (totals[inv.type] ?? 0) + inv.amount
  })
  const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1
  const slices = Object.entries(totals) as [InvestmentType, number][]

  const circumference = 2 * Math.PI * 52
  let offset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
        <svg viewBox="0 0 130 130" width="90" height="90">
          <circle cx="65" cy="65" r="52" fill="none"
            stroke="var(--surface2)" strokeWidth="20"/>
          {slices.map(([type, amt], i) => {
            const pct = amt / grand
            const dash = pct * circumference
            const startOffset = offset
            offset += dash
            const rotate = -90 + (startOffset / circumference) * 360
            return (
              <circle key={i} cx="65" cy="65" r="52"
                fill="none" stroke={TYPE_META[type].color}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference - dash}`}
                transform={`rotate(${rotate} 65 65)`}/>
            )
          })}
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Playfair Display,serif',
            fontSize: 10, color: 'var(--text)' }}>Total</div>
          <div style={{ fontSize: 9, color: 'var(--muted)' }}>
            {slices.length} types
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.map(([type, amt]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2,
                background: TYPE_META[type].color }}/>
              <span style={{ fontSize: 10, color: 'var(--text-sm)' }}>
                {TYPE_META[type].label}
              </span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)' }}>
              {Math.round(amt / grand * 100)}%
            </span>
          </div>
        ))}
        {slices.length === 0 && (
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>No investments yet</span>
        )}
      </div>
    </div>
  )
}

// ── MF Donut Chart ─────────────────────────────────────────────────────────
function MFDonutChart({ investments }: { investments: Investment[] }) {
  const mfInvs = investments.filter(inv => inv.type === 'mf' && inv.mfType)
  const totals: Partial<Record<MutualFundType, number>> = {}
  mfInvs.forEach(inv => {
    const t = inv.mfType!
    totals[t] = (totals[t] ?? 0) + inv.amount
  })
  const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1
  const slices = (Object.entries(totals) as [MutualFundType, number][]).sort((a, b) => b[1] - a[1])
  const circumference = 2 * Math.PI * 52
  let offset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        <svg viewBox="0 0 130 130" width="140" height="140">
          <circle cx="65" cy="65" r="52" fill="none" stroke="var(--surface2)" strokeWidth="22"/>
          {slices.map(([type, amt], i) => {
            const pct = amt / grand
            const dash = pct * circumference
            const startOffset = offset
            offset += dash
            const rotate = -90 + (startOffset / circumference) * 360
            return (
              <circle key={i} cx="65" cy="65" r="52" fill="none"
                stroke={MF_COLORS[type]} strokeWidth="22"
                strokeDasharray={`${dash} ${circumference - dash}`}
                transform={`rotate(${rotate} 65 65)`}/>
            )
          })}
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 13,
            color: 'var(--text)', fontWeight: 500 }}>{slices.length}</div>
          <div style={{ fontSize: 9, color: 'var(--muted)' }}>MF Types</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slices.map(([type, amt]) => {
          const pct = Math.round(amt / grand * 100)
          return (
            <div key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span>{MF_META[type].emoji}</span>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                    {MF_META[type].label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>₹{amt.toLocaleString()}</span>
                  <span style={{ color: MF_COLORS[type], fontWeight: 700 }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: MF_COLORS[type] }}/>
              </div>
            </div>
          )
        })}
        {slices.length === 0 && (
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            No MF entries with sub-type tracked yet
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const router = useRouter()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)

  const [formDate, setFormDate]     = useState('')
  const [formType, setFormType]     = useState<InvestmentType>('mf')
  const [formMfType, setFormMfType] = useState<MutualFundType>('largecap')
  const [formAmount, setFormAmount] = useState('')
  const [formNote, setFormNote]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')
  const [expandedType, setExpandedType] = useState<InvestmentType | null>(null)

  // SIP state
  const [sipPlans, setSipPlans]         = useState<SipPlan[]>([])
  const [showSipForm, setShowSipForm]   = useState(false)
  const [sipSaving, setSipSaving]       = useState(false)
  const [sipError, setSipError]         = useState('')
  const [sipType, setSipType]           = useState<InvestmentType>('mf')
  const [sipMfType, setSipMfType]       = useState<MfType>('flexicap')
  const [sipAmount, setSipAmount]       = useState('')
  const [sipFreq, setSipFreq]           = useState<SipFrequency>('monthly')
  const [sipStartDate, setSipStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [sipNote, setSipNote]           = useState('')
  const [expandedSipId, setExpandedSipId]   = useState<string | null>(null)
  const [sipHistory, setSipHistory]         = useState<Record<string, Investment[]>>({})
  const [historyLoading, setHistoryLoading] = useState<string | null>(null)
  const [editingSipId, setEditingSipId]     = useState<string | null>(null)
  const [editAmount, setEditAmount]         = useState('')
  const [editNote, setEditNote]             = useState('')
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)

  const loadInvestments = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setLoading(false); return }

    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const headers = { 'Authorization': `Bearer ${session.access_token}` }
    const invRes = await fetch(`${BASE}/investments`, { headers })

if (invRes.ok) {
  const json = await invRes.json() as { investments: Investment[] }
  setInvestments(json.investments ?? [])
}

const sipRes = await fetch(`${BASE}/sips`, { headers })

if (sipRes.ok) {
  const json = await sipRes.json() as { sips: SipPlan[] }
  setSipPlans(json.sips ?? [])
}

setLoading(false)
  }, [])

    useEffect(() => {
    async function init() {
      await loadInvestments()
    }
    init()
  }, [loadInvestments])

  // ── SIP handlers ────────────────────────────────────────────────────────
  async function handleCreateSip() {
    setSipError('')
    const amt = parseFloat(sipAmount)
    if (!sipAmount || isNaN(amt) || amt <= 0) { setSipError('Enter a valid amount'); return }
    if (!sipStartDate) { setSipError('Select a start date'); return }
    setSipSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSipError('Not logged in'); setSipSaving(false); return }
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/sips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({
        investment_type: sipType,
        mf_type: sipType === 'mf' ? sipMfType : undefined,
        amount: amt, frequency: sipFreq,
        start_date: sipStartDate, note: sipNote || undefined,
      }),
    })
    const json = await res.json() as { sip?: SipPlan; immediateInvestment?: Investment; error?: string }
    if (!res.ok) { setSipError(json.error ?? 'Failed to create SIP'); setSipSaving(false); return }
    if (json.sip) setSipPlans(prev => [json.sip!, ...prev])
    await loadInvestments()
    setSipAmount(''); setSipNote(''); setSipType('mf'); setSipMfType('flexicap')
    setSipFreq('monthly'); setSipStartDate(new Date().toISOString().slice(0, 10))
    setShowSipForm(false)
    setSipSaving(false)
  }

  async function handleSipPatch(id: string, patch: Partial<{ amount: number; note: string; status: SipStatus }>) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/sips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify(patch),
    })
    if (!res.ok) return
    const json = await res.json() as { sip: SipPlan }
    if (json.sip) setSipPlans(prev => prev.map(s => s.id === id ? json.sip : s))
      await loadInvestments()
  }

  async function handleSipCancel(id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    await fetch(`${BASE}/sips/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    setSipPlans(prev => prev.filter(s => s.id !== id))
    setCancelConfirmId(null)
    await loadInvestments()
  }

  async function handleLoadHistory(id: string) {
    if (expandedSipId === id) { setExpandedSipId(null); return }
    setExpandedSipId(id)
    if (sipHistory[id]) return
    setHistoryLoading(id)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setHistoryLoading(null); return }
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/sips/${id}/history`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const json = await res.json() as { history: Investment[] }
      setSipHistory(prev => ({ ...prev, [id]: json.history ?? [] }))
    }
    setHistoryLoading(null)
  }

  async function handleSipEditSave(id: string) {
    const amt = parseFloat(editAmount)
    if (isNaN(amt) || amt <= 0) return
    await handleSipPatch(id, { amount: amt, note: editNote || undefined })
    setEditingSipId(null)
  }

  async function handleAdd() {
    setFormError('')
    const amt = parseFloat(formAmount)
    if (!formAmount || isNaN(amt) || amt <= 0) {
      setFormError('Enter a valid amount'); return
    }

    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setFormError('Not logged in'); setSaving(false); return }

    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/investments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        date: formDate || undefined, type: formType,
        mfType: formType === 'mf' ? formMfType : undefined,
        amount: amt, note: formNote || undefined,
      }),
    })

    if (res.ok) {
      setFormDate(''); setFormAmount(''); setFormNote(''); setFormType('mf'); setFormMfType('largecap')
      await loadInvestments()
    } else {
      const j = await res.json() as { error?: string }
      setFormError(j.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  async function handleDuplicate(inv: Investment) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/investments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        type: inv.type,
        mfType: inv.type === 'mf' ? (inv.mfType ?? undefined) : undefined,
        amount: inv.amount,
        note: inv.note ?? undefined,
      }),
    })
    if (!res.ok) {
      const j = await res.json() as { error?: string }
      setFormError(j.error ?? 'Failed to duplicate investment')
      return
    }
    const j = await res.json() as { investment: Investment }
    if (j.investment) setInvestments(prev => [j.investment, ...prev])
  }

  async function handleDelete(id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/investments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('Failed to delete investment:', res.status, body)
      setFormError('Failed to delete investment. Please try again.')
      return
    }
    await loadInvestments()
  }

  function fmtAmt(v: number) {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`
    if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`
    if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`
    return `₹${v.toFixed(2)}`
  }

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)

  const byType = TYPES.map(t => ({
    type: t,
    total: investments.filter(i => i.type === t).reduce((s, i) => s + i.amount, 0),
    entries: investments.filter(i => i.type === t),
  })).filter(t => t.total > 0)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif' }}>
      <style>{CSS}</style>

      <DNavbar activeTab="Portfolio" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 80px' }}>

        {/* ADD INVESTMENT */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '22px 24px',
          border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
            textTransform: 'uppercase', fontWeight: 500, marginBottom: 14 }}>
            Add Investment
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr',
            gap: 12, marginBottom: 12 }}>

            {/* Date */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)',
                fontWeight: 500, display: 'block', marginBottom: 5 }}>
                Date
              </label>
              <input
                type="date"
                value={formDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setFormDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Type */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)',
                fontWeight: 500, display: 'block', marginBottom: 5 }}>Investment Type</label>
              <select value={formType}
                onChange={e => setFormType(e.target.value as InvestmentType)}
                style={{ width: '100%', background: 'var(--surface2)',
                  border: '1px solid var(--border-md)', borderRadius: 10,
                  padding: '10px 12px', fontSize: 12, color: 'var(--text)',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237A6E5F'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center' }}>
                {FORM_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</option>
                ))}
              </select>
            </div>

            {/* MF Category — conditional */}
            {formType === 'mf' && (
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)',
                  fontWeight: 500, display: 'block', marginBottom: 5 }}>MF Category</label>
                <select value={formMfType}
                  onChange={e => setFormMfType(e.target.value as MutualFundType)}
                  style={{ width: '100%', background: 'var(--surface2)',
                    border: '1px solid var(--border-md)', borderRadius: 10,
                    padding: '10px 12px', fontSize: 12, color: 'var(--text)',
                    appearance: 'none' }}>
                  {MF_TYPES.map(t => (
                    <option key={t} value={t}>{MF_META[t].emoji} {MF_META[t].label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)',
                fontWeight: 500, display: 'block', marginBottom: 5 }}>Amount (₹)</label>
              <input type="number" step="0.01" min="0"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                placeholder="e.g. 5000.00"
                style={{ width: '100%', background: 'var(--surface2)',
                  border: '1px solid var(--border-md)', borderRadius: 10,
                  padding: '10px 12px', fontSize: 12, color: 'var(--text)' }}/>
            </div>

            {/* Note */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)',
                fontWeight: 500, display: 'block', marginBottom: 5 }}>Note (optional)</label>
              <input type="text"
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                placeholder="e.g. SIP – Axis Bluechip"
                style={{ width: '100%', background: 'var(--surface2)',
                  border: '1px solid var(--border-md)', borderRadius: 10,
                  padding: '10px 12px', fontSize: 12, color: 'var(--text)' }}/>
            </div>
          </div>

          {formError && (
            <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 10 }}>
              {formError}
            </div>
          )}

          <button onClick={handleAdd} disabled={saving}
            style={{ background: 'var(--gold)', color: '#fff', border: 'none',
              borderRadius: 12, padding: '10px 28px', fontSize: 13, fontWeight: 600,
              opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : '+ Add Investment'}
          </button>
        </div>

        {/* ── SIP PLANS ── */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '22px 24px',
          border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: 16 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500 }}>
              SIP Plans
            </div>
            <button onClick={() => { setShowSipForm(f => !f); setSipError('') }}
              style={{ background: showSipForm ? 'var(--surface2)' : 'var(--gold)', color: showSipForm ? 'var(--text)' : '#fff',
                border: 'none', borderRadius: 10, padding: '6px 16px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {showSipForm ? 'Cancel' : '+ New SIP'}
            </button>
          </div>

          {/* New SIP form */}
          {showSipForm && (
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 18px',
              border: '1px solid var(--border)', marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                {/* Investment Type */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                    Investment Type
                  </label>
                  <select value={sipType} onChange={e => setSipType(e.target.value as InvestmentType)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-md)',
                      borderRadius: 10, padding: '9px 12px', fontSize: 12, color: 'var(--text)' }}>
                    {SIP_TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</option>
                    ))}
                  </select>
                </div>
                {/* MF Type — only when type = mf */}
                {sipType === 'mf' && (
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                      Fund Category
                    </label>
                    <select value={sipMfType} onChange={e => setSipMfType(e.target.value as MfType)}
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-md)',
                        borderRadius: 10, padding: '9px 12px', fontSize: 12, color: 'var(--text)' }}>
                      {(Object.keys(MF_TYPE_META) as MfType[]).map(k => (
                        <option key={k} value={k}>{MF_TYPE_META[k]}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Amount */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                    Amount (₹)
                  </label>
                  <input type="number" step="1" min="1" value={sipAmount}
                    onChange={e => setSipAmount(e.target.value)} placeholder="e.g. 5000"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-md)',
                      borderRadius: 10, padding: '9px 12px', fontSize: 12, color: 'var(--text)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                {/* Frequency */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                    Frequency
                  </label>
                  <select value={sipFreq} onChange={e => setSipFreq(e.target.value as SipFrequency)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-md)',
                      borderRadius: 10, padding: '9px 12px', fontSize: 12, color: 'var(--text)' }}>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                {/* Start Date */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                    Start Date
                  </label>
                  <input type="date" value={sipStartDate}
                    onChange={e => setSipStartDate(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-md)',
                      borderRadius: 10, padding: '9px 12px', fontSize: 12, color: 'var(--text)' }} />
                </div>
                {/* Note */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                    Note (optional)
                  </label>
                  <input type="text" value={sipNote} onChange={e => setSipNote(e.target.value)}
                    placeholder="e.g. Retirement fund"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-md)',
                      borderRadius: 10, padding: '9px 12px', fontSize: 12, color: 'var(--text)' }} />
                </div>
              </div>
              {sipError && (
                <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 10 }}>{sipError}</div>
              )}
              <button onClick={handleCreateSip} disabled={sipSaving}
                style={{ background: 'var(--gold)', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '10px 28px', fontSize: 13, fontWeight: 600,
                  opacity: sipSaving ? 0.7 : 1, cursor: 'pointer' }}>
                {sipSaving ? 'Starting…' : 'Start SIP'}
              </button>
            </div>
          )}

          {/* SIP rows */}
          {sipPlans.filter(s => s.status !== 'cancelled').length === 0 && !showSipForm && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>
              No SIPs set up yet. Start your first SIP with the button above.
            </div>
          )}

          {sipPlans.filter(s => s.status !== 'cancelled').map(sip => {
            const meta = TYPE_META[sip.investment_type as InvestmentType]
            const isExpanded   = expandedSipId === sip.id
            const isEditing    = editingSipId === sip.id
            const isConfirming = cancelConfirmId === sip.id
            const nextDate     = new Date(sip.next_execution_date + 'T00:00:00')
              .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

            return (
              <div key={sip.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 10 }}>
                {/* SIP row header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{meta?.emoji ?? '📈'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {meta?.label ?? sip.investment_type}
                        {sip.mf_type && (
                          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
                            {' • '}{MF_TYPE_META[sip.mf_type] ?? sip.mf_type}
                          </span>
                        )}
                      </span>
                      {sip.status === 'paused' && (
                        <span style={{ fontSize: 9, background: 'rgba(184,146,74,0.15)',
                          color: 'var(--gold)', borderRadius: 6, padding: '2px 7px', fontWeight: 700,
                          letterSpacing: '.4px', textTransform: 'uppercase' }}>
                          Paused
                        </span>
                      )}
                    </div>
                    {!isEditing && (
                      <div style={{ fontSize: 12, color: 'var(--text-sm)' }}>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>
                          {fmtAmt(sip.amount)}
                        </span>
                        {' / '}{sip.frequency}
                        <span style={{ color: 'var(--muted)', marginLeft: 12 }}>
                          Next: {sip.status === 'active' ? nextDate : '—'}
                        </span>
                        {sip.note && (
                          <span style={{ color: 'var(--muted)', marginLeft: 12,
                            fontSize: 10, fontStyle: 'italic' }}>`{sip.note}`</span>
                        )}
                      </div>
                    )}
                    {/* Inline edit form */}
                    {isEditing && (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                        <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                          placeholder="New amount"
                          style={{ width: 110, background: 'var(--surface2)', border: '1px solid var(--border-md)',
                            borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text)' }} />
                        <input type="text" value={editNote} onChange={e => setEditNote(e.target.value)}
                          placeholder="Note (optional)"
                          style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border-md)',
                            borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text)' }} />
                        <button onClick={() => handleSipEditSave(sip.id)}
                          style={{ background: 'var(--gold)', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Save
                        </button>
                        <button onClick={() => setEditingSipId(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)',
                            fontSize: 12, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    )}
                    {/* Cancel confirmation */}
                    {isConfirming && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                        Cancel this SIP? Past entries will be kept.{' '}
                        <button onClick={() => handleSipCancel(sip.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--red)',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                          Yes, cancel
                        </button>
                        {' · '}
                        <button onClick={() => setCancelConfirmId(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)',
                            fontSize: 12, cursor: 'pointer', padding: 0 }}>
                          No
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
                    <button onClick={() => handleLoadHistory(sip.id)}
                      style={{ background: 'none', border: '1px solid var(--border-md)',
                        borderRadius: 8, padding: '4px 10px', fontSize: 11,
                        color: 'var(--muted)', cursor: 'pointer' }}>
                      {isExpanded ? 'History ▴' : 'History ▾'}
                    </button>
                    {!isEditing && (
                      <button onClick={() => { setEditingSipId(sip.id); setEditAmount(String(sip.amount)); setEditNote(sip.note ?? '') }}
                        style={{ background: 'none', border: '1px solid var(--border-md)',
                          borderRadius: 8, padding: '4px 10px', fontSize: 11,
                          color: 'var(--text)', cursor: 'pointer' }}>
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleSipPatch(sip.id, { status: sip.status === 'active' ? 'paused' : 'active' })}
                      style={{ background: 'none', border: '1px solid var(--border-md)',
                        borderRadius: 8, padding: '4px 10px', fontSize: 11,
                        color: sip.status === 'active' ? 'var(--gold)' : 'var(--green)',
                        cursor: 'pointer' }}>
                      {sip.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => setCancelConfirmId(isConfirming ? null : sip.id)}
                      style={{ background: 'none', border: '1px solid rgba(192,57,43,0.25)',
                        borderRadius: 8, padding: '4px 10px', fontSize: 11,
                        color: 'var(--red)', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>

                {/* History panel */}
                {isExpanded && (
                  <div style={{ marginTop: 12, background: 'var(--surface2)', borderRadius: 10,
                    padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.4px',
                      textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                      Execution History
                    </div>
                    {historyLoading === sip.id && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Loading…</div>
                    )}
                    {!historyLoading && sipHistory[sip.id] && sipHistory[sip.id].length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>No entries yet.</div>
                    )}
                    {!historyLoading && sipHistory[sip.id] && sipHistory[sip.id].slice(0, 10).map((h, i) => (
                      <div key={h.id} style={{ display: 'grid',
                        gridTemplateColumns: '110px 1fr 100px',
                        gap: 8, padding: '7px 0',
                        borderBottom: i < Math.min(sipHistory[sip.id].length, 10) - 1
                          ? '1px solid rgba(180,155,110,0.08)' : 'none',
                        fontSize: 12 }}>
                        <span style={{ color: 'var(--muted)' }}>
                          {h.date ? new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN',
                            { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                        <span style={{ color: 'var(--text)' }}>
                          {TYPE_META[h.type as InvestmentType]?.emoji} {TYPE_META[h.type as InvestmentType]?.label ?? h.type}
                        </span>
                        <span style={{ color: 'var(--text)', textAlign: 'right', fontWeight: 600 }}>
                          {fmtAmt(h.amount)}
                        </span>
                      </div>
                    ))}
                    {!historyLoading && sipHistory[sip.id] && sipHistory[sip.id].length > 10 && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                        Showing 10 of {sipHistory[sip.id].length} entries —{' '}
                        <span style={{ color: 'var(--gold)', cursor: 'pointer' }}
                          onClick={() => router.push('/portfolio')}>
                          view all in investments log
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── INVESTMENTS TABLE ── */}
        {investments.length > 0 && (
          <div style={{ background:'var(--surface)',
            borderRadius:18, padding:'20px 22px',
            border:'1px solid var(--border)',
            marginBottom:16 }}>

            <div style={{ fontSize:10, color:'var(--muted)',
              letterSpacing:'.45px', textTransform:'uppercase',
              fontWeight:500, marginBottom:14 }}>
              Investment Entries
            </div>

            {/* Table header */}
            <div style={{ display:'grid',
              gridTemplateColumns:'110px 1fr 130px 130px',
              gap:12, padding:'6px 10px',
              background:'var(--surface2)',
              borderRadius:8, marginBottom:8 }}>
              <div style={{ fontSize:10, color:'var(--muted)',
                fontWeight:600, letterSpacing:'.4px',
                textTransform:'uppercase' }}>Date</div>
              <div style={{ fontSize:10, color:'var(--muted)',
                fontWeight:600, letterSpacing:'.4px',
                textTransform:'uppercase' }}>Type</div>
              <div style={{ fontSize:10, color:'var(--muted)',
                fontWeight:600, letterSpacing:'.4px',
                textTransform:'uppercase',
                textAlign:'right' }}>Amount</div>
              <div style={{ fontSize:10, color:'var(--muted)',
                fontWeight:600, letterSpacing:'.4px',
                textTransform:'uppercase',
                textAlign:'center' }}>Actions</div>
            </div>

            {/* Table rows */}
            {[...investments]
              .sort((a, b) => (b.date ?? '9999').localeCompare(a.date ?? '9999'))
              .map((inv, i) => (
                <div key={inv.id}
                  style={{ display:'grid',
                    gridTemplateColumns:'110px 1fr 130px 130px',
                    gap:12, padding:'10px 10px',
                    borderBottom: i < investments.length - 1
                      ? '1px solid rgba(180,155,110,0.08)'
                      : 'none',
                    alignItems:'center' }}>

                  {/* Date */}
                  <div style={{ fontSize:12, color:'var(--muted)' }}>
                    {inv.date
                      ? new Date(inv.date + 'T00:00:00').toLocaleDateString('en-IN', {
                          day:'numeric', month:'short', year:'numeric'
                        })
                      : '—'}
                  </div>

                  {/* Type */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%',
                      background:TYPE_META[inv.type as InvestmentType]?.color
                        ?? '#B8924A',
                      flexShrink:0 }}/>
                    <span style={{ fontSize:13, color:'var(--text)',
                      fontWeight:500 }}>
                      {TYPE_META[inv.type as InvestmentType]?.emoji ?? ''}{' '}
                      {TYPE_META[inv.type as InvestmentType]?.label ?? inv.type}
                      {inv.type === 'mf' &&
 inv.mfType &&
 MF_META[inv.mfType as MutualFundType] && (
  <>
    {' '}•{' '}
    <span style={{ color:'var(--gold)', fontWeight:600 }}>
      {MF_META[inv.mfType as MutualFundType].label}
    </span>
  </>
)}
                    </span>
                    {inv.note && (
                      <span style={{ fontSize:10, color:'var(--muted)',
                        background:'var(--surface2)',
                        borderRadius:6, padding:'1px 7px',
                        border:'1px solid var(--border)',
                        maxWidth:120,
                        overflow:'hidden',
                        textOverflow:'ellipsis',
                        whiteSpace:'nowrap' }}>
                        {inv.note}
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div style={{ fontFamily:'Playfair Display,serif',
                    fontSize:14, color:'var(--text)',
                    fontWeight:500, textAlign:'right' }}>
                    {fmtAmt(inv.amount)}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                    <button
                      onClick={() => handleDuplicate(inv)}
                      style={{ background:'none',
                        border:'1px solid rgba(184,146,74,0.35)',
                        borderRadius:8, padding:'3px 10px',
                        fontSize:11, color:'var(--gold)',
                        cursor:'pointer' }}>
                      Dup
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      style={{ background:'none',
                        border:'1px solid rgba(192,57,43,0.25)',
                        borderRadius:8, padding:'3px 10px',
                        fontSize:11, color:'var(--red)',
                        cursor:'pointer' }}>
                      Del
                    </button>
                  </div>
                </div>
              ))}

            {/* Table footer: total */}
            <div style={{ display:'grid',
              gridTemplateColumns:'110px 1fr 130px 130px',
              gap:12, padding:'10px 10px',
              marginTop:4,
              borderTop:'1px solid var(--border)',
              background:'var(--surface2)',
              borderRadius:'0 0 10px 10px' }}>
              <div style={{ fontSize:11, color:'var(--muted)',
                fontWeight:600, gridColumn:'1 / 3' }}>
                Total ({investments.length} entries)
              </div>
              <div style={{ fontFamily:'Playfair Display,serif',
                fontSize:15, color:'var(--gold)',
                fontWeight:600, textAlign:'right' }}>
                {fmtAmt(investments.reduce((s, i) => s + i.amount, 0))}
              </div>
            </div>
          </div>
        )}

        {/* ── MF SUB-TYPE BREAKDOWN ── */}
        {investments.some(inv => inv.type === 'mf' && inv.mfType) && (
          <div
  onClick={() => router.push('/allocation')}
  style={{
    background: 'var(--surface)',
    borderRadius: 18,
    padding: '20px 22px',
    border: '1px solid var(--border)',
    marginBottom: 16,
    cursor: 'pointer',
    transition: 'transform .15s ease',
  }}
>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 16 }}>
              Mutual Fund Breakdown
            </div>
            <MFDonutChart investments={investments} />
          </div>
        )}

        {/* ── PORTFOLIO PIE CHART ── */}
        {investments.length > 0 && (() => {
          const totals: Partial<Record<InvestmentType, number>> = {}
          investments.forEach(inv => {
            totals[inv.type as InvestmentType] =
              (totals[inv.type as InvestmentType] ?? 0) + inv.amount
          })
          const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1
          const slices = (Object.entries(totals) as [InvestmentType, number][])
            .sort((a, b) => b[1] - a[1])
          const circumference = 2 * Math.PI * 52
          let offset = 0

          return (
            <div
  onClick={() => router.push('/allocation')}
  style={{
    background:'var(--surface)',
    borderRadius:18,
    padding:'20px 22px',
    border:'1px solid var(--border)',
    marginBottom:16,
    cursor:'pointer',
    transition:'transform .15s ease',
  }}
>

              <div style={{ fontSize:10, color:'var(--muted)',
                letterSpacing:'.45px', textTransform:'uppercase',
                fontWeight:500, marginBottom:16 }}>
                Portfolio Breakdown
              </div>

              <div style={{ display:'flex',
                alignItems:'center', gap:32,
                flexWrap:'wrap' }}>

                {/* Donut */}
                <div style={{ position:'relative',
                  width:140, height:140, flexShrink:0 }}>
                  <svg viewBox="0 0 130 130"
                    width="140" height="140">
                    <circle cx="65" cy="65" r="52"
                      fill="none" stroke="var(--surface2)"
                      strokeWidth="22"/>
                    {slices.map(([type, amt], i) => {
                      const pct  = amt / grand
                      const dash = pct * circumference
                      const startOffset = offset
                      offset += dash
                      const rotate = -90 + (startOffset / circumference) * 360
                      return (
                        <circle key={i} cx="65" cy="65" r="52"
                          fill="none"
                          stroke={TYPE_META[type].color}
                          strokeWidth="22"
                          strokeDasharray={`${dash} ${circumference - dash}`}
                          transform={`rotate(${rotate} 65 65)`}/>
                      )
                    })}
                  </svg>
                  <div style={{ position:'absolute',
                    top:'50%', left:'50%',
                    transform:'translate(-50%,-50%)',
                    textAlign:'center' }}>
                    <div style={{ fontFamily:'Playfair Display,serif',
                      fontSize:13, color:'var(--text)',
                      fontWeight:500 }}>
                      {slices.length}
                    </div>
                    <div style={{ fontSize:9,
                      color:'var(--muted)' }}>types</div>
                  </div>
                </div>

                {/* Legend with percentage bars */}
                <div style={{ flex:1, minWidth:200,
                  display:'flex', flexDirection:'column',
                  gap:10 }}>
                  {slices.map(([type, amt]) => {
                    const pct = Math.round(amt / grand * 100)
                    return (
                      <div key={type}>
                        <div style={{ display:'flex',
                          justifyContent:'space-between',
                          alignItems:'center',
                          marginBottom:4 }}>
                          <div style={{ display:'flex',
                            alignItems:'center', gap:7 }}>
                            <span style={{ fontSize:14 }}>
                              {TYPE_META[type].emoji}
                            </span>
                            <span style={{ fontSize:12,
                              color:'var(--text)',
                              fontWeight:500 }}>
                              {TYPE_META[type].label}
                            </span>
                          </div>
                          <div style={{ display:'flex',
                            alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:12,
                              color:'var(--muted)' }}>
                              {fmtAmt(amt)}
                            </span>
                            <span style={{ fontSize:12,
                              fontWeight:700,
                              color:TYPE_META[type].color,
                              minWidth:32,
                              textAlign:'right' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div style={{ height:5,
                          background:'var(--surface2)',
                          borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%',
                            width:`${pct}%`,
                            background:TYPE_META[type].color,
                            borderRadius:4,
                            transition:'width .4s ease' }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 18,
            padding: '18px 20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Total Invested</div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 24, color: 'var(--text)' }}>
              {fmtAmt(totalInvested)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              across {investments.length} entries
            </div>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 18,
            padding: '18px 20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Asset Types</div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 24, color: 'var(--text)' }}>
              {byType.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {byType.map(t => TYPE_META[t.type].emoji).join(' ')}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 18,
            padding: '18px 20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>Largest Position</div>
            {byType.length > 0 ? (() => {
              const top = [...byType].sort((a, b) => b.total - a.total)[0]
              return (
                <>
                  <div style={{ fontFamily: 'Playfair Display,serif',
                    fontSize: 20, color: 'var(--text)' }}>
                    {TYPE_META[top.type].emoji} {TYPE_META[top.type].label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {fmtAmt(top.total)} · {Math.round(top.total / totalInvested * 100)}%
                  </div>
                </>
              )
            })() : (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                No investments yet
              </div>
            )}
          </div>
        </div>

        {/* COMBINED GROWTH CHART */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '20px 22px',
          border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500 }}>Investment Growth Over Time</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {byType.map(t => (
                <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%',
                    background: TYPE_META[t.type].color }}/>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {TYPE_META[t.type].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <CombinedChart investments={investments}/>
        </div>

{/* INDIVIDUAL TYPE CARDS */}
        {byType.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.45px',
              textTransform: 'uppercase', fontWeight: 500, marginBottom: 12 }}>
              Individual Breakdown
            </div>
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {byType.map(({ type, total, entries }) => (
                <div key={type}
                  style={{ background: 'var(--surface)', borderRadius: 18,
                    padding: '18px 20px', border: '1px solid var(--border)',
                    borderLeft: `3px solid ${TYPE_META[type].color}`, cursor: 'pointer' }}
                  onClick={() => setExpandedType(expandedType === type ? null : type)}>

                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{TYPE_META[type].emoji}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                        {TYPE_META[type].label}
                      </span>
                    </div>
                    <span style={{ fontSize: 18, color: 'var(--muted)',
                      display: 'inline-block',
                      transform: expandedType === type ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform .2s' }}>⌄</span>
                  </div>

                  <div style={{ fontFamily: 'Playfair Display,serif',
                    fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
                    {fmtAmt(total)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'} ·{' '}
                    {Math.round(total / totalInvested * 100)}% of portfolio
                  </div>

                  {expandedType === type && (
                    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)',
                      paddingTop: 14 }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)',
                        marginBottom: 8, fontWeight: 500 }}>Growth Trend</div>
                      <MiniChart
                        entries={entries.map(e => ({ date: e.date, amount: e.amount }))}
                        color={TYPE_META[type].color}
                      />
                      <div style={{ marginTop: 12 }}>
                        {[...entries]
                          .sort((a, b) => (b.date ?? '9999').localeCompare(a.date ?? '9999'))
                          .map(entry => (
                          <div key={entry.id}
                            style={{ display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', padding: '7px 0',
                              borderTop: '1px solid var(--border)' }}>
                            <div>
                              <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                                {fmtAmt(entry.amount)}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                                {entry.date ? fmtDate(entry.date) : '—'}{entry.note && ` · ${entry.note}`}
                              </div>
                            </div>
                            <div style={{ display:'flex', gap:5 }}>
                              <button
                                onClick={e => { e.stopPropagation(); handleDuplicate(entry) }}
                                style={{ background: 'none',
                                  border: '1px solid rgba(184,146,74,0.35)',
                                  borderRadius: 8, padding: '3px 8px',
                                  fontSize: 10, color: 'var(--gold)', cursor: 'pointer' }}>
                                Dup
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); void handleDelete(entry.id) }}
                                style={{ background: 'none',
                                  border: '1px solid rgba(192,57,43,0.25)',
                                  borderRadius: 8, padding: '3px 8px',
                                  fontSize: 10, color: 'var(--red)', cursor: 'pointer' }}>
                                Del
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && investments.length === 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '40px 24px',
            border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💼</div>
            <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 16,
              color: 'var(--text)', marginBottom: 8 }}>No investments tracked yet</p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              Use the form above to add your first investment entry.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}