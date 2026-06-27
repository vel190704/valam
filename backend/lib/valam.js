
export const LEVEL_NAMES= {
  1: 'Seed', 2: 'Explorer', 3: 'Builder',
  4: 'Accelerator', 5: 'Achiever', 6: 'Wealth Creator',
  7: 'Wealth Architect', 8: 'Legend',
}

export const LEVEL_NAMES_ARR = [
  'Seed', 'Explorer', 'Builder', 'Accelerator',
  'Achiever', 'Wealth Creator', 'Wealth Architect', 'Legend',
]

export const LEVEL_MESSAGES = {
  1: "You're at the beginning of your financial journey.",
  2: "You're developing financial awareness and healthy habits.",
  3: "You're laying the foundations for long-term wealth.",
  4: "Your habits and investments are beginning to compound.",
  5: "You've built meaningful financial momentum.",
  6: "You're actively creating substantial wealth.",
  7: "You've built a strong financial system capable of long-term growth.",
  8: "You've reached an elite level of wealth creation and financial discipline.",
}

// PDF level boundaries: 1.00-1.99=L1 … 7.00-7.49=L7, 7.50-8.00=L8
function scoreToLevel(score) {
  if (score >= 7.50) return 8
  return Math.floor(score)
}

// ── Net Worth score (PDF brackets) ──────────────────────────────────────────
export function scoreNetWorth(nw){
  if (nw < 0)            return 1
  if (nw < 50_000)       return 2
  if (nw < 2_00_000)     return 3
  if (nw < 10_00_000)    return 4
  if (nw < 25_00_000)    return 5
  if (nw < 50_00_000)    return 6
  if (nw < 1_00_00_000)  return 7
  return 8
}

// ── Wealth Velocity score: NetWorth ÷ Age (PDF brackets) ────────────────────
export function InvestmentVelocity(inv, age) {
  const v = age > 0 ? inv / age : 0
  if (v < 5_000)      return 1
  if (v < 25_000)     return 2
  if (v < 50_000)     return 3
  if (v < 1_00_000)   return 4
  if (v < 2_00_000)   return 5
  if (v < 5_00_000)   return 6
  if (v < 10_00_000)  return 7
  return 8
}

const INVESTMENT_MIDPOINTS= {
  '<10k':   5_000,
  '10k-50k': 30_000,
  '50k-1L':  75_000,
  '1L-2L': 1_50_000,
  '2L-5L':   3_50_000,
  '5L-10L':   7_50_000   ,
  '10L-20L':  15_00_000       ,
  '20L-35L':  27_50_000        ,
  '35L-50L': 42_50_000,
  '50L+': 60_00_000
}

// Legacy WV brackets (investment midpoint ÷ age) — used in fallback only

function scoreSavings(k){
  const m= {
    '<2': 1, '2-5': 2, '5-10': 3, '10-15': 4,
    '15-20': 5, '20-30': 6, '30-40': 7, '40+': 8,
  }
  return m[k]
}

function scoreIncome(k) {
  const m = {
    '<3L': 1, '3L-5L': 2, '5L-8L': 3, '8L-12L': 4,
    '12L-20L': 5, '20L-30L': 6, '30L-50L': 7, '50L+': 8,
  }
  return m[k]
}

function scoreExperience(k) {
  const m = {
    beginner: 2, learning: 4, intermediate: 6, advanced: 8,
  }
  return m[k]
}

/*function scoreAge(age: number): number {
  if (age <= 24) return 8
  if (age <= 29) return 7
  if (age <= 34) return 6
  if (age <= 39) return 5
  if (age <= 44) return 4
  if (age <= 49) return 3
  if (age <= 59) return 2
  return 1
}

export function scoreFinancialHealth(
  ef:        EmergencyFundKey    | null | undefined,
  debt:      HighInterestDebtKey | null | undefined,
  insurance: HealthInsuranceKey  | null | undefined,
): number {
  if (!ef && !debt && !insurance) return 4
  let score = 4
  if (ef === '3-6months' || ef === '6months+') score += 2
  if (ef === 'none') score -= 1
  if (insurance === 'yes') score += 1
  if (debt === 'significant') score -= 2
  if (debt === 'some') score -= 1
  return Math.max(1, Math.min(8, score))
}*/

export function calculateVALAM(input) {
  const savingsScore         = scoreSavings(input.savingsRate)
  const incomeScore          = scoreIncome(input.income)
  const experienceScore      = scoreExperience(input.experience)
 /* const ageScore             = scoreAge(input.age)
  const financialHealthScore = scoreFinancialHealth(
    input.emergencyFund    ?? null,
    input.highInterestDebt ?? null,
    input.healthInsurance  ?? null,
  )*/

  let netWorthScore=null
 // let wealthVelocityScore: number
  let wealthVelocity
  let investmentVelocityScore
  let rawPosition = 0
//console.log('networth',input.netWorth)
  if (input.netWorth !== undefined && input.netWorth !== null) {
    //console.log('executing logged in logic now')
    // PDF formula: real net worth data available
    netWorthScore       = scoreNetWorth(input.netWorth)
    const totalInvestments = input.totalinvestments ?? 0
     investmentVelocityScore = InvestmentVelocity(
    totalInvestments,
   input.age
)
//console.log('nw',netWorthScore)
//console.log('inv vel scor',investmentVelocityScore)
//console.log('savingsscore',savingsScore)
//console.log('inc score',incomeScore)
//console.log('exp score',experienceScore)
    rawPosition =
    0.28 * netWorthScore +
    0.32 * investmentVelocityScore +
    0.20 * savingsScore +
    0.10 * incomeScore +
    0.10 * experienceScore
  } else {
    //console.log('executing fallback logic now')
    // Fallback: no net worth data yet — use investment bracket midpoint for WV
    const investmentAmt = INVESTMENT_MIDPOINTS[input.investments] ?? 5_000
   // const rawVelocity   = input.age > 0 ? investmentAmt / input.age : 0
    investmentVelocityScore = InvestmentVelocity(investmentAmt,input.age)
  //  console.log('inv score',investmentVelocityScore)
  //  console.log('savng',savingsScore)
  //  console.log('inc sc',incomeScore)
  //  console.log('exp sco',experienceScore)
    rawPosition =
    0.35 * investmentVelocityScore +
    0.30 * savingsScore +
    0.20 * incomeScore +
    0.15 * experienceScore

   // console.log(rawPosition)
    //netWorthScore       = 2  // neutral: treat as] ₹0 net worth (0–50k bracket)
    //wealthVelocity      = Math.round(rawVelocity)
  }

  // PDF position formula:
  //   0.30×NetWorth + 0.30×WealthVelocity + 0.20×Savings + 0.10×Income + 0.10×Knowled

  const positionScore  = Math.round(rawPosition  * 100) / 100
  const positionLevel  = scoreToLevel(positionScore)
  //const potentialLevel = scoreToLevel(potentialScore)
  let potentialLev = 0
    if(input.age<=30){
    potentialLev = 8
  }
  else if(input.age>30 && input.age<=45){
    if(positionLevel<=5){
    potentialLev = positionLevel + 3 
  }
else{
  potentialLev = 8
}}
else if(input.age>45 && input.age<=60){
    if(positionLevel<=6){
    potentialLev = positionLevel + 2
  }
else{
  potentialLev = 8
}}
else if(input.age>60){
    if(positionLevel<=7){
   potentialLev = positionLevel + 1 
  }
else{
 potentialLev = 8
}}

  //const potentialScore = Math.round(rawPotential * 100) / 100
  const potentialLevel = potentialLev

  return {
    positionScore,
    positionLevel,
    positionLevelName:  LEVEL_NAMES[positionLevel],
    //potentialScore,
    potentialLevel,
    potentialLevelName: LEVEL_NAMES[potentialLevel],
    breakdown: {
      netWorthScore,
      investmentVelocityScore,
      savingsScore,
      incomeScore,
      experienceScore,
      //ageScore,
      //wealthVelocity,
      //financialHealthScore,
    },
  }
}
