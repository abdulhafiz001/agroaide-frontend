export type GpsPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: number;
};

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in meters between two WGS84 points. */
export function haversineMeters(a: GpsPoint, b: GpsPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Spherical polygon area (m²).
 * Area = (R²/2) * |Σ (λ_{i+1} - λ_{i-1}) * sin(φ_i)|
 */
export function sphericalPolygonAreaM2(points: GpsPoint[]): number {
  const ring = [...points];
  if (ring.length < 3) return 0;

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (
    Math.abs(first.latitude - last.latitude) < 1e-12 &&
    Math.abs(first.longitude - last.longitude) < 1e-12
  ) {
    ring.pop();
  }
  if (ring.length < 3) return 0;

  const n = ring.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const prev = ring[(i - 1 + n) % n];
    const curr = ring[i];
    const next = ring[(i + 1) % n];
    const phi = toRad(curr.latitude);
    const lambdaPrev = toRad(prev.longitude);
    const lambdaNext = toRad(next.longitude);
    sum += (lambdaNext - lambdaPrev) * Math.sin(phi);
  }

  return (EARTH_RADIUS_M * EARTH_RADIUS_M * Math.abs(sum)) / 2;
}

/** Keep accurate points and drop near-duplicates. */
export function filterGpsStream(
  points: GpsPoint[],
  options?: { maxAccuracyM?: number; minSpacingM?: number },
): GpsPoint[] {
  const maxAccuracyM = options?.maxAccuracyM ?? 5;
  const minSpacingM = options?.minSpacingM ?? 2;
  const filtered: GpsPoint[] = [];

  for (const point of points) {
    if (point.accuracy != null && point.accuracy > maxAccuracyM) continue;
    const prev = filtered[filtered.length - 1];
    if (prev && haversineMeters(prev, point) < minSpacingM) continue;
    filtered.push(point);
  }

  return filtered;
}

export function pointsToGeoJsonPolygon(points: GpsPoint[]): {
  type: 'Polygon';
  coordinates: [number, number][][];
} {
  const ring: [number, number][] = points.map((p) => [p.longitude, p.latitude]);
  if (ring.length > 0) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }
  }
  return { type: 'Polygon', coordinates: [ring] };
}

export function createClientUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
