/**
 * Supabase-backed cache for AI coaching tasks.
 *
 * Cache key is a composite string combining positionScore, totalInvested,
 * and savingsRate — stored in cached_roadmap_task_type. This ensures any
 * meaningful financial change (adding investments, income change, score
 * bracket shift) forces a fresh Groq call.
 *
 * cached_roadmap_score_snapshot retains the raw positionScore as a number
 * for display/debug purposes; the authoritative hit check uses the composite
 * key string in cached_roadmap_task_type.
 */

function buildCompositeKey(positionScore, totalInvested, savingsRate) {
  // Use integer representations to avoid floating-point string drift between runs
  // positionScore: 2 decimal places → ×100 (e.g. 3.485 → 348 or 349, stable)
  // savingsRate: 1 decimal place → ×10 (e.g. 0.8 → 8, stable)
  return `${Math.round(positionScore * 100)}|${Math.round(totalInvested)}|${Math.round(savingsRate * 10)}`
}

/**
 * Reads the cached roadmap tasks for a user.
 * Returns null when no valid cache entry exists.
 *
 * @param {object} supabase
 * @param {string} userId
 * @param {number} positionScore   - Fresh-computed positionScore
 * @param {number} totalInvested   - All-time total invested amount
 * @param {number} savingsRate     - Live FY savings rate (%)
 * @returns {Promise<{ tasks: object[], generatedAt: string } | null>}
 */
export async function getCachedRoadmap(supabase, userId, positionScore, totalInvested, savingsRate) {
  const { data, error } = await supabase
    .from('profiles')
    .select([
      'cached_roadmap_explanation',
      'cached_roadmap_task_type',
      'cached_roadmap_score_snapshot',
      'cached_roadmap_generated_at',
    ].join(', '))
    .eq('user_id', userId)
    .single()

  if (error || !data?.cached_roadmap_explanation) return null

  const storedKey = data.cached_roadmap_task_type ?? ''
  const freshKey  = buildCompositeKey(positionScore, totalInvested, savingsRate)

  if (storedKey !== freshKey) return null

  // Validate stored data is the new JSON-array format
  let tasks
  try {
    const parsed = JSON.parse(data.cached_roadmap_explanation)
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0]?.explanation) return null
    tasks = parsed
  } catch {
    return null
  }

  return { tasks, generatedAt: data.cached_roadmap_generated_at }
}

/**
 * Writes (or overwrites) the cached roadmap entry for a user.
 * Never throws — a cache write failure must not break the response.
 *
 * @param {object}   supabase
 * @param {string}   userId
 * @param {number}   positionScore
 * @param {number}   totalInvested
 * @param {number}   savingsRate
 * @param {object[]} tasks          - The 5 AI-generated tasks to cache
 */
export async function setCachedRoadmap(supabase, userId, positionScore, totalInvested, savingsRate, tasks) {
  const compositeKey = buildCompositeKey(positionScore, totalInvested, savingsRate)
  const { error } = await supabase
    .from('profiles')
    .update({
      cached_roadmap_explanation:    JSON.stringify(tasks),
      cached_roadmap_task_type:      compositeKey,
      cached_roadmap_score_snapshot: positionScore,
      cached_roadmap_generated_at:   new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('[roadmapCache] Failed to write cache:', error.message)
  }
}
