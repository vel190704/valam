export type RiskLevel = 'low' | 'medium' | 'high'

export interface AllocationItem {
  label: string
  pct: number
  color: string
}

export function getSuggestedAllocation(
  age: number,
  risk: RiskLevel
): AllocationItem[] {

  const EQUITY = '#5B8DB8'
  const DEBT = '#27AE60'
  const COMMODITY = '#B8924A'

  // Conservative
  if (risk === 'low') {
    if (age < 40) {
      return [
        { label: 'Equity', pct: 70, color: EQUITY },
        { label: 'Debt', pct: 20, color: DEBT },
        { label: 'Commodity', pct: 10, color: COMMODITY },
      ]
    }

    if (age < 60) {
      return [
        { label: 'Equity', pct: 60, color: EQUITY },
        { label: 'Debt', pct: 30, color: DEBT },
        { label: 'Commodity', pct: 10, color: COMMODITY },
      ]
    }

    return [
      { label: 'Equity', pct: 40, color: EQUITY },
      { label: 'Debt', pct: 50, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
  }

  // Moderate
  if (risk === 'medium') {
    if (age < 40) {
      return [
        { label: 'Equity', pct: 80, color: EQUITY },
        { label: 'Debt', pct: 10, color: DEBT },
        { label: 'Commodity', pct: 10, color: COMMODITY },
      ]
    }

    if (age < 60) {
      return [
        { label: 'Equity', pct: 70, color: EQUITY },
        { label: 'Debt', pct: 20, color: DEBT },
        { label: 'Commodity', pct: 10, color: COMMODITY },
      ]
    }

    return [
      { label: 'Equity', pct: 50, color: EQUITY },
      { label: 'Debt', pct: 40, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
  }

  // Aggressive
  if (age < 40) {
    return [
      { label: 'Equity', pct: 90, color: EQUITY },
      { label: 'Debt', pct: 0, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
  }

  if (age < 60) {
    return [
      { label: 'Equity', pct: 80, color: EQUITY },
      { label: 'Debt', pct: 10, color: DEBT },
      { label: 'Commodity', pct: 10, color: COMMODITY },
    ]
  }

  return [
    { label: 'Equity', pct: 60, color: EQUITY },
    { label: 'Debt', pct: 30, color: DEBT },
    { label: 'Commodity', pct: 10, color: COMMODITY },
  ]
}

export const TYPE_TO_CATEGORY: Record<
  string,
  'Equity' | 'Debt' | 'Commodity'
> = {
  stock: 'Equity',
  mf: 'Equity',
  etf: 'Equity',
  crypto: 'Equity', 

  fd: 'Debt',
  bond: 'Debt',

  commodity: 'Commodity',
}

export interface EquityAllocationItem {
  label: string
  pct: number
  color: string
}

export const MF_TO_EQUITY_CATEGORY: Record<string, string> = {
  nifty50: 'Index',

  flexicap: 'Flexi',
  largecap: 'Flexi',

  midcap: 'Mid',

  smallcap: 'Small',
}

export function getSuggestedEquityAllocation(
  age: number,
  risk: RiskLevel
): EquityAllocationItem[] {

  const COLORS = {
    Index: '#5B8DB8',
    Flexi: '#27AE60',
    Mid: '#B8924A',
    Small: '#DBA512',
  }

  const bucket =
  age <= 40 ? '18-40'
  : age <= 60 ? '40-60'
  : '60+'

  if (risk === 'low') {

  if (bucket === '18-40')
    return [
      { label: 'Index', pct: 50, color: COLORS.Index },
      { label: 'Flexi', pct: 40, color: COLORS.Flexi },
      { label: 'Mid', pct: 10, color: COLORS.Mid },
      { label: 'Small', pct: 0, color: COLORS.Small },
    ]

  if (bucket === '40-60')
    return [
      { label: 'Index', pct: 60, color: COLORS.Index },
      { label: 'Flexi', pct: 35, color: COLORS.Flexi },
      { label: 'Mid', pct: 5, color: COLORS.Mid },
      { label: 'Small', pct: 0, color: COLORS.Small },
    ]

  return [
    { label: 'Index', pct: 70, color: COLORS.Index },
    { label: 'Flexi', pct: 30, color: COLORS.Flexi },
    { label: 'Mid', pct: 0, color: COLORS.Mid },
    { label: 'Small', pct: 0, color: COLORS.Small },
  ]
}

if (risk === 'medium') {

  if (bucket === '18-40')
    return [
      { label: 'Index', pct: 40, color: COLORS.Index },
      { label: 'Flexi', pct: 35, color: COLORS.Flexi },
      { label: 'Mid', pct: 20, color: COLORS.Mid },
      { label: 'Small', pct: 5, color: COLORS.Small },
    ]

  if (bucket === '40-60')
    return [
      { label: 'Index', pct: 50, color: COLORS.Index },
      { label: 'Flexi', pct: 35, color: COLORS.Flexi },
      { label: 'Mid', pct: 15, color: COLORS.Mid },
      { label: 'Small', pct: 0, color: COLORS.Small },
    ]

  return [
    { label: 'Index', pct: 60, color: COLORS.Index },
    { label: 'Flexi', pct: 35, color: COLORS.Flexi },
      { label: 'Mid', pct: 5, color: COLORS.Mid },
      { label: 'Small', pct: 0, color: COLORS.Small },
  ]
}

if (bucket === '18-40')
  return [
    { label: 'Index', pct: 30, color: COLORS.Index },
    { label: 'Flexi', pct: 30, color: COLORS.Flexi },
    { label: 'Mid', pct: 25, color: COLORS.Mid },
    { label: 'Small', pct: 15, color: COLORS.Small },
  ]

if (bucket === '40-60')
  return [
    { label: 'Index', pct: 40, color: COLORS.Index },
    { label: 'Flexi', pct: 35, color: COLORS.Flexi },
    { label: 'Mid', pct: 20, color: COLORS.Mid },
    { label: 'Small', pct: 5, color: COLORS.Small },
  ]

return [
  { label: 'Index', pct: 50, color: COLORS.Index },
  { label: 'Flexi', pct: 35, color: COLORS.Flexi },
  { label: 'Mid', pct: 15, color: COLORS.Mid },
  { label: 'Small', pct: 0, color: COLORS.Small },
]


}