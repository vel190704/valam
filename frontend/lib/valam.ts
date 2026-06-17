export type IncomeKey =
  | '<3L' | '3L-5L' | '5L-8L' | '8L-12L'
  | '12L-20L' | '20L-30L' | '30L-50L' | '50L+'

export type SavingsKey =
  | '<2' | '2-5' | '5-10' | '10-15'
  | '15-20' | '20-30' | '30-40' | '40+'

export type InvestmentsKey =
  | '<10k' | '10k-1L' | '1L-5L' | '5L-25L' | '25L+'

export type ExperienceKey =
  | 'beginner' | 'learning' | 'intermediate' | 'advanced'

export interface VALAMInput {
  age:         number
  income:      IncomeKey
  savingsRate: SavingsKey
  investments: InvestmentsKey
  experience:  ExperienceKey
}

export interface VALAMResult {
  positionScore:      number
  positionLevel:      number
  positionLevelName:  string
  potentialScore:     number
  potentialLevel:     number
  potentialLevelName: string
  breakdown: {
    wealthVelocityScore: number
    savingsScore:        number
    incomeScore:         number
    experienceScore:     number
    ageScore:            number
    wealthVelocity:      number
  }
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Seed', 2: 'Explorer', 3: 'Builder',
  4: 'Accelerator', 5: 'Achiever', 6: 'Wealth Creator',
  7: 'Wealth Architect', 8: 'Legend',
}

export const LEVEL_NAMES_ARR = [
  'Seed', 'Explorer', 'Builder', 'Accelerator',
  'Achiever', 'Wealth Creator', 'Wealth Architect', 'Legend',
]

export const LEVEL_MESSAGES: Record<number, string> = {
  1: "You're at the beginning of your financial journey.",
  2: "You're developing financial awareness and healthy habits.",
  3: "You're laying the foundations for long-term wealth.",
  4: "Your habits and investments are beginning to compound.",
  5: "You've built meaningful financial momentum.",
  6: "You're actively creating substantial wealth.",
  7: "You've built a strong financial system capable of long-term growth.",
  8: "You've reached an elite level of wealth creation and financial discipline.",
}

function getLevel(score: number): number {
  if (score < 2.0) return 1
  if (score < 3.0) return 2
  if (score < 4.0) return 3
  if (score < 5.0) return 4
  if (score < 6.0) return 5
  if (score < 7.0) return 6
  if (score < 7.5) return 7
  return 8
}

const INVESTMENT_MIDPOINTS: Record<InvestmentsKey, number> = {
  '<10k':   5000,
  '10k-1L': 55000,
  '1L-5L':  300000,
  '5L-25L': 1500000,
  '25L+':   3000000,
}

function scoreWealthVelocity(v: number): number {
  if (v < 1000)    return 1
  if (v < 5000)    return 2
  if (v < 15000)   return 3
  if (v < 50000)   return 4
  if (v < 100000)  return 5
  if (v < 300000)  return 6
  if (v < 1000000) return 7
  return 8
}

function scoreSavings(k: SavingsKey): number {
  const m: Record<SavingsKey, number> = {
    '<2': 1, '2-5': 2, '5-10': 3, '10-15': 4,
    '15-20': 5, '20-30': 6, '30-40': 7, '40+': 8,
  }
  return m[k]
}

function scoreIncome(k: IncomeKey): number {
  const m: Record<IncomeKey, number> = {
    '<3L': 1, '3L-5L': 2, '5L-8L': 3, '8L-12L': 4,
    '12L-20L': 5, '20L-30L': 6, '30L-50L': 7, '50L+': 8,
  }
  return m[k]
}

function scoreExperience(k: ExperienceKey): number {
  const m: Record<ExperienceKey, number> = {
    beginner: 2, learning: 4, intermediate: 6, advanced: 8,
  }
  return m[k]
}

function scoreAge(age: number): number {
  if (age <= 24) return 8
  if (age <= 29) return 7
  if (age <= 34) return 6
  if (age <= 39) return 5
  if (age <= 44) return 4
  if (age <= 49) return 3
  if (age <= 59) return 2
  return 1
}

export function calculateVALAM(input: VALAMInput): VALAMResult {
  const investmentAmt       = INVESTMENT_MIDPOINTS[input.investments]
  const wealthVelocity      = investmentAmt / input.age
  const wealthVelocityScore = scoreWealthVelocity(wealthVelocity)
  const savingsScore        = scoreSavings(input.savingsRate)
  const incomeScore         = scoreIncome(input.income)
  const experienceScore     = scoreExperience(input.experience)
  const ageScore            = scoreAge(input.age)

  const rawPosition =
    0.50 * wealthVelocityScore +
    0.25 * savingsScore +
    0.15 * incomeScore +
    0.10 * experienceScore

  const rawPotential =
    0.45 * savingsScore +
    0.35 * ageScore +
    0.10 * incomeScore +
    0.10 * experienceScore

  const positionScore  = Math.round(rawPosition  * 100) / 100
  const potentialScore = Math.round(rawPotential * 100) / 100
  const positionLevel  = getLevel(positionScore)
  const potentialLevel = getLevel(potentialScore)

  return {
    positionScore,
    positionLevel,
    positionLevelName:  LEVEL_NAMES[positionLevel],
    potentialScore,
    potentialLevel,
    potentialLevelName: LEVEL_NAMES[potentialLevel],
    breakdown: {
      wealthVelocityScore,
      savingsScore,
      incomeScore,
      experienceScore,
      ageScore,
      wealthVelocity: Math.round(wealthVelocity),
    },
  }
}
