export type SavingsKey     = '<5' | '5-15' | '15-25' | '25-40' | '40+'
export type InvestmentsKey = '<10k' | '10k-1L' | '1L-5L' | '5L-25L' | '25L+'
export type IncomeKey      = '<3L' | '3L-8L' | '8L-15L' | '15L-30L' | '30L+'
export type ExperienceKey  = 'beginner' | 'learning' | 'intermediate' | 'advanced'

export interface VALAMInput {
  age: number
  income: IncomeKey
  savingsRate: SavingsKey
  investments: InvestmentsKey
  experience: ExperienceKey
}

export interface VALAMResult {
  valamScore: number
  valamLevel: number
  valamLevelName: string
  breakdown: {
    savingsScore: number
    investmentsScore: number
    incomeScore: number
    experienceScore: number
    ageScore: number
    savingsWeighted: number
    investmentsWeighted: number
    incomeWeighted: number
    experienceWeighted: number
    ageWeighted: number
  }
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Seed', 2: 'Explorer', 3: 'Builder', 4: 'Accelerator',
  5: 'Achiever', 6: 'Wealth Creator', 7: 'Wealth Architect', 8: 'Legend'
}

function getLevel(score: number): number {
  if (score < 2.0) return 1
  if (score < 3.0) return 2
  if (score < 4.0) return 3
  if (score < 5.0) return 4
  if (score < 6.0) return 5
  if (score < 7.0) return 6
  if (score < 8.0) return 7
  return 8
}

export function calculateVALAM(input: VALAMInput): VALAMResult {
  let savingsScore: number
  switch (input.savingsRate) {
    case '<5':    savingsScore = 1; break
    case '5-15':  savingsScore = 2; break
    case '15-25': savingsScore = 3; break
    case '25-40': savingsScore = 4; break
    case '40+':   savingsScore = 5; break
    default: throw new Error('Invalid savingsRate key: ' + input.savingsRate)
  }

  let investmentsScore: number
  switch (input.investments) {
    case '<10k':   investmentsScore = 1; break
    case '10k-1L': investmentsScore = 2; break
    case '1L-5L':  investmentsScore = 3; break
    case '5L-25L': investmentsScore = 4; break
    case '25L+':   investmentsScore = 5; break
    default: throw new Error('Invalid investments key: ' + input.investments)
  }

  let incomeScore: number
  switch (input.income) {
    case '<3L':     incomeScore = 1; break
    case '3L-8L':   incomeScore = 2; break
    case '8L-15L':  incomeScore = 3; break
    case '15L-30L': incomeScore = 4; break
    case '30L+':    incomeScore = 5; break
    default: throw new Error('Invalid income key: ' + input.income)
  }

  let experienceScore: number
  switch (input.experience) {
    case 'beginner':     experienceScore = 1; break
    case 'learning':     experienceScore = 2; break
    case 'intermediate': experienceScore = 3; break
    case 'advanced':     experienceScore = 4; break
    default: throw new Error('Invalid experience key: ' + input.experience)
  }

  let ageScore: number
  const age = input.age
  if (age >= 18 && age <= 24)      ageScore = 5
  else if (age >= 25 && age <= 34) ageScore = 4
  else if (age >= 35 && age <= 44) ageScore = 3
  else if (age >= 45 && age <= 59) ageScore = 2
  else                             ageScore = 1

  const savingsWeighted     = savingsScore     * 0.40
  const investmentsWeighted = investmentsScore * 0.25
  const incomeWeighted      = incomeScore      * 0.15
  const experienceWeighted  = experienceScore  * 0.10
  const ageWeighted         = ageScore         * 0.10

  const raw = savingsWeighted + investmentsWeighted + incomeWeighted +
              experienceWeighted + ageWeighted
  const valamScore = Math.round(raw * 100) / 100
  const valamLevel = getLevel(valamScore)

  return {
    valamScore,
    valamLevel,
    valamLevelName: LEVEL_NAMES[valamLevel],
    breakdown: {
      savingsScore, investmentsScore, incomeScore,
      experienceScore, ageScore,
      savingsWeighted, investmentsWeighted, incomeWeighted,
      experienceWeighted, ageWeighted,
    }
  }
}
