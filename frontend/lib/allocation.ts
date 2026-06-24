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
  levelName: string
): EquityAllocationItem[] {

  const COLORS = {
    Index: '#5B8DB8',
    Flexi: '#27AE60',
    Mid: '#B8924A',
    Small: '#DBA512',
  }

  switch (levelName) {

    case 'Seed':
      return [
        { label: 'Index', pct: 70, color: COLORS.Index },
        { label: 'Flexi', pct: 30, color: COLORS.Flexi },
      ]

    case 'Explorer':
      return [
        { label: 'Index', pct: 50, color: COLORS.Index },
        { label: 'Flexi', pct: 30, color: COLORS.Flexi },
        { label: 'Mid', pct: 20, color: COLORS.Mid },
      ]

    case 'Builder':
      return [
        { label: 'Index', pct: 50, color: COLORS.Index },
        { label: 'Flexi', pct: 25, color: COLORS.Flexi },
        { label: 'Mid', pct: 25, color: COLORS.Mid },
      ]

    case 'Accelerator':
      return [
        { label: 'Index', pct: 40, color: COLORS.Index },
        { label: 'Flexi', pct: 25, color: COLORS.Flexi },
        { label: 'Mid', pct: 25, color: COLORS.Mid },
        { label: 'Small', pct: 10, color: COLORS.Small },
      ]

    case 'Achiever':
      return [
        { label: 'Index', pct: 35, color: COLORS.Index },
        { label: 'Flexi', pct: 25, color: COLORS.Flexi },
        { label: 'Mid', pct: 25, color: COLORS.Mid },
        { label: 'Small', pct: 15, color: COLORS.Small },
      ]

    default:
      return [
        { label: 'Index', pct: 50, color: COLORS.Index },
        { label: 'Flexi', pct: 25, color: COLORS.Flexi },
        { label: 'Mid', pct: 25, color: COLORS.Mid },
      ]
  }
}