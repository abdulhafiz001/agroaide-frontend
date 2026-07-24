/** Format square meters for Nigerian farm UI. */
export function formatAreaM2(areaM2: number | null | undefined): string {
  const value = Number(areaM2 ?? 0);
  if (!Number.isFinite(value)) return '0 m²';
  return `${Math.round(value).toLocaleString('en-NG')} m²`;
}

export function formatNaira(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) return '₦0';
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}
