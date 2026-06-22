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
