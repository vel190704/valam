/**
 * Deterministic roadmap engine — rule-based only, no LLM calls.
 * Determines the highest-impact next task for a VALAM user based on
 * the four positionScore factors from valam.ts (ageScore is excluded;
 * it only contributes to potentialScore, not positionScore).
 *
 * Accepts the `profile` sub-object already returned by GET /profile —
 * no Supabase access needed here; all inputs are pre-fetched.
 */

/** Mirror of valam.ts LEVEL_NAMES */
const LEVEL_NAMES = {
  1: 'Seed', 2: 'Explorer', 3: 'Builder', 4: 'Accelerator',
  5: 'Achiever', 6: 'Wealth Creator', 7: 'Wealth Architect', 8: 'Legend',
}

/**
 * Lower score boundary for each level, derived from valam.ts getLevel().
 * Level 1 has no formal floor (minimum possible positionScore is 0).
 */
const LEVEL_FLOORS = {
  1: 0, 2: 2.0, 3: 3.0, 4: 4.0, 5: 5.0, 6: 6.0, 7: 7.0, 8: 7.5,
}

/** Upper boundary = next level's floor. Level 8 has no next level. */
const NEXT_LEVEL_FLOORS = {
  1: 2.0, 2: 3.0, 3: 4.0, 4: 5.0, 5: 6.0, 6: 7.0, 7: 7.5, 8: null,
}

/**
 * Exhaustive task lookup — one fixed entry per positionScore factor.
 * breakdown.investmentsScore IS the wealthVelocityScore from valam.ts
 * (same number, different name at the DB/API boundary).
 */
const TASK_MAP = {
  wealthVelocity: {
    taskType: 'increase_investment_consistency',
    title:    'Increase monthly SIP contribution',
  },
  savings: {
    taskType: 'increase_savings_rate',
    title:    'Build your savings rate',
  },
  income: {
    taskType: 'income_growth_awareness',
    title:    'Explore income growth',
  },
  experience: {
    taskType: 'complete_learning_module',
    title:    'Complete a learning module',
  },
}

/**
 * Determines the highest-impact next task and level-progress metrics.
 *
 * @param {object} profile        - The `profile` field from GET /profile.
 *   Expected shape: { valamScore, valamLevel, valamLevelName, breakdown:
 *   { investmentsScore, savingsScore, incomeScore, experienceScore, ageScore } }
 * @param {number} learningLevel  - 1–4 (derived as experienceScore / 2,
 *   since beginner=2, learning=4, intermediate=6, advanced=8).
 *
 * @returns {{
 *   weakestFactor:       string,
 *   weightedGap:         number,
 *   task: { taskType: string, title: string, allowAllocationDiscussion: boolean },
 *   currentLevel:        number,
 *   currentLevelName:    string,
 *   nextLevelName:       string|null,
 *   progressToNextLevel: number
 * }}
 */
export function determineNextTask(profile, learningLevel) {
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

  // ── Extract the four positionScore factor values ──────────────────────────
  const bd  = profile?.breakdown ?? {}
  const wv  = bd.investmentsScore ?? 0  // wealthVelocityScore at the DB boundary
  const sav = bd.savingsScore     ?? 0
  const inc = bd.incomeScore      ?? 0
  const exp = bd.experienceScore  ?? 0

  // ── Defensive: brand-new or missing profile → safe default ───────────────
  if (wv === 0 && sav === 0 && inc === 0 && exp === 0) {
    return {
      weakestFactor:    'savings',
      weightedGap:      0,
      task: { ...TASK_MAP.savings, allowAllocationDiscussion: false },
      currentLevel,
      currentLevelName,
      nextLevelName,
      progressToNextLevel,
    }
  }

  // ── Weighted-gap calculation (positionScore factors only) ─────────────────
  // weightedGap = weight * (8 - value)
  // Measures how much positionScore would improve if this factor reached max.
  // Sorting descending → highest-impact improvement opportunity first.
  const factors = [
    { name: 'wealthVelocity', weight: 0.50, value: wv  },
    { name: 'savings',        weight: 0.25, value: sav },
    { name: 'income',         weight: 0.15, value: inc },
    { name: 'experience',     weight: 0.10, value: exp },
  ].map(f => ({ ...f, gap: f.weight * (8 - f.value) }))
   .sort((a, b) => b.gap - a.gap)

  const weakest = factors[0]
  const factor  = weakest.name

  // ── Gating rule: allowAllocationDiscussion ────────────────────────────────
  // Only meaningful when wealthVelocity is the selected factor.
  // Beginners (level 1) are never shown allocation guidance per VALAM's design.
  let allowAllocationDiscussion = false
  if (factor === 'wealthVelocity') {
    allowAllocationDiscussion = learningLevel >= 3
  }

  return {
    weakestFactor:    factor,
    weightedGap:      weakest.gap,
    task: { ...TASK_MAP[factor], allowAllocationDiscussion },
    currentLevel,
    currentLevelName,
    nextLevelName,
    progressToNextLevel,
  }
}
