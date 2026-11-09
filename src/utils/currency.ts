/**
 * Formats a numeric value into USDT display string.
 * Keeps exact decimals (up to specified precision, default 2 for fractional, or 0 if whole integer).
 * Does NOT round up fractional USDT values like 1.65 to 2!
 */
export function formatUSDT(val?: number | null, maxDecimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '—';

  // Format with Intl.NumberFormat to avoid rounding up to whole numbers
  return (
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
      maximumFractionDigits: maxDecimals,
    }).format(val) + ' USDT'
  );
}
