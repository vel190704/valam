/**
 * VALAM score calculation — JS mirror of frontend/lib/valam.ts.
 * Keep in sync with the TypeScript original.
 *
 * Position formula:
 *   0.28×NetWorthScore + 0.32×InvestmentVelocity + 0.20×Savings
 *   + 0.10×Income + 0.10×Knowledge
 *
 * Potential formula (unchanged):
 *   0.45×Savings + 0.35×Age + 0.10×Income + 0.10×Knowledge
 *
 * Financial Health: computed but NOT part of position formula.
 * Used only by roadmapEngine for task prioritisation override.
 */

export const LEVEL_NAMES = {
  1: 'Seed', 2: 'Explorer', 3: 'Builder', 4: 'Accelerator',
  5: 'Achiever', 6: 'Wealth Creator', 7: 'Wealth Architect', 8: 'Legend',
}

// PDF level boundaries: 1.00-1.99=L1 … 7.00-7.49=L7, 7.50-8.00=L8
function scoreToLevel(score) {
  if (score >= 7.50) return 8
  return Math.floor(score)
}

// ── Net Worth score (PDF brackets) ──────────────────────────────────────────
export function scoreNetWorth(nw) {
  if (nw < 0)             return 1
  if (nw < 50_000)        return 2
  if (nw < 2_00_000)      return 3
  if (nw < 10_00_000)     return 4
  if (nw < 25_00_000)     return 5
  if (nw < 50_00_000)     return 6
  if (nw < 1_00_00_000)   return 7
  return 8
}

// ── Wealth Velocity score: NetWorth ÷ Age (PDF brackets) ────────────────────
export function scoreWealthVelocityFromNetWorth(nw, age) {
  const v = age > 0 ? nw / age : 0
  if (v < 5_000)     return 1
  if (v < 25_000)    return 2
  if (v < 50_000)    return 3
  if (v < 1_00_000)  return 4
  if (v < 2_00_000)  return 5
  if (v < 5_00_000)  return 6
  if (v < 10_00_000) return 7
  return 8
}

const INVESTMENT_MIDPOINTS = {
  '<10k':   5_000,
  '10k-1L': 55_000,
  '1L-5L':  3_00_000,
  '5L-25L': 15_00_000,
  '25L+':   30_00_000,
}

// Legacy WV brackets (investment midpoint ÷ age) — used in fallback only
function scoreWealthVelocity(v) {
  if (v < 1000)    return 1
  if (v < 5000)    return 2
  if (v < 15000)   return 3
  if (v < 50000)   return 4
  if (v < 100000)  return 5
  if (v < 300000)  return 6
  if (v < 1000000) return 7
  return 8
}

function scoreSavings(k) {
  const m = { '<2': 1, '2-5': 2, '5-10': 3, '10-15': 4, '15-20': 5, '20-30': 6, '30-40': 7, '40+': 8 }
  return m[k] ?? 1
}

function scoreIncome(k) {
  const m = { '<3L': 1, '3L-5L': 2, '5L-8L': 3, '8L-12L': 4, '12L-20L': 5, '20L-30L': 6, '30L-50L': 7, '50L+': 8 }
  return m[k] ?? 1
}

function scoreExperience(k) {
  const m = { beginner: 2, learning: 4, intermediate: 6, advanced: 8 }
  return m[k] ?? 2
}

function scoreAge(age) {
  if (age <= 24) return 8
  if (age <= 29) return 7
  if (age <= 34) return 6
  if (age <= 39) return 5
  if (age <= 44) return 4
  if (age <= 49) return 3
  if (age <= 59) return 2
  return 1
}

/**
 * Financial Health score (1–8).
 * Kept for roadmapEngine FH override rule — NOT used in position formula.
 */
export function scoreFinancialHealth(ef, debt, insurance) {
  if (!ef && !debt && !insurance) return 4
  let score = 4
  if (ef === '3-6months' || ef === '6months+') score += 2
  if (ef === 'none') score -= 1
  if (insurance === 'yes') score += 1
  if (debt === 'significant') score -= 2
  if (debt === 'some') score -= 1
  return Math.max(1, Math.min(8, score))
}

/**
 * @param {{
 *   age: number, income: string, savingsRate: string,
 *   investments: string, experience: string,
 *   netWorth?: number|null,
 *   emergencyFund?: string|null,
 *   highInterestDebt?: string|null,
 *   healthInsurance?: string|null
 * }} input
 */
export function calculateVALAM(input) {
  const savingsScore         = scoreSavings(input.savingsRate)
  const incomeScore          = scoreIncome(input.income)
  const experienceScore      = scoreExperience(input.experience)
  const ageScore             = scoreAge(input.age)
  const financialHealthScore = scoreFinancialHealth(
    input.emergencyFund    ?? null,
    input.highInterestDebt ?? null,
    input.healthInsurance  ?? null,
  )

  let netWorthScore, wealthVelocityScore, wealthVelocity

  if (input.netWorth !== undefined && input.netWorth !== null) {
    // PDF formula: real net worth data available
    netWorthScore       = scoreNetWorth(input.netWorth)
    wealthVelocityScore = scoreWealthVelocityFromNetWorth(input.netWorth, input.age)
    wealthVelocity      = input.age > 0 ? Math.round(input.netWorth / input.age) : 0
  } else {
    // Fallback: no net worth data yet — use investment bracket midpoint for WV
    const investmentAmt = INVESTMENT_MIDPOINTS[input.investments] ?? 5_000
    const rawVelocity   = input.age > 0 ? investmentAmt / input.age : 0
    wealthVelocityScore = scoreWealthVelocity(rawVelocity)
    netWorthScore       = 2  // neutral: treat as ₹0 net worth (0–50k bracket)
    wealthVelocity      = Math.round(rawVelocity)
  }

  // Position formula:
  //   0.28×NetWorthScore + 0.32×InvestmentVelocity + 0.20×Savings + 0.10×Income + 0.10×Knowledge
  const rawPosition =
    0.28 * netWorthScore +
    0.32 * wealthVelocityScore +
    0.20 * savingsScore +
    0.10 * incomeScore +
    0.10 * experienceScore

  const rawPotential =
    0.45 * savingsScore +
    0.35 * ageScore +
    0.10 * incomeScore +
    0.10 * experienceScore

  const positionScore  = Math.round(rawPosition  * 100) / 100
  const potentialScore = Math.round(rawPotential * 100) / 100
  const positionLevel  = scoreToLevel(positionScore)
  const potentialLevel = scoreToLevel(potentialScore)

  return {
    positionScore,
    positionLevel,
    positionLevelName:  LEVEL_NAMES[positionLevel],
    potentialScore,
    potentialLevel,
    potentialLevelName: LEVEL_NAMES[potentialLevel],
    breakdown: {
      netWorthScore,
      wealthVelocityScore,
      savingsScore,
      incomeScore,
      experienceScore,
      ageScore,
      wealthVelocity,
      financialHealthScore,
    },
  }
}
