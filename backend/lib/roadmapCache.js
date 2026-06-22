/**
 * Supabase-backed cache for AI coaching explanations.
 * The GET /roadmap route stores the last generated explanation alongside
 * the valamScore that was current at generation time. On the next request,
 * if the score is unchanged the cached text is returned and the Groq call
 * is skipped entirely.
 *
 * Follows the shared-client-as-parameter pattern used in savingsRate.js —
 * no top-level createClient() here.
 */

/**
 * Reads the cached roadmap explanation for a user.
 * Returns null when no cache entry exists or on any read error.
 *
 * @param {object} supabase - Supabase admin client
 * @param {string} userId
 * @returns {Promise<{
 *   explanation:   string,
 *   taskType:      string,
 *   scoreSnapshot: number,
 *   generatedAt:   string
 * } | null>}
 */
export async function getCachedRoadmap(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select([
      'cached_roadmap_explanation',
      'cached_roadmap_task_type',
      'cached_roadmap_score_snapshot',
      'cached_roadmap_generated_at',
    ].join(', '))
    .eq('user_id', userId)
    .single();

  if (error || !data?.cached_roadmap_explanation) return null;

  return {
    explanation:   data.cached_roadmap_explanation,
    taskType:      data.cached_roadmap_task_type,
    scoreSnapshot: Number(data.cached_roadmap_score_snapshot),
    generatedAt:   data.cached_roadmap_generated_at,
  };
}

/**
 * Writes (or overwrites) the cached roadmap entry for a user.
 * Errors are logged but never thrown — a cache write failure must not
 * break the response that was already successfully generated.
 *
 * @param {object} supabase       - Supabase admin client
 * @param {string} userId
 * @param {string} explanation    - Validated LLM or fallback explanation text
 * @param {string} taskType       - roadmapResult.task.taskType
 * @param {number} scoreSnapshot  - profile.valamScore at the time of generation
 * @returns {Promise<void>}
 */
export async function setCachedRoadmap(supabase, userId, explanation, taskType, scoreSnapshot) {
  const { error } = await supabase
    .from('profiles')
    .update({
      cached_roadmap_explanation:    explanation,
      cached_roadmap_task_type:      taskType,
      cached_roadmap_score_snapshot: scoreSnapshot,
      cached_roadmap_generated_at:   new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[roadmapCache] Failed to write cache:', error.message);
  }
}
