/**
 * AI coaching explanation layer for VALAM's roadmap feature.
 * Receives a task already decided by roadmapEngine.js and generates a
 * short, grounded coaching explanation via Groq. Never chooses the task —
 * only narrates the one it receives.
 *
 * Accepts `groqClient` as a parameter — do NOT call new Groq() here.
 * Follows the same shared-client-as-parameter pattern used throughout
 * this codebase (e.g. savingsRate.js passes `supabase` in, not top-level).
 */

/**
 * Safe hardcoded fallbacks per taskType.
 * Returned whenever LLM output fails validation or the Groq call itself errors.
 * One sentence each — short, encouraging, product-name-free.
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
  _default:
    'Keep taking small, consistent steps on your financial journey — every action you take today moves you closer to your next VALAM level.',
}

/**
 * Regex patterns checked against LLM output (case-insensitive where appropriate).
 * Guards against the model naming specific products despite explicit system prompt
 * instructions. findBannedTerm() returns the first matching pattern for logging.
 */
const BANNED_PATTERNS = [
  // Named Indian market indices
  /\bnifty\b/i,
  /\bsensex\b/i,
  /\bbank\s+nifty\b/i,
  /\bfinnifty\b/i,
  /\bnifty\s+next\s+50\b/i,
  /\bmidcap\s+150\b/i,
  // Specific cryptocurrencies (names and known tickers)
  /\bbitcoin\b/i,
  /\bethereum\b/i,
  /\blitecoin\b/i,
  /\bdogecoin\b/i,
  /\bsolana\b/i,
  /\bripple\b/i,
  /\bcrypto\b/i,
  /\bXRP\b/,   // case-sensitive — crypto ticker only appears in all-caps in financial text
  /\bBTC\b/,
  /\bETH\b/,
  /\bBNB\b/,
  /\bSOL\b/,
  // AMC name + "fund" — catches "HDFC fund", "SBI Mutual Fund", etc.
  /\bhdfc\s+(mutual\s+)?fund\b/i,
  /\bsbi\s+(mutual\s+)?fund\b/i,
  /\bicici\s+(mutual\s+)?fund\b/i,
  /\baxis\s+(mutual\s+)?fund\b/i,
  /\bmirae\s+(asset\s+)?(mutual\s+)?fund\b/i,
  /\bnippon\s+(india\s+)?(mutual\s+)?fund\b/i,
  /\bkotak\s+(mutual\s+)?fund\b/i,
  /\bdsp\s+(mutual\s+)?fund\b/i,
  /\baditya\s+birla\s+(sun\s+life\s+)?(mutual\s+)?fund\b/i,
  /\buti\s+(mutual\s+)?fund\b/i,
  /\bfranklin\s+(templeton\s+)?(mutual\s+)?fund\b/i,
  /\bparag\s+parikh\s+(mutual\s+)?fund\b/i,
  /\btata\s+(mutual\s+)?fund\b/i,
  /\binvesco\s+(mutual\s+)?fund\b/i,
  // Individual stock tickers (all-caps, word-bounded — these are not common English words)
  /\b(INFY|WIPRO|HDFCBANK|BAJFINANCE|ASIANPAINT|IRCTC|ZOMATO|PAYTM|RELIANCE|TCS)\b/,
  // Guaranteed/assured return promises — rulebook explicitly prohibits any guarantee language
  /\bguaranteed?\s+return[s]?\b/i,
  /\bguaranteed?\s+\d+(\.\d+)?%/i,
  /\bassured?\s+return[s]?\b/i,
  /\brisk.?free\s+return[s]?\b/i,
  /\bcertainly?\s+(to\s+)?(grow|return|profit)\b/i,
  // Fabricated return/yield figures — catches invented "X% annually/returns/yield/CAGR/p.a."
  // False-positive risk: current user turn only contains progressToNextLevel% (e.g. "67%")
  // followed by a period and "Task to focus on:" — never followed by return/yield words, so safe.
  /\b\d+(\.\d+)?%\s*(per\s+annum|p\.?a\.?|annual(ly)?|return[s]?|growth|yield[s]?|cagr)\b/i,
  /\b(return[s]?|yield[s]?|cagr)\s+of\s+\d+(\.\d+)?%\b/i,
]

/** Returns the first banned pattern that matches `text`, or null if clean. */
function findBannedTerm(text) {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) return pattern.toString()
  }
  return null
}

function getFallback(taskType) {
  return FALLBACKS[taskType] ?? FALLBACKS._default
}

/**
 * Generates a short coaching explanation for a roadmap task using Groq.
 * Never throws — always resolves with a usable string and a source tag.
 *
 * @param {import('groq-sdk').Groq} groqClient   - Already-initialized Groq client
 * @param {object}                  roadmapResult - Return value from determineNextTask()
 * @param {string}                 [userFirstName] - User's first name; '' or undefined → "you"
 * @returns {Promise<{ explanation: string, source: 'llm' | 'fallback' }>}
 */
export async function generateCoachingExplanation(groqClient, roadmapResult, userFirstName) {
  const { task, currentLevelName, nextLevelName, progressToNextLevel } = roadmapResult
  const firstName = (userFirstName ?? '').trim()
  const taskType  = task?.taskType ?? '_default'

  // ── System prompt ─────────────────────────────────────────────────────────
  const isLevel1 = roadmapResult.currentLevel === 1

  const allocationRule = task?.allowAllocationDiscussion
    ? 'When discussing allocation, you may ONLY recommend: (a) asset categories (equity, debt, gold, cash — never named funds or products), (b) allocation ranges or percentages by category, (c) diversification improvements across asset types, or (d) risk management actions such as reducing concentration in a single asset type. Nothing outside these four categories is permitted, even if it sounds like reasonable financial advice. NEVER name specific products, funds, or platforms.'
    : isLevel1
      ? 'Do NOT discuss asset allocation, portfolio diversification, or where to invest. Focus your encouragement on building basic investing habits, maintaining or starting a SIP, increasing the savings rate, and reaching first investment milestones — these are the right foundations at the Seed level.'
      : 'Do NOT discuss asset allocation, portfolio diversification, or where to invest at all. Focus ONLY on the habit or behaviour named in the task — consistency, frequency, or amount.'

  const nameRule = firstName
    ? `Address the user by their first name: ${firstName}.`
    : 'Address the user as "you" only — do not invent or guess a name.'

  const systemPrompt = `You are a financial coaching assistant for VALAM, a premium wealth progression and financial education platform. VALAM is NOT a brokerage, stock recommendation engine, mutual fund advisor, crypto advisor, or returns-maximising trading app. VALAM focuses on building financial habits, improving financial health, and creating long-term wealth through consistent behaviour — not on portfolio performance, investment returns, or picking financial products.

MOST IMPORTANT: Do NOT frame explanations around maximising wealth, growing a portfolio faster, or achieving higher returns. Frame every explanation around improving the user's weakest financial foundation. The task shown to you was chosen because it is the single biggest bottleneck holding back the user's financial progress — explain it as that, not as a path to more money.

RULES — follow ALL of these with no exceptions:
1. You will be given ONE specific task that has already been decided for the user. Your only job is to write 2–3 short, encouraging sentences explaining why this task matters for their financial progress. You do NOT choose or change the task — it is fixed.
2. NEVER mention or recommend any specific stock, mutual fund, ETF, cryptocurrency, bond, or named financial product. Do not name indices (e.g. Nifty 50, Sensex), fund houses (e.g. HDFC, SBI, ICICI), tickers, or cryptocurrencies (e.g. Bitcoin, Ethereum).
3. ${allocationRule}
4. NEVER invent numbers, percentages, or facts not present in the input you receive. Do not state or imply any specific rate of return, yield, or growth figure.
5. Keep your total response STRICTLY under 80 words. Use plain encouraging prose only — absolutely no bullet points, headers, or markdown formatting.
6. ${nameRule}`

  // ── User turn ─────────────────────────────────────────────────────────────
  const nextLabel    = nextLevelName ?? 'Legend (highest level)'
  const userContent  = `User's current VALAM level: ${currentLevelName}. Progress to next level (${nextLabel}): ${progressToNextLevel}%. Task to focus on: "${task?.title ?? 'Build your financial habits'}". Allocation discussion allowed: ${task?.allowAllocationDiscussion ?? false}.`

  // ── Groq call with full error handling ───────────────────────────────────
  try {
    const response = await groqClient.chat.completions.create({
      model:      'openai/gpt-oss-120b',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
    })

    const text = (response.choices?.[0]?.message?.content ?? '').trim()

    if (!text) {
      console.error('[aiCoach] Groq returned empty content — using fallback', { taskType })
      return { explanation: getFallback(taskType), source: 'fallback' }
    }

    // ── Output validation: banned-term guard ─────────────────────────────
    const banned = findBannedTerm(text)
    if (banned) {
      console.warn('[aiCoach] Banned term found in LLM output — using fallback', { banned, taskType, text })
      return { explanation: getFallback(taskType), source: 'fallback' }
    }

    return { explanation: text, source: 'llm' }
  } catch (err) {
    console.error('[aiCoach] Groq API error — using fallback', { message: err.message, taskType })
    return { explanation: getFallback(taskType), source: 'fallback' }
  }
}
