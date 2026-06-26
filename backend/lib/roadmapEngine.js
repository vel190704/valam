/**
 * VALAM Roadmap Engine v2 — follows the 7-priority Task Generation Framework
 * from the VALAM product document exactly.
 *
 * Priority order (highest unmet always becomes Task 1):
 *   P1  Emergency Fund
 *   P2  Active Investing (first investment + SIP)
 *   P3  Savings Rate (threshold-specific)
 *   P4  Financial Knowledge (module-specific by experience level)
 *   P5  Portfolio Diversification (only if totalInvestments >= 50000)
 *   P6  Net Worth Milestones
 *   P7  Level Progression
 *
 * The engine is purely deterministic — no LLM calls here.
 * aiCoach.js narrates the task this engine selects.
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

// ── Net worth milestone thresholds ────────────────────────────────────────────
const NW_MILESTONES = [50000, 100000, 500000, 1000000, 2500000, 5000000, 10000000]

function fmtINR(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(0)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(0)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

// ── Task builders ─────────────────────────────────────────────────────────────

function taskEmergencyFund(monthlyIncome, emergencyMonthsCovered, emergencyFundTarget) {
  const covered = emergencyMonthsCovered > 0
    ? `You currently have ${emergencyMonthsCovered} months covered.`
    : 'You have no emergency fund yet.'
  const targetStr = emergencyFundTarget > 0 ? fmtINR(emergencyFundTarget) : fmtINR(monthlyIncome * 6)
  return {
    taskType: 'build_emergency_fund',
    title:    'Build your emergency fund first',
    detail:   `${covered} Build up to ${targetStr} (6 months of income) in a liquid savings account before scaling investments.`,
    allowAllocationDiscussion: false,
  }
}

function taskFirstInvestment() {
  return {
    taskType: 'start_first_sip',
    title:    'Make your first investment',
    detail:   'You have not made any investments yet. Starting a ₹500/month SIP in an index fund is the single highest-impact action you can take right now.',
    allowAllocationDiscussion: false,
  }
}

function taskStartSIP() {
  return {
    taskType: 'start_monthly_sip',
    title:    'Start a monthly SIP',
    detail:   'No SIP is active in the last 60 days. A recurring monthly investment — even a small one — builds wealth velocity that a lump sum cannot replicate.',
    allowAllocationDiscussion: false,
  }
}

function taskSavingsRate(currentRate) {
  const r = Math.round(currentRate ?? 0)
  let target, detail
  if (r < 10) {
    target = 10
    detail = `Your savings rate is currently ${r}%. Reaching 10% creates the minimum investment runway needed to build wealth at any income level.`
  } else if (r < 20) {
    target = 20
    detail = `Your savings rate is ${r}%. Pushing to 20% doubles your investable surplus and significantly accelerates your VALAM score.`
  } else if (r < 30) {
    target = 30
    detail = `At ${r}% savings rate you are doing well. Reaching 30% puts you in the top tier of wealth builders at your income level.`
  } else {
    target = 40
    detail = `Exceptional savings discipline at ${r}%. Reaching 40% will substantially compress the time to your next VALAM level.`
  }
  return {
    taskType: 'increase_savings_rate',
    title:    `Increase savings rate to ${target}%`,
    detail,
    allowAllocationDiscussion: false,
  }
}

function taskKnowledge(experienceKey) {
  const map = {
    beginner:     { module: 'Index Fund Module',       detail: 'Understanding index funds is the essential first step — they are the safest, lowest-cost way to begin building your investment portfolio.' },
    learning:     { module: 'Flexi Cap Module',        detail: 'Flexi cap funds let you benefit from growth across market caps without manually rebalancing. Completing this module upgrades your allocation awareness.' },
    intermediate: { module: 'Debt Fund Module',        detail: 'Debt funds are your stability layer. Learning how to use them correctly is what separates a balanced portfolio from a purely equity-heavy one.' },
    advanced:     { module: 'Asset Allocation Module', detail: 'At your knowledge level, refining your overall allocation strategy is the highest-leverage learning task remaining.' },
  }
  const entry = map[experienceKey] ?? map.beginner
  return {
    taskType: 'complete_learning_module',
    title:    `Complete ${entry.module}`,
    detail:   entry.detail,
    allowAllocationDiscussion: false,
  }
}

function taskDiversification(equityPct, goldPct, debtPct) {
  if (equityPct > 90) {
    return {
      taskType: 'add_non_equity_diversification',
      title:    'Add non-equity diversification',
      detail:   `Your portfolio is ${equityPct}% equity — well above the recommended level. Direct the next investment towards debt or gold to reduce concentration risk.`,
      allowAllocationDiscussion: true,
    }
  }
  if (goldPct === 0) {
    return {
      taskType: 'build_gold_allocation',
      title:    'Build initial gold allocation',
      detail:   'You have zero gold exposure. A 10% gold allocation improves portfolio stability during equity market downturns.',
      allowAllocationDiscussion: true,
    }
  }
  if (debtPct === 0) {
    return {
      taskType: 'build_debt_allocation',
      title:    'Build initial debt allocation',
      detail:   'You have no debt allocation. Adding even 10% to FD or debt funds provides a stability buffer for your equity portfolio.',
      allowAllocationDiscussion: true,
    }
  }
  return {
    taskType: 'reduce_portfolio_concentration',
    title:    'Reduce portfolio concentration',
    detail:   'Your largest asset class holds more than 80% of your portfolio. Rebalancing towards a more diversified mix reduces your risk exposure significantly.',
    allowAllocationDiscussion: true,
  }
}

function taskNetWorth(currentNW) {
  const nw = currentNW ?? 0
  const next = NW_MILESTONES.find(m => m > nw) ?? NW_MILESTONES[NW_MILESTONES.length - 1]
  return {
    taskType: 'grow_net_worth',
    title:    `Reach ${fmtINR(next)} Net Worth`,
    detail:   `Your current net worth is ${fmtINR(nw)}. Reaching ${fmtINR(next)} is your next concrete milestone — track it by keeping assets and liabilities up to date.`,
    allowAllocationDiscussion: false,
  }
}

function taskLevelProgression(currentLevel, currentLevelName, nextLevelName, valamScore) {
  const nextFloor = NEXT_LEVEL_FLOORS[currentLevel]
  const gap = nextFloor ? Math.max(0, nextFloor - valamScore).toFixed(2) : '0'
  return {
    taskType: 'reach_next_level',
    title:    `Reach ${nextLevelName ?? 'Legend'} level`,
    detail:   `You are ${gap} points away from ${nextLevelName ?? 'Legend'}. Keep improving your savings rate and investments to close the gap.`,
    allowAllocationDiscussion: false,
  }
}

function taskClearDebt() {
  return {
    taskType: 'clear_high_interest_debt',
    title:    'Clear high-interest debt immediately',
    detail:   'Credit card and personal loan interest (18–36% p.a.) compounds against you every month — paying it off is the highest guaranteed return available right now.',
    allowAllocationDiscussion: false,
  }
}

function taskGetInsurance() {
  return {
    taskType: 'get_health_insurance',
    title:    'Get health insurance coverage',
    detail:   'A single medical emergency without insurance can erase years of savings. A basic ₹5–10L health cover costs ₹5,000–15,000/year — the highest-ROI financial move you can make.',
    allowAllocationDiscussion: false,
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Determines the top 3 highest-priority tasks for this user.
 *
 * @param {object} profile        - profile from GET /profile (valamLevel, valamScore, breakdown, etc.)
 * @param {number} learningLevel  - 1–4 (experienceScore / 2)
 * @param {object|null} factorScores - live factor overrides from server.js
 * @param {object} [liveContext]  - live data: { totalInvestments, monthlySavingsRate,
 *                                   monthlyIncome, hasRecentSIP, netWorth,
 *                                   equityPct, goldPct, debtPct, experienceKey }
 */
export function determineNextTask(profile, learningLevel, factorScores = null, liveContext = {}) {
  const currentLevel     = profile?.valamLevel ?? 1
  const valamScore       = profile?.valamScore  ?? 0
  const currentLevelName = LEVEL_NAMES[currentLevel] ?? ''
  const nextLevelName    = currentLevel < 8 ? (LEVEL_NAMES[currentLevel + 1] ?? null) : null

  // ── Progress to next level ────────────────────────────────────────────────
  let progressToNextLevel
  if (currentLevel === 8) {
    progressToNextLevel = 100
  } else {
    const floor     = LEVEL_FLOORS[currentLevel]      ?? 0
    const nextFloor = NEXT_LEVEL_FLOORS[currentLevel] ?? floor + 1
    const raw       = ((valamScore - floor) / (nextFloor - floor)) * 100
    progressToNextLevel = Math.round(Math.min(100, Math.max(0, raw)))
  }

  // ── Extract FH data ───────────────────────────────────────────────────────
  const emergencyFund    = factorScores?.emergencyFund    ?? null
  const highInterestDebt = factorScores?.highInterestDebt ?? null
  const healthInsurance  = factorScores?.healthInsurance  ?? null
  const fh               = factorScores?.fh               ?? (profile?.breakdown?.financialHealthScore ?? 4)

  // ── Live context ──────────────────────────────────────────────────────────
  const totalInvestments       = liveContext.totalInvestments       ?? 0
  const monthlySavingsRate     = liveContext.monthlySavingsRate     ?? null
  const monthlyIncome          = liveContext.monthlyIncome          ?? 0
  const hasRecentSIP           = liveContext.hasRecentSIP           ?? false
  const hasActiveSIP           = liveContext.hasActiveSIP           ?? false
  const emergencyMonthsCovered = liveContext.emergencyMonthsCovered ?? 0
  const emergencyFundTarget    = liveContext.emergencyFundTarget    ?? 0
  const completedTopics        = liveContext.completedTopics        ?? 0
  const userGoal               = liveContext.userGoal               ?? 'wealth'
  const netWorth               = liveContext.netWorth               ?? 0
  const equityPct              = liveContext.equityPct              ?? 100
  const goldPct                = liveContext.goldPct                ?? 0
  const debtPct                = liveContext.debtPct                ?? 0
  const experienceKey          = liveContext.experienceKey          ?? (profile?.experience ?? 'beginner')

  // ── Build ordered task list by priority ───────────────────────────────────
  const candidates = []

  // P1: Financial health — debt, emergency fund, insurance (all can appear simultaneously)
  if (highInterestDebt === 'significant' || highInterestDebt === 'some') {
    candidates.push({ priority: 1, factor: 'financialHealth', ...taskClearDebt() })
  }
  if (emergencyFund === 'none' || emergencyMonthsCovered < 3) {
    candidates.push({ priority: 1, factor: 'financialHealth',
      ...taskEmergencyFund(monthlyIncome, emergencyMonthsCovered, emergencyFundTarget) })
  }
  if (healthInsurance === 'no') {
    candidates.push({ priority: 1, factor: 'financialHealth', ...taskGetInsurance() })
  }

  // P2: Active investing
  if (totalInvestments === 0) {
    candidates.push({ priority: 2, factor: 'wealthVelocity', ...taskFirstInvestment() })
  } else if (!hasActiveSIP) {
    candidates.push({ priority: 2, factor: 'wealthVelocity', ...taskStartSIP() })
  }

  // P3: Savings rate
  if (monthlySavingsRate !== null && monthlySavingsRate < 40) {
    candidates.push({ priority: 3, factor: 'savings', ...taskSavingsRate(monthlySavingsRate) })
  }

  // P4: Knowledge
  candidates.push({ priority: 4, factor: 'experience', ...taskKnowledge(experienceKey) })

  // P5: Diversification (only if portfolio >= ₹50K)
  if (totalInvestments >= 50000) {
    const needsDiversification =
      equityPct > 90 || goldPct === 0 || debtPct === 0 ||
      Math.max(equityPct, goldPct, debtPct) > 80
    if (needsDiversification) {
      candidates.push({ priority: 5, factor: 'netWorth', ...taskDiversification(equityPct, goldPct, debtPct) })
    }
  }

  // P6: Net worth milestone
  candidates.push({ priority: 6, factor: 'netWorth', ...taskNetWorth(netWorth) })

  // P7: Level progression (only if not at max)
  if (currentLevel < 8) {
    candidates.push({ priority: 7, factor: 'experience', ...taskLevelProgression(currentLevel, currentLevelName, nextLevelName, valamScore) })
  }

  // ── Select top 3 by priority ──────────────────────────────────────────────
  candidates.sort((a, b) => a.priority - b.priority)

  // Remove duplicates by taskType
  const seen = new Set()
  const unique = candidates.filter(t => {
    if (seen.has(t.taskType)) return false
    seen.add(t.taskType)
    return true
  })

  const top3 = unique.slice(0, 3).map((t, i) => ({ ...t, rank: i + 1 }))

  // Ensure we always have 3 tasks (pad with level progression if needed)
  while (top3.length < 3) {
    top3.push({
      rank: top3.length + 1,
      priority: 7,
      factor: 'experience',
      ...taskLevelProgression(currentLevel, currentLevelName, nextLevelName, valamScore),
    })
  }

  const primaryTask = top3[0]

  return {
    weakestFactor:      primaryTask.factor,
    weightedGap:        0,
    task:               primaryTask,
    tasks:              top3,
    currentLevel,
    currentLevelName,
    nextLevelName,
    progressToNextLevel,
  }
}
