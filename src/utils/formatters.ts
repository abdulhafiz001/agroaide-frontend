/** Format square meters for Nigerian farm UI. */
export function formatAreaM2(areaM2: number | null | undefined): string {
  const value = Number(areaM2 ?? 0);
  if (!Number.isFinite(value)) return '0 m²';
  return `${Math.round(value).toLocaleString('en-NG')} m²`;
}

/**
 * Nigerians often think in feet. Given area in m², assume a square plot and
 * show side × side in feet (e.g. 929 m² ≈ 100 × 100 ft).
 * 1 m = 3.28084 ft.
 */
export function formatSquareSidesFt(areaM2: number | null | undefined): string | null {
  const value = Number(areaM2 ?? 0);
  if (!Number.isFinite(value) || value <= 0) return null;
  const sideMeters = Math.sqrt(value);
  const sideFeet = Math.round(sideMeters * 3.28084);
  if (sideFeet <= 0) return null;
  return `${sideFeet.toLocaleString('en-NG')} × ${sideFeet.toLocaleString('en-NG')} ft`;
}

/** Primary area display: m² plus square-feet sides estimate. */
export function formatAreaWithFt(areaM2: number | null | undefined): string {
  const m2 = formatAreaM2(areaM2);
  const ft = formatSquareSidesFt(areaM2);
  return ft ? `${m2} (≈ ${ft})` : m2;
}

export function formatNaira(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) return '₦0';
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}
