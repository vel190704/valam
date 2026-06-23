import { getFinancialYearStart } from './financialYear.js';
import { calculateLiveSavingsRate } from './savingsRate.js';

// Must match frontend/app/networth/page.tsx LIABILITY_CATS key list exactly
const LIABILITY_CATS = ['debt', 'emi', 'other_liability'];

/**
 * Fetches fresh current values for all milestone categories in one pass.
 * Returns { networth, investment, income, savings } as numbers.
 */
async function getAllCurrentValues(supabase, userId) {
  const fyStart = getFinancialYearStart();

  const [nwResult, investResult, incomeResult, savingsRate] = await Promise.all([
    supabase.from('networth_items').select('amount, category').eq('user_id', userId),
    supabase.from('investments').select('amount').eq('user_id', userId),
    supabase.from('income_entries').select('amount, date').eq('user_id', userId).gte('date', fyStart),
    calculateLiveSavingsRate(supabase, userId),
  ]);

  const portfolioTotal   = (investResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalAssets      = (nwResult.data ?? []).filter(i => !LIABILITY_CATS.includes(i.category)).reduce((s, i) => s + Number(i.amount), 0);
  const totalLiabilities = (nwResult.data ?? []).filter(i =>  LIABILITY_CATS.includes(i.category)).reduce((s, i) => s + Number(i.amount), 0);

  return {
    networth:   portfolioTotal + totalAssets - totalLiabilities,
    investment: portfolioTotal,
    income:     (incomeResult.data ?? []).reduce((s, d) => s + Number(d.amount), 0),
    savings:    savingsRate,
  };
}

/**
 * Evaluates ALL milestones dynamically against the user's live financial data.
 * `unlocked` reflects whether the user currently meets the threshold — it is
 * re-computed on every call and is never permanently cached.
 *
 * `unlocked_at` is preserved from the user_milestones table (first time the
 * threshold was ever crossed) and is written if the milestone is newly met.
 *
 * @param {object}   supabase
 * @param {string}   userId
 * @param {object[]} allMilestones - Full milestones table rows (id, category, threshold, ...)
 * @returns {Promise<Map<number, { unlocked: boolean, unlocked_at: string|null }>>}
 */
export async function evaluateMilestones(supabase, userId, allMilestones) {
  try {
    const [currentValues, existingUnlocks] = await Promise.all([
      getAllCurrentValues(supabase, userId),
      supabase.from('user_milestones').select('milestone_id, unlocked_at').eq('user_id', userId),
    ]);

    const unlockedAtMap = new Map(
      (existingUnlocks.data ?? []).map(u => [u.milestone_id, u.unlocked_at])
    );

    const result = new Map();
    const newlyMet = [];

    for (const m of allMilestones) {
      const currentVal = currentValues[m.category] ?? 0;
      const isUnlocked = currentVal >= Number(m.threshold);

      const existingUnlockedAt = unlockedAtMap.get(m.id) ?? null;
      let unlockedAt = existingUnlockedAt;

      if (isUnlocked && !existingUnlockedAt) {
        // First time this milestone is met — record it
        const now = new Date().toISOString();
        newlyMet.push({ user_id: userId, milestone_id: m.id, unlocked_at: now });
        unlockedAt = now;
      }

      result.set(m.id, { unlocked: isUnlocked, unlocked_at: unlockedAt });
    }

    if (newlyMet.length > 0) {
      supabase
        .from('user_milestones')
        .upsert(newlyMet, { onConflict: 'user_id, milestone_id', ignoreDuplicates: true })
        .then(({ error }) => {
          if (error) console.error('[milestoneEngine] Failed to write unlocked_at:', error.message);
        });
    }

    return result;
  } catch (err) {
    console.error('[milestoneEngine] evaluateMilestones failed:', err);
    return new Map();
  }
}
