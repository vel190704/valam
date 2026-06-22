import { getFinancialYearStart } from './financialYear.js';
import { calculateLiveSavingsRate } from './savingsRate.js';

// Must match frontend/app/networth/page.tsx LIABILITY_CATS key list exactly
const LIABILITY_CATS = ['debt', 'emi', 'other_liability'];

async function getCurrentValue(supabase, userId, category) {
  if (category === 'networth') {
    const [nwResult, investResult] = await Promise.all([
      supabase.from('networth_items').select('amount, category').eq('user_id', userId),
      supabase.from('investments').select('amount').eq('user_id', userId),
    ]);
    const nwItems           = nwResult.data ?? [];
    const portfolioTotal    = (investResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const totalAssets       = nwItems.filter(i => !LIABILITY_CATS.includes(i.category)).reduce((s, i) => s + Number(i.amount), 0);
    const totalLiabilities  = nwItems.filter(i =>  LIABILITY_CATS.includes(i.category)).reduce((s, i) => s + Number(i.amount), 0);
    // Matches dashboard/page.tsx formula exactly
    return portfolioTotal + totalAssets - totalLiabilities;
  }

  if (category === 'investment') {
    const { data } = await supabase.from('investments').select('amount').eq('user_id', userId);
    return (data ?? []).reduce((s, d) => s + Number(d.amount), 0);
  }

  if (category === 'income') {
    const fyStart = getFinancialYearStart();
    const { data } = await supabase
      .from('income_entries')
      .select('amount, date')
      .eq('user_id', userId)
      .gte('date', fyStart);
    return (data ?? []).reduce((s, d) => s + Number(d.amount), 0);
  }

  if (category === 'savings') {
    return await calculateLiveSavingsRate(supabase, userId);
  }

  return 0;
}

export async function checkAndUnlockMilestones(supabase, userId, category) {
  try {
    const currentValue = await getCurrentValue(supabase, userId, category);

    const { data: candidateMilestones } = await supabase
      .from('milestones')
      .select('id, threshold')
      .eq('category', category)
      .lte('threshold', currentValue);

    if (!candidateMilestones || candidateMilestones.length === 0) return [];

    const { data: alreadyUnlocked } = await supabase
      .from('user_milestones')
      .select('milestone_id')
      .eq('user_id', userId)
      .in('milestone_id', candidateMilestones.map(m => m.id));

    const unlockedIds   = new Set((alreadyUnlocked ?? []).map(u => u.milestone_id));
    const newlyUnlocked = candidateMilestones.filter(m => !unlockedIds.has(m.id));

    if (newlyUnlocked.length === 0) return [];

    const inserts = newlyUnlocked.map(m => ({ user_id: userId, milestone_id: m.id }));
    await supabase
      .from('user_milestones')
      .upsert(inserts, { onConflict: 'user_id, milestone_id', ignoreDuplicates: true });

    return newlyUnlocked.map(m => m.id);
  } catch (err) {
    console.error(`Milestone check failed for user ${userId}, category ${category}:`, err);
    return [];
  }
}
