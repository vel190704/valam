'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DNavbar from '@/components/layout/dnavbar'

interface NetworthItem {
  id: string
  category: string
  label: string
  amount: number
  note?: string
}

const ASSET_CATS: { key: string; label: string; color: string }[] = [
  { key: 'cash',         label: 'Cash & Savings',  color: '#27AE60' },
  { key: 'emergency',    label: 'Emergency Fund',   color: '#2ECC71' },
  { key: 'property',     label: 'Property',         color: '#B8924A' },
  { key: 'vehicle',      label: 'Vehicle',          color: '#5B8DB8' },
  { key: 'other_asset',  label: 'Other Asset',      color: '#9B59B6' },
]
const LIABILITY_CATS: { key: string; label: string; color: string }[] = [
  { key: 'debt',            label: 'Loan / Debt',       color: '#E74C3C' },
  { key: 'emi',             label: 'EMI Outstanding',   color: '#C0392B' },
  { key: 'vehicle_loan',    label: 'Vehicle Loan',      color: '#D35400' },
  { key: 'other_liability', label: 'Other Liability',   color: '#E07B54' },
]
const ALL_CATS = [...ASSET_CATS, ...LIABILITY_CATS]
const LIABILITY_KEYS = new Set(LIABILITY_CATS.map(c => c.key))

function catMeta(key: string) {
  return ALL_CATS.find(c => c.key === key) ?? { label: key, color: '#B8924A' }
}

function fmt(v: number): string {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)}L`
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(1)}K`
  return `₹${v.toFixed(0)}`
}

function NetWorthGauge({ netWorth, totalAssets, totalLiabilities }: {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
}) {
  const grand = totalAssets + totalLiabilities || 1
  const circumference = 2 * Math.PI * 52

  const assetDash = (totalAssets / grand) * circumference
  const liabDash  = (totalLiabilities / grand) * circumference
  const assetRotate = -90
  const liabRotate  = -90 + (totalAssets / grand) * 360

  return (
    <div style={{ display:'flex', alignItems:'center',
      gap:28, flexWrap:'wrap' }}>

      {/* Donut */}
      <div style={{ position:'relative',
        width:160, height:160, flexShrink:0 }}>
        <svg viewBox="0 0 130 130"
          width="160" height="160">
          <circle cx="65" cy="65" r="52"
            fill="none" stroke="var(--surface2)"
            strokeWidth="22"/>
          {totalAssets > 0 && (
            <circle cx="65" cy="65" r="52"
              fill="none" stroke="#27AE60"
              strokeWidth="22" strokeOpacity="0.85"
              strokeDasharray={`${assetDash} ${circumference - assetDash}`}
              transform={`rotate(${assetRotate} 65 65)`}/>
          )}
          {totalLiabilities > 0 && (
            <circle cx="65" cy="65" r="52"
              fill="none" stroke="#E74C3C"
              strokeWidth="22" strokeOpacity="0.85"
              strokeDasharray={`${liabDash} ${circumference - liabDash}`}
              transform={`rotate(${liabRotate} 65 65)`}/>
          )}
          <text x="65" y="60"
            textAnchor="middle" fontSize="12"
            fontFamily="Playfair Display,serif"
            fill={netWorth >= 0 ? '#27AE60' : '#E74C3C'}>
            {fmt(Math.abs(netWorth))}
          </text>
          <text x="65" y="74"
            textAnchor="middle" fontSize="9"
            fontFamily="Inter,sans-serif"
            fill="var(--muted)">
            {netWorth >= 0 ? 'Net Worth' : 'Net Debt'}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {/* Assets */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:14, height:14, borderRadius:4,
            background:'#27AE60', opacity:0.85 }}/>
          <div>
            <div style={{ fontSize:10, color:'#27AE60',
              fontWeight:700, letterSpacing:'.4px' }}>
              ASSETS
            </div>
            <div style={{ fontFamily:'Playfair Display,serif',
              fontSize:20, color:'var(--text)' }}>
              {fmt(totalAssets)}
            </div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:1 }}>
              {totalAssets > 0
                ? `${Math.round(totalAssets / grand * 100)}% of total`
                : 'None added yet'}
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:14, height:14, borderRadius:4,
            background:'#E74C3C', opacity:0.85 }}/>
          <div>
            <div style={{ fontSize:10, color:'#E74C3C',
              fontWeight:700, letterSpacing:'.4px' }}>
              LIABILITIES
            </div>
            <div style={{ fontFamily:'Playfair Display,serif',
              fontSize:20, color:'var(--text)' }}>
              {fmt(totalLiabilities)}
            </div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:1 }}>
              {totalLiabilities > 0
                ? `${Math.round(totalLiabilities / grand * 100)}% of total`
                : 'None added yet'}
            </div>
          </div>
        </div>

        {/* Net Worth highlight */}
        <div style={{ padding:'10px 14px',
          background: netWorth >= 0
            ? 'rgba(39,174,96,0.08)'
            : 'rgba(231,76,60,0.08)',
          borderRadius:10,
          borderLeft:`3px solid ${netWorth >= 0 ? '#27AE60' : '#E74C3C'}` }}>
          <div style={{ fontSize:9, color:'var(--muted)',
            fontWeight:600, letterSpacing:'.4px',
            textTransform:'uppercase' }}>Net Worth</div>
          <div style={{ fontFamily:'Playfair Display,serif',
            fontSize:22,
            color: netWorth >= 0 ? '#27AE60' : '#E74C3C' }}>
            {netWorth < 0 ? '−' : ''}{fmt(Math.abs(netWorth))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NetworthPage() {
  const router = useRouter()
  const [items, setItems]         = useState<NetworthItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [userId, setUserId]       = useState<string | null>(null)
  const [token, setToken]         = useState<string | null>(null)
  // form state
  const [formCat,    setFormCat]    = useState('cash')
  const [formLabel,  setFormLabel]  = useState('')
  const [formAmt,    setFormAmt]    = useState('')
  const [formNote,   setFormNote]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const load = useCallback(async (tok: string) => {
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/networth`, {
      headers: { 'Authorization': `Bearer ${tok}` },
    })
    if (res.ok) {
      const json = await res.json() as { items: NetworthItem[] }
      setItems(json.items ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      setToken(session.access_token)
      load(session.access_token)
    })
  }, [router, load])

  const totalAssets      = items.filter(i => !LIABILITY_KEYS.has(i.category)).reduce((s, i) => s + i.amount, 0)
  const totalLiabilities = items.filter(i =>  LIABILITY_KEYS.has(i.category)).reduce((s, i) => s + i.amount, 0)
  const netWorth         = totalAssets - totalLiabilities

  async function addItem() {
    if (!formLabel.trim() || !formAmt) { setError('Label and amount required'); return }
    const amount = parseFloat(formAmt)
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid amount'); return }
    setSubmitting(true); setError('')
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/networth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category: formCat, label: formLabel.trim(), amount, note: formNote.trim() || undefined }),
    })
    if (!res.ok) { setError('Failed to save'); setSubmitting(false); return }
    const json = await res.json() as { item: NetworthItem }
    setItems(prev => [...prev, json.item])
    setFormLabel(''); setFormAmt(''); setFormNote('')
    setSubmitting(false)
  }

  function duplicateItem(item: NetworthItem) {
    setFormCat(item.category)
    setFormLabel(item.label)
    setFormAmt(String(item.amount))
    setFormNote(item.note ?? '')
  }

  async function deleteItem(id: string) {
    const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
    const res = await fetch(`${BASE}/networth/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('Failed to delete networth item:', res.status, body)
      return
    }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const assetItems     = items.filter(i => !LIABILITY_KEYS.has(i.category))
  const liabilityItems = items.filter(i =>  LIABILITY_KEYS.has(i.category))

  return (
    <>
      <style>{`
        :root {
          --bg: #F8F5F0; --surface: #FFFFFF; --surface2: #F2EDE6;
          --border: rgba(180,155,110,0.18); --text: #1A1612;
          --text-sm: #4A3F35; --muted: #8C7B6B; --gold: #B8924A;
          --green: #27AE60; --red: #E74C3C;
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
        body { background: var(--bg); color: var(--text); margin: 0; padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        * { box-sizing: border-box; }
        input, select, textarea { background: var(--surface2); border: 1px solid var(--border);
          color: var(--text); border-radius: 10px; padding: 9px 12px; font-size: 13px;
          font-family: inherit; width: 100%; outline: none; }
        input:focus, select:focus, textarea:focus { border-color: var(--gold); }
        button { cursor: pointer; font-family: inherit; border: none; }
      `}</style>

      <DNavbar activeTab="Net Worth" />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* GAUGE HERO */}
        <div style={{ background: 'var(--surface)', borderRadius: 18,
          border: '1px solid var(--border)', padding: '24px 20px',
          display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
          <NetWorthGauge
            netWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
          />
        </div>

        {/* ADD FORM */}
        <div style={{ background: 'var(--surface)', borderRadius: 18,
          border: '1px solid var(--border)', padding: '20px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600,
            marginBottom: 14 }}>Add Item</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Category</div>
              <select value={formCat} onChange={e => setFormCat(e.target.value)}>
                <optgroup label="Assets">
                  {ASSET_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </optgroup>
                <optgroup label="Liabilities">
                  {LIABILITY_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Label</div>
              <input placeholder="e.g. SBI Savings Account" value={formLabel}
                onChange={e => setFormLabel(e.target.value)}/>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Amount (₹)</div>
              <input type="number" min="0" placeholder="0" value={formAmt}
                onChange={e => setFormAmt(e.target.value)}/>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Note (optional)</div>
              <input placeholder="e.g. joint account" value={formNote}
                onChange={e => setFormNote(e.target.value)}/>
            </div>
          </div>
          {error && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}
          <button onClick={addItem} disabled={submitting}
            style={{ background: 'var(--gold)', color: '#fff', borderRadius: 10,
              padding: '9px 20px', fontSize: 13, fontWeight: 600,
              opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Saving…' : '+ Add Item'}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 13 }}>
            Loading…
          </div>
        )}

        {/* ASSETS */}
        {!loading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700,
              letterSpacing: '.5px', marginBottom: 10 }}>ASSETS · {fmt(totalAssets)}</div>
            {assetItems.length === 0 ? (
              <div style={{ background: 'var(--surface)', borderRadius: 14,
                border: '1px solid var(--border)', padding: '18px 20px',
                color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
                No assets added yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assetItems.map(item => {
                  const meta = catMeta(item.category)
                  return (
                    <div key={item.id} style={{ background: 'var(--surface)',
                      borderRadius: 14, border: '1px solid var(--border)',
                      padding: '14px 16px', display: 'flex',
                      alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2,
                        background: meta.color, flexShrink: 0 }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                          {meta.label}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Playfair Display,serif',
                        fontSize: 15, color: 'var(--green)', fontWeight: 600 }}>
                        {fmt(item.amount)}
                      </div>
                      <button onClick={() => duplicateItem(item)}
                        style={{ background: 'none', color: 'var(--gold)', fontSize: 11,
                          border: '1px solid rgba(184,146,74,0.35)',
                          padding: '2px 8px', borderRadius: 6 }}>Dup</button>
                      <button onClick={() => deleteItem(item.id)}
                        style={{ background: 'none', color: 'var(--muted)', fontSize: 16,
                          padding: '2px 6px', borderRadius: 6,
                          lineHeight: 1 }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* LIABILITIES */}
        {!loading && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700,
              letterSpacing: '.5px', marginBottom: 10 }}>LIABILITIES · {fmt(totalLiabilities)}</div>
            {liabilityItems.length === 0 ? (
              <div style={{ background: 'var(--surface)', borderRadius: 14,
                border: '1px solid var(--border)', padding: '18px 20px',
                color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
                No liabilities added yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {liabilityItems.map(item => {
                  const meta = catMeta(item.category)
                  return (
                    <div key={item.id} style={{ background: 'var(--surface)',
                      borderRadius: 14, border: '1px solid var(--border)',
                      padding: '14px 16px', display: 'flex',
                      alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2,
                        background: meta.color, flexShrink: 0 }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                          {meta.label}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Playfair Display,serif',
                        fontSize: 15, color: 'var(--red)', fontWeight: 600 }}>
                        {fmt(item.amount)}
                      </div>
                      <button onClick={() => duplicateItem(item)}
                        style={{ background: 'none', color: 'var(--gold)', fontSize: 11,
                          border: '1px solid rgba(184,146,74,0.35)',
                          padding: '2px 8px', borderRadius: 6 }}>Dup</button>
                      <button onClick={() => deleteItem(item.id)}
                        style={{ background: 'none', color: 'var(--muted)', fontSize: 16,
                          padding: '2px 6px', borderRadius: 6, lineHeight: 1 }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
