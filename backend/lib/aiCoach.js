/**
 * AI coaching layer for VALAM — generates 5 personalised tasks via Groq
 * using the full VALAM context object built in GET /roadmap.
 *
 * Accepts `groqClient` as a parameter — do NOT call new Groq() here.
 */

const FALLBACKS = {
  increase_investment_consistency:
    'Consistently investing each month is the single most powerful wealth-building habit — keep at it and your VALAM score will reflect your progress soon.',
  increase_savings_rate:
    'Building a higher savings rate now creates the foundation for every financial goal ahead — small, steady increases compound into meaningful results over time.',
  income_growth_awareness:
    'Growing your income opens up more room to save and invest — explore ways to increase your earning potential and watch your financial position strengthen.',
  complete_learning_module:
    'Every learning module you complete strengthens your financial knowledge and directly improves your VALAM Experience Score — keep learning and growing.',
  build_emergency_fund:
    'An emergency fund is the bedrock of financial security — without it, any unexpected expense risks derailing your entire wealth plan.',
  clear_high_interest_debt:
    'High-interest debt compounds against you every month — clearing it is the highest guaranteed return available to you right now.',
  get_health_insurance:
    'Health insurance protects every rupee you have saved — a single medical event without cover can erase years of wealth-building progress.',
  build_net_worth:
    'Net worth is the clearest measure of wealth progress — track your assets, reduce liabilities, and widen the gap between them consistently.',
  _default:
    'Keep taking small, consistent steps on your financial journey — every action you take today moves you closer to your next VALAM level.',
}

const BANNED_PATTERNS = [
  /\bnifty\b/i, /\bsensex\b/i, /\bbank\s+nifty\b/i,
  /\bbitcoin\b/i, /\bethereum\b/i, /\bcrypto\b/i,
  /\bXRP\b/, /\bBTC\b/, /\bETH\b/, /\bBNB\b/, /\bSOL\b/,
  /\bhdfc\s+(mutual\s+)?fund\b/i, /\bsbi\s+(mutual\s+)?fund\b/i,
  /\bicici\s+(mutual\s+)?fund\b/i, /\baxis\s+(mutual\s+)?fund\b/i,
  /\bmirae\s+(asset\s+)?(mutual\s+)?fund\b/i,
  /\bnippon\s+(india\s+)?(mutual\s+)?fund\b/i,
  /\bparag\s+parikh\s+(mutual\s+)?fund\b/i,
  /\b(INFY|WIPRO|HDFCBANK|BAJFINANCE|RELIANCE|TCS)\b/,
  /\bguaranteed?\s+return[s]?\b/i, /\bassured?\s+return[s]?\b/i,
  /\brisk.?free\s+return[s]?\b/i,
  /\b\d+(\.\d+)?%\s*(per\s+annum|p\.?a\.?|annual(ly)?|return[s]?|growth|yield[s]?|cagr)\b/i,
  /\b(return[s]?|yield[s]?|cagr)\s+of\s+\d+(\.\d+)?%\b/i,
]

function findBannedTerm(text) {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) return pattern.toString()
  }
  return null
}

const FALLBACK_PADDING = [
  { title: 'Explore income growth opportunities',    key: 'income_growth_awareness' },
  { title: 'Complete a financial learning module',   key: 'complete_learning_module' },
  { title: 'Grow your net worth this month',         key: 'build_net_worth' },
  { title: 'Review and reduce monthly liabilities',  key: '_default' },
  { title: 'Strengthen your financial foundations',  key: '_default' },
]

function buildFallbackTasks(deterministicTasks) {
  const usedTitles = new Set()
  const base = deterministicTasks.slice(0, 5).map((t, i) => {
    usedTitles.add(t.title)
    return {
      title:       t.title,
      explanation: t.detail ?? FALLBACKS[t.taskType] ?? FALLBACKS._default,
      priority:    i + 1,
    }
  })
  let padIdx = 0
  while (base.length < 5) {
    // Find the next padding entry whose title isn't already used
    while (padIdx < FALLBACK_PADDING.length && usedTitles.has(FALLBACK_PADDING[padIdx].title)) {
      padIdx++
    }
    const pad = FALLBACK_PADDING[padIdx] ?? FALLBACK_PADDING[FALLBACK_PADDING.length - 1]
    usedTitles.add(pad.title)
    base.push({
      title:       pad.title,
      explanation: FALLBACKS[pad.key] ?? FALLBACKS._default,
      priority:    base.length + 1,
    })
    padIdx++
  }
  return base
}

const SYSTEM_PROMPT = `You are VALAM AI — a personalised wealth coach for Indian retail investors.
Your job is to generate 5 specific, actionable tasks based on the user's REAL financial data.

RULES (non-negotiable):
- Never recommend specific stocks, mutual fund names, or securities
- Never mention guaranteed returns or specific percentage return figures like "12% annually"
- Frame advice around fixing the weakest foundation first — not maximising wealth
- Use real numbers from the user's data (₹ amounts, savings rate %, level names, topic counts)
- Tasks must be specific and measurable (e.g. "Increase your monthly SIP from ₹3,000 to ₹5,000" not "increase SIP")
- Keep each task explanation to 2 sentences maximum
- Never frame around maximizing returns — frame around building a strong financial foundation
- Respect Indian financial context: use SIP, FD, PPF, NPS, ELSS as categories only — never name specific products`

/**
 * Generates 5 personalised coaching tasks using the full VALAM context.
 * Falls back to 3 deterministic tasks (padded to 5) on any Groq failure.
 *
 * @param {import('groq-sdk').Groq} groqClient
 * @param {object} valamContext - Full context object from GET /roadmap
 * @param {object[]} deterministicTasks - 3 tasks from roadmapEngine.determineNextTask()
 * @returns {Promise<{ tasks: object[], source: 'llm' | 'fallback' }>}
 */
export async function generateCoachingTasks(groqClient, valamContext, deterministicTasks) {
  const fallback = buildFallbackTasks(deterministicTasks)

  const { userProfile: up, financialProfile: fp, portfolioProfile: pp, scores } = valamContext

  const userPrompt = `Current User Financial Context:
${JSON.stringify(valamContext, null, 2)}

Suggested asset allocation for ${up.currentLevel}:
${JSON.stringify(valamContext.suggestedAllocation)}

Deterministic priority tasks identified by the system:
${deterministicTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}

Generate exactly 5 personalised tasks for this user.
${up.nextLevel
  ? `Focus tasks on what this user needs to do to advance from ${up.currentLevel} → ${up.nextLevel}.`
  : `This user is at the maximum level — focus on maintaining and growing their wealth.`}
Use their REAL numbers: net worth ₹${fp.netWorth.toLocaleString('en-IN')}, monthly income ${fp.monthlyIncomeFormatted}, savings rate ${fp.savingsRate}%, total invested ₹${pp.totalInvested.toLocaleString('en-IN')}, level ${up.currentLevel}.

Respond ONLY with a valid JSON array — no markdown fences, no preamble, no trailing text:
[
  {
    "title": "Short action title (max 8 words)",
    "explanation": "2 sentences using real numbers from their data.",
    "priority": 1
  }
]`

  // ── DIAGNOSTIC LOGS (temporary) ──────────────────────────────────────────
  const MODEL = 'llama-3.3-70b-versatile'
  console.log('\n[aiCoach:DIAG] ── MODEL ──────────────────────────────')
  console.log('Model:', MODEL)
  console.log('System prompt length:', SYSTEM_PROMPT.length, 'chars')
  console.log('User prompt length:', userPrompt.length, 'chars')
  console.log('\n[aiCoach:DIAG] ── SYSTEM PROMPT ─────────────────────')
  console.log(SYSTEM_PROMPT)
  console.log('\n[aiCoach:DIAG] ── USER PROMPT ────────────────────────')
  console.log(userPrompt)
  console.log('\n[aiCoach:DIAG] ── END PROMPTS ────────────────────────\n')

  try {
    const response = await groqClient.chat.completions.create({
      model:      MODEL,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt    },
      ],
    })

    const text = (response.choices?.[0]?.message?.content ?? '').trim()

    // ── DIAGNOSTIC: raw Groq response ────────────────────────────────────
    console.log('\n[aiCoach:DIAG] ── RAW GROQ RESPONSE ─────────────────')
    console.log('HTTP status (from error or ok):', response.choices ? 'ok' : 'no choices')
    console.log('Raw text:', JSON.stringify(text))
    console.log('[aiCoach:DIAG] ── END RAW RESPONSE ──────────────────\n')

    if (!text) {
      console.error('[aiCoach] Groq returned empty content')
      return { tasks: fallback, source: 'fallback' }
    }

    // Parse JSON — handle model wrapping in markdown fences
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        try { parsed = JSON.parse(match[0]) }
        catch { return { tasks: fallback, source: 'fallback' } }
      } else {
        console.error('[aiCoach] Could not extract JSON from response')
        return { tasks: fallback, source: 'fallback' }
      }
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { tasks: fallback, source: 'fallback' }
    }

    // Validate each task — fall back to deterministic entry on any violation
    const tasks = parsed.slice(0, 5).map((t, i) => {
      const title       = String(t.title ?? '').trim()
      const explanation = String(t.explanation ?? '').trim()
      if (!title || !explanation) return fallback[i]
      const banned = findBannedTerm(`${title} ${explanation}`)
      if (banned) {
        console.warn(`[aiCoach] Banned term in task ${i + 1}:`, banned)
        return fallback[i]
      }
      return { title, explanation, priority: i + 1 }
    })

    // Pad to 5 if Groq returned fewer
    while (tasks.length < 5) tasks.push(fallback[tasks.length])

    return { tasks, source: 'llm' }
  } catch (err) {
    console.error('\n[aiCoach:DIAG] ── GROQ ERROR ──────────────────────')
    console.error('message:', err.message)
    console.error('status:', err.status)
    console.error('code:', err.code)
    console.error('full error:', JSON.stringify(err, null, 2))
    console.error('[aiCoach:DIAG] ── END ERROR ──────────────────────\n')
    return { tasks: fallback, source: 'fallback' }
  }
}
