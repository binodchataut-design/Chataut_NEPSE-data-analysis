/**
 * Utility formatters for Nepalese Financial Data
 */

export function formatNPR(amount: number, showDecimals: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'NPR 0.00';
  return `Rs. ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
}

export function formatNumber(val: number, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats large NEPSE turnover figures into South Asian / Nepalese denominations:
 * 1 Lakh = 100,000 (10^5)
 * 1 Crore = 10,000,000 (10^7)
 * 1 Arba = 1,000,000,000 (10^9)
 */
export function formatNepseDenomination(amount: number): string {
  if (!amount || isNaN(amount)) return 'Rs. 0';
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    const arba = amount / 1_000_000_000;
    return `Rs. ${arba.toFixed(2)} Arba`;
  }
  if (abs >= 10_000_000) {
    const crore = amount / 10_000_000;
    return `Rs. ${crore.toFixed(2)} Cr`;
  }
  if (abs >= 100_000) {
    const lakh = amount / 100_000;
    return `Rs. ${lakh.toFixed(2)} Lakh`;
  }
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

export function formatPercent(pct: number): string {
  if (pct === undefined || pct === null || isNaN(pct)) return '0.00%';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}
