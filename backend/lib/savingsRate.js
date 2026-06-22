import { getFinancialYearStart } from './financialYear.js';

/**
 * Approximation: savings rate = (total invested this FY / total income this FY) × 100
 *
 * NOTE: This is NOT the true savings rate formula (income − expenses) ÷ income.
 * It is an approximation using only real data we have (investments + income entries)
 * because no expense tracker exists yet. Revisit once expense tracking is built.
 */
export async function calculateLiveSavingsRate(supabase, userId) {
  const fyStart = getFinancialYearStart();

  const [investResult, incomeResult] = await Promise.all([
    supabase
      .from('investments')
      .select('amount, date')
      .eq('user_id', userId)
      .gte('date', fyStart),
    supabase
      .from('income_entries')
      .select('amount, date')
      .eq('user_id', userId)
      .gte('date', fyStart),
  ]);

  const totalInvested = (investResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalIncome   = (incomeResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  if (totalIncome === 0) return 0;
  return Math.min(100, Math.round((totalInvested / totalIncome) * 100));
}

// Month-wise savings rate: (invested this calendar month / income this calendar month) * 100
// DISPLAY ONLY — does NOT feed milestone checks. Milestones use calculateLiveSavingsRate() exclusively.
export async function calculateMonthlySavingsRate(supabase, userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [investResult, incomeResult] = await Promise.all([
    supabase.from('investments').select('amount, date').eq('user_id', userId).gte('date', monthStart),
    supabase.from('income_entries').select('amount, date').eq('user_id', userId).gte('date', monthStart),
  ]);

  const totalInvested = (investResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalIncome   = (incomeResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  if (totalIncome === 0) return null; // null not 0 — distinguishes "no income this month" from "0% rate"
  // NOT capped at 100 unlike FY version — large investment in low-income month can legitimately exceed 100%
  return Math.round((totalInvested / totalIncome) * 100);
}
