// Indian financial year: April 1 to March 31
export function getFinancialYearStart() {
  const now  = new Date();
  // month 3 = April (0-indexed). If we're in Jan–Mar, use previous calendar year.
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 3, 1).toISOString();
}
