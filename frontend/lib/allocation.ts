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

// Maps actual investment type keys → suggested allocation label
export const TYPE_TO_SUGGESTED: Record<string, string> = {
  mf:    'Mutual Funds',
  stock: 'Stocks',
  fd:    'FDs',
  bond:  'Bonds',
}