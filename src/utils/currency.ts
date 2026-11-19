/**
 * Formats a numeric value into USDT display string.
 * Keeps exact decimals without rounding off fractional USDT values.
 */
export function formatUSDT(val?: number | null, maxDecimals?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '—';

  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  let minDp = Number.isInteger(absVal) ? 0 : 2;
  let maxDp = maxDecimals !== undefined ? maxDecimals : 2;

  if (maxDecimals === undefined) {
    const str = absVal.toString();
    const decimalPart = str.split('.')[1] || '';
    if (decimalPart.length > 2) {
      maxDp = Math.min(6, Math.max(4, decimalPart.length));
    }
  }

  return (
    sign +
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minDp,
      maximumFractionDigits: maxDp,
    }).format(absVal) +
    ' USDT'
  );
}

