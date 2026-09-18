export function formatCurrency(val: number): string {
  if (isNaN(val)) return 'Rs. 0';
  return `Rs. ${val.toLocaleString('en-NP', { maximumFractionDigits: 2 })}`.trim();
}

export function formatNPR(val: number): string {
  return formatCurrency(val);
}

export function formatNepseDenomination(val: number): string {
  if (isNaN(val)) return '0';
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)} Arba`;
  if (val >= 1e7) return `${(val / 1e7).toFixed(2)} Crore`;
  if (val >= 1e5) return `${(val / 1e5).toFixed(2)} Lakh`;
  return val.toLocaleString('en-NP');
}

export function formatNumber(val: number): string {
  if (isNaN(val)) return '0';
  return val.toLocaleString('en-NP');
}

export function formatPercent(val: number): string {
  if (isNaN(val)) return '0.00%';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}
