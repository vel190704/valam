/**
 * SIP execution engine — runs daily to auto-log investment entries
 * for every active SIP plan whose next_execution_date is today or overdue.
 *
 * Handles backfill: if the server was down for multiple cycles, every missed
 * cycle is logged individually with its own date.
 */

function advanceSipDate(current, frequency, startDate) {
  if (frequency === 'weekly') {
    return new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  // monthly: same calendar day as start, clamped to month end
  const startDay = new Date(startDate + 'T00:00:00').getDate();
  const next = new Date(current);
  next.setMonth(next.getMonth() + 1);
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(startDay, maxDay));
  return next;
}

export async function executeDueSIPs(supabaseAdmin) {
  const today = new Date().toISOString().split('T')[0];

  const { data: dueSIPs, error } = await supabaseAdmin
    .from('sip_plans')
    .select('*')
    .eq('status', 'active')
    .lte('next_execution_date', today);

  if (error) {
    console.error('[sipCron] Failed to fetch due SIPs:', error.message);
    return;
  }
  if (!dueSIPs || dueSIPs.length === 0) {
    console.log('[sipCron] No SIPs due on', today);
    return;
  }

  let totalExecuted = 0;

  for (const sip of dueSIPs) {
    // Build list of all missed cycle dates from next_execution_date up to today
    let execDate = new Date(sip.next_execution_date + 'T00:00:00');
    const execDates = [];

    while (execDate.toISOString().split('T')[0] <= today) {
      execDates.push(execDate.toISOString().split('T')[0]);
      execDate = advanceSipDate(execDate, sip.frequency, sip.start_date);
    }

    // Log one investment entry per missed cycle
    for (const date of execDates) {
      const { error: insertErr } = await supabaseAdmin
        .from('investments')
        .insert({
          user_id: sip.user_id,
          date,
          type:    sip.investment_type,
          amount:  sip.amount,
          note:    sip.note ? `[SIP] ${sip.note}` : `[SIP] Auto-logged ${sip.frequency} SIP`,
          sip_id:  sip.id,
        });

      if (insertErr) {
        console.error(`[sipCron] Failed to insert investment for SIP ${sip.id} on ${date}:`, insertErr.message);
      }
    }

    totalExecuted += execDates.length;

    // Advance next_execution_date to the next future cycle
    await supabaseAdmin
      .from('sip_plans')
      .update({
        next_execution_date: execDate.toISOString().split('T')[0],
        updated_at:          new Date().toISOString(),
      })
      .eq('id', sip.id);
  }

  console.log(`[sipCron] ${today}: processed ${dueSIPs.length} SIP(s), logged ${totalExecuted} investment entries`);
}
