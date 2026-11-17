/**
 * Safely computes completed calendar days between a start date and now,
 * eliminating timezone offset and UTC midnight parsing skews.
 */
export function calculateCompletedDays(startDateStr?: string | Date | null): number {
  if (!startDateStr) return 0;
  let startYear: number, startMonth: number, startDay: number;
  if (typeof startDateStr === 'string') {
    const cleanStr = startDateStr.split('T')[0];
    const parts = cleanStr.split(/[-/]/);
    if (parts.length >= 3) {
      startYear = parseInt(parts[0], 10);
      startMonth = parseInt(parts[1], 10) - 1;
      startDay = parseInt(parts[2], 10);
    } else {
      const d = new Date(startDateStr);
      if (isNaN(d.getTime())) return 0;
      startYear = d.getFullYear();
      startMonth = d.getMonth();
      startDay = d.getDate();
    }
  } else {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return 0;
    startYear = d.getFullYear();
    startMonth = d.getMonth();
    startDay = d.getDate();
  }

  const now = new Date();
  const startMidnight = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const diffMs = todayMidnight.getTime() - startMidnight.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
