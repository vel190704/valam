export function getAllocation(level: number) {
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

export type RiskLevel = 'low' | 'medium' | 'high'

export function getAllocationByRisk(level: number, risk: RiskLevel) {
  const base = getAllocation(level)
  if (risk === 'medium') return base

  const aggressive = ['Stocks', 'International', 'Alternatives', 'Crypto', 'ETFs']
  const defensive  = ['Emergency Fund', 'FDs', 'Bonds', 'Gold', 'Mutual Funds']

  const shifted = base.map(item => {
    const { label } = item
    if (risk === 'high') {
      if (aggressive.includes(label)) return { ...item, pct: Math.min(80, item.pct + 10) }
      if (defensive.includes(label))  return { ...item, pct: Math.max(5,  item.pct - 10) }
    }
    if (risk === 'low') {
      if (aggressive.includes(label)) return { ...item, pct: Math.max(5,  item.pct - 10) }
      if (defensive.includes(label))  return { ...item, pct: Math.min(80, item.pct + 10) }
    }
    return item
  })

  const sum = shifted.reduce((s, x) => s + x.pct, 0)
  const exact = shifted.map(item => (item.pct / sum) * 100)
  const floors = exact.map(Math.floor)
  const remainder = 100 - floors.reduce((s, v) => s + v, 0)
  const fracs = exact.map((v, i) => ({ i, f: v - floors[i] })).sort((a, b) => b.f - a.f)
  for (let k = 0; k < remainder; k++) floors[fracs[k].i]++
  return shifted.map((item, i) => ({ ...item, pct: floors[i] }))
}

// Maps actual investment type keys → suggested allocation label
export const TYPE_TO_SUGGESTED: Record<string, string> = {
  mf:    'Mutual Funds',
  stock: 'Stocks',
  fd:    'FDs',
  bond:  'Bonds',
}

// ── Age + risk based allocation (Dinesh's formula) ─────────────────────────

export interface AllocationItem {
  label: string
  pct: number
  color: string
}

export function getSuggestedAllocation(age: number, risk: RiskLevel): AllocationItem[] {
  const EQUITY    = '#5B8DB8'
  const DEBT      = '#27AE60'
  const COMMODITY = '#B8924A'

  if (risk === 'low') {
    if (age < 40) return [
      { label: 'Equity', pct: 70, color: EQUITY },
      { label: 'Debt',   pct: 20, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
    if (age < 60) return [
      { label: 'Equity', pct: 60, color: EQUITY },
      { label: 'Debt',   pct: 30, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
    return [
      { label: 'Equity', pct: 40, color: EQUITY },
      { label: 'Debt',   pct: 50, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
  }

  if (risk === 'medium') {
    if (age < 40) return [
      { label: 'Equity', pct: 80, color: EQUITY },
      { label: 'Debt',   pct: 10, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
    if (age < 60) return [
      { label: 'Equity', pct: 70, color: EQUITY },
      { label: 'Debt',   pct: 20, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
    return [
      { label: 'Equity', pct: 50, color: EQUITY },
      { label: 'Debt',   pct: 40, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
  }

  // high / aggressive
  if (age < 40) return [
    { label: 'Equity', pct: 90, color: EQUITY },
    { label: 'Debt',   pct: 0,  color: DEBT },
    { label: 'Commodity', pct: 10, color: COMMODITY },
  ]
  if (age < 60) return [
    { label: 'Equity', pct: 80, color: EQUITY },
    { label: 'Debt',   pct: 10, color: DEBT },
    { label: 'Commodity', pct: 10, color: COMMODITY },
  ]
  return [
    { label: 'Equity', pct: 60, color: EQUITY },
    { label: 'Debt',   pct: 30, color: DEBT },
    { label: 'Commodity', pct: 10, color: COMMODITY },
  ]
}

// Maps investment type keys → broad asset category
export const TYPE_TO_CATEGORY: Record<string, 'Equity' | 'Debt' | 'Commodity'> = {
  stock: 'Equity',
  mf:    'Equity',
  etf:   'Equity',
  crypto:'Equity',
  fd:    'Debt',
  bond:  'Debt',
  commodity: 'Commodity',
}

export interface EquityAllocationItem {
  label: string
  pct: number
  color: string
}

export const MF_TO_EQUITY_CATEGORY: Record<string, string> = {
  nifty50:  'Index',
  flexicap: 'Flexi',
  largecap: 'Flexi',
  midcap:   'Mid',
  smallcap: 'Small',
}

export function getSuggestedEquityAllocation(age: number, risk: RiskLevel): EquityAllocationItem[] {
  const COLORS = {
    Index: '#5B8DB8',
    Flexi: '#27AE60',
    Mid:   '#B8924A',
    Small: '#DBA512',
  }

  const bucket = age <= 40 ? '18-40' : age <= 60 ? '40-60' : '60+'

  if (risk === 'low') {
    if (bucket === '18-40') return [
      { label: 'Index', pct: 50, color: COLORS.Index },
      { label: 'Flexi', pct: 40, color: COLORS.Flexi },
      { label: 'Mid',   pct: 10, color: COLORS.Mid },
      { label: 'Small', pct: 0,  color: COLORS.Small },
    ]
    if (bucket === '40-60') return [
      { label: 'Index', pct: 60, color: COLORS.Index },
      { label: 'Flexi', pct: 35, color: COLORS.Flexi },
      { label: 'Mid',   pct: 5,  color: COLORS.Mid },
      { label: 'Small', pct: 0,  color: COLORS.Small },
    ]
    return [
      { label: 'Index', pct: 70, color: COLORS.Index },
      { label: 'Flexi', pct: 30, color: COLORS.Flexi },
      { label: 'Mid',   pct: 0,  color: COLORS.Mid },
      { label: 'Small', pct: 0,  color: COLORS.Small },
    ]
  }

  if (risk === 'medium') {
    if (bucket === '18-40') return [
      { label: 'Index', pct: 40, color: COLORS.Index },
      { label: 'Flexi', pct: 35, color: COLORS.Flexi },
      { label: 'Mid',   pct: 20, color: COLORS.Mid },
      { label: 'Small', pct: 5,  color: COLORS.Small },
    ]
    if (bucket === '40-60') return [
      { label: 'Index', pct: 50, color: COLORS.Index },
      { label: 'Flexi', pct: 35, color: COLORS.Flexi },
      { label: 'Mid',   pct: 15, color: COLORS.Mid },
      { label: 'Small', pct: 0,  color: COLORS.Small },
    ]
    return [
      { label: 'Index', pct: 60, color: COLORS.Index },
      { label: 'Flexi', pct: 35, color: COLORS.Flexi },
      { label: 'Mid',   pct: 5,  color: COLORS.Mid },
      { label: 'Small', pct: 0,  color: COLORS.Small },
    ]
  }

  // aggressive
  if (bucket === '18-40') return [
    { label: 'Index', pct: 30, color: COLORS.Index },
    { label: 'Flexi', pct: 30, color: COLORS.Flexi },
    { label: 'Mid',   pct: 25, color: COLORS.Mid },
    { label: 'Small', pct: 15, color: COLORS.Small },
  ]
  if (bucket === '40-60') return [
    { label: 'Index', pct: 40, color: COLORS.Index },
    { label: 'Flexi', pct: 35, color: COLORS.Flexi },
    { label: 'Mid',   pct: 20, color: COLORS.Mid },
    { label: 'Small', pct: 5,  color: COLORS.Small },
  ]
  return [
    { label: 'Index', pct: 50, color: COLORS.Index },
    { label: 'Flexi', pct: 35, color: COLORS.Flexi },
    { label: 'Mid',   pct: 15, color: COLORS.Mid },
    { label: 'Small', pct: 0,  color: COLORS.Small },
  ]
}
