/**
 * Deterministic roadmap engine — rule-based only, no LLM calls.
 * Determines the top-3 highest-impact tasks for a VALAM user.
 *
 * "The Most Important Rule" (Dinesh's rulebook):
 *   If financialHealthScore <= 3, Task 1 MUST be a Financial Health
 *   task (emergency fund / debt / insurance) regardless of other scores.
 *   Fix the foundation before building wealth.
 */

const LEVEL_NAMES = {
  1: 'Seed', 2: 'Explorer', 3: 'Builder', 4: 'Accelerator',
  5: 'Achiever', 6: 'Wealth Creator', 7: 'Wealth Architect', 8: 'Legend',
}

const LEVEL_FLOORS = {
  1: 0, 2: 2.0, 3: 3.0, 4: 4.0, 5: 5.0, 6: 6.0, 7: 7.0, 8: 7.5,
}

const NEXT_LEVEL_FLOORS = {
  1: 2.0, 2: 3.0, 3: 4.0, 4: 5.0, 5: 6.0, 6: 7.0, 7: 7.5, 8: null,
}

/**
 * Standard positionScore factor tasks.
 * `detail` = deterministic short explanation for tasks ranked 2 and 3.
 */
const TASK_MAP = {
  netWorth: {
    taskType: 'build_net_worth',
    title:    'Grow your net worth',
    detail:   'Net worth is the clearest measure of wealth progress. Track your assets, pay down liabilities, and consistently widen the gap between them.',
  },
  wealthVelocity: {
    taskType: 'increase_investment_consistency',
    title:    'Increase monthly SIP contribution',
    detail:   'Consistent monthly investments grow your net worth faster each year — small increases now compound significantly over time.',
  },
  savings: {
    taskType: 'increase_savings_rate',
    title:    'Build your savings rate',
    detail:   'A stronger savings rate builds your investable capital base — the foundation every other financial goal depends on.',
  },
  income: {
    taskType: 'income_growth_awareness',
    title:    'Explore income growth',
    detail:   'Growing your income expands what\'s possible across savings, investments, and financial security simultaneously.',
  },
  experience: {
    taskType: 'complete_learning_module',
    title:    'Complete a learning module',
    detail:   'Every module you finish directly improves your Knowledge Score and builds the judgment needed for every financial decision ahead.',
  },
}

/**
 * Financial Health tasks — used when fhScore <= 3 (FH override).
 * Selected based on which sub-factor is the most urgent gap.
 */
const FH_TASKS = {
  emergency_fund: {
    taskType: 'build_emergency_fund',
    title:    'Build your emergency fund first',
    detail:   'Before investing more, set aside 3–6 months of expenses in a liquid savings account or FD. This is your financial safety net.',
  },
  high_interest_debt: {
    taskType: 'clear_high_interest_debt',
    title:    'Clear high-interest debt immediately',
    detail:   'Credit card and personal loan interest (18–36% p.a.) destroys wealth faster than any investment can build it. Pay these off before increasing investments.',
  },
  health_insurance: {
    taskType: 'get_health_insurance',
    title:    'Get health insurance coverage',
    detail:   'A single medical emergency without insurance can wipe out years of savings. A basic ₹5–10L health cover costs ₹5,000–15,000/year — the highest-ROI financial move you can make.',
  },
  generic_fh: {
    taskType: 'improve_financial_foundations',
    title:    'Strengthen your financial foundations',
    detail:   'Build an emergency fund, remove high-interest debt, and secure health insurance before scaling investments. A strong base makes everything else work better.',
  },
}

/**
 * Picks the most urgent FH task given the raw FH input values.
 * Priority order: no EF > significant debt > some debt > no insurance > generic.
 */
function selectFhTask(emergencyFund, highInterestDebt, healthInsurance) {
  if (emergencyFund === 'none')               return FH_TASKS.emergency_fund
  if (highInterestDebt === 'significant')     return FH_TASKS.high_interest_debt
  if (highInterestDebt === 'some')            return FH_TASKS.high_interest_debt
  if (healthInsurance === 'no')               return FH_TASKS.health_insurance
  return FH_TASKS.generic_fh
}

/**
 * Determines the top 3 highest-impact tasks and level-progress metrics.
 *
 * @param {object} profile        - The `profile` field from GET /profile.
 * @param {number} learningLevel  - 1–4 (derived as experienceScore / 2).
 * @param {object|null} factorScores - Optional override for factor values.
 *   Shape: { nw, wv, sav, inc, exp, fh?,
 *            emergencyFund?, highInterestDebt?, healthInsurance? }
 */
export function determineNextTask(profile, learningLevel, factorScores = null) {
  const currentLevel = profile?.valamLevel ?? 1
  const valamScore   = profile?.valamScore  ?? 0

  // ── Progress to next level ────────────────────────────────────────────────
  let progressToNextLevel
  let nextLevelName

  if (currentLevel === 8) {
    progressToNextLevel = 100
    nextLevelName       = null
  } else {
    const floor     = LEVEL_FLOORS[currentLevel]      ?? 0
    const nextFloor = NEXT_LEVEL_FLOORS[currentLevel] ?? floor + 1
    const raw       = ((valamScore - floor) / (nextFloor - floor)) * 100
    progressToNextLevel = Math.round(Math.min(100, Math.max(0, raw)))
    nextLevelName       = LEVEL_NAMES[currentLevel + 1] ?? null
  }

  const currentLevelName = LEVEL_NAMES[currentLevel] ?? ''

  // ── Extract factor scores ─────────────────────────────────────────────────
  let nw, wv, sav, inc, exp, fh
  let emergencyFund, highInterestDebt, healthInsurance

  if (factorScores) {
    nw  = factorScores.nw  ?? 2  // neutral: 0 networth → score 2
    wv  = factorScores.wv  ?? 0
    sav = factorScores.sav ?? 0
    inc = factorScores.inc ?? 0
    exp = factorScores.exp ?? 0
    fh  = factorScores.fh  ?? 4  // neutral default
    emergencyFund    = factorScores.emergencyFund    ?? null
    highInterestDebt = factorScores.highInterestDebt ?? null
    healthInsurance  = factorScores.healthInsurance  ?? null
  } else {
    const bd = profile?.breakdown ?? {}
    nw  = bd.netWorthScore      ?? 2
    wv  = bd.investmentsScore   ?? 0  // legacy column name
    sav = bd.savingsScore       ?? 0
    inc = bd.incomeScore        ?? 0
    exp = bd.experienceScore    ?? 0
    fh  = bd.financialHealthScore ?? 4
    emergencyFund    = null
    highInterestDebt = null
    healthInsurance  = null
  }

  // ── "THE MOST IMPORTANT RULE" — FH override ───────────────────────────────
  // When fhScore is low (<=3), fix financial foundations before any wealth task.
  const fhTask = fh <= 3 ? selectFhTask(emergencyFund, highInterestDebt, healthInsurance) : null

  // ── Defensive: brand-new or missing profile → safe default ───────────────
  if (nw === 2 && wv === 0 && sav === 0 && inc === 0 && exp === 0) {
    const primaryTask = fhTask ?? { ...TASK_MAP.savings, allowAllocationDiscussion: false }
    return {
      weakestFactor:    fhTask ? 'financialHealth' : 'savings',
      weightedGap:      0,
      task:             primaryTask,
      tasks: [
        { rank: 1, factor: fhTask ? 'financialHealth' : 'savings',
          ...(fhTask ?? TASK_MAP.savings), allowAllocationDiscussion: false },
        { rank: 2, factor: 'wealthVelocity', ...TASK_MAP.wealthVelocity, allowAllocationDiscussion: false },
        { rank: 3, factor: 'experience',     ...TASK_MAP.experience,     allowAllocationDiscussion: false },
      ],
      currentLevel,
      currentLevelName,
      nextLevelName,
      progressToNextLevel,
    }
  }

  // ── Weighted-gap calculation (PDF weights) ────────────────────────────────
  const factors = [
    { name: 'netWorth',      weight: 0.30, value: nw  },
    { name: 'wealthVelocity', weight: 0.30, value: wv  },
    { name: 'savings',        weight: 0.20, value: sav },
    { name: 'income',         weight: 0.10, value: inc },
    { name: 'experience',     weight: 0.10, value: exp },
  ].map(f => ({ ...f, gap: f.weight * (8 - f.value) }))
   .sort((a, b) => b.gap - a.gap)

  const weakest = factors[0]
  const factor  = weakest.name

  function getAllocationFlag(factorName) {
    return factorName === 'wealthVelocity' && learningLevel >= 3
  }

  // ── Build top-3 task array (with FH override for Task 1) ─────────────────
  const top3Standard = factors.slice(0, 3).map((f, i) => ({
    rank:                    i + 1,
    factor:                  f.name,
    ...TASK_MAP[f.name],
    allowAllocationDiscussion: getAllocationFlag(f.name),
  }))

  if (fhTask) {
    // Task 1 overridden by FH; tasks 2 and 3 remain standard positions 1 and 2
    const tasks = [
      { rank: 1, factor: 'financialHealth', ...fhTask, allowAllocationDiscussion: false },
      { ...top3Standard[0], rank: 2 },
      { ...top3Standard[1], rank: 3 },
    ]
    return {
      weakestFactor:    'financialHealth',
      weightedGap:      0.30 * (8 - fh),
      task:             tasks[0],
      tasks,
      currentLevel,
      currentLevelName,
      nextLevelName,
      progressToNextLevel,
    }
  }

  return {
    weakestFactor:    factor,
    weightedGap:      weakest.gap,
    task:             top3Standard[0],
    tasks:            top3Standard,
    currentLevel,
    currentLevelName,
    nextLevelName,
    progressToNextLevel,
  }
}
