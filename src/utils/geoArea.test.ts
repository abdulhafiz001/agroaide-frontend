import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filterGpsStream,
  haversineMeters,
  pointsToGeoJsonPolygon,
  sphericalPolygonAreaM2,
} from './geoArea';

describe('geoArea', () => {
  it('filters inaccurate and dense points', () => {
    const filtered = filterGpsStream([
      { latitude: 9.0, longitude: 7.0, accuracy: 3 },
      { latitude: 9.000001, longitude: 7.0, accuracy: 3 },
      { latitude: 9.001, longitude: 7.001, accuracy: 12 },
      { latitude: 9.002, longitude: 7.002, accuracy: 4 },
    ]);
    assert.equal(filtered.length, 2);
    assert.ok((filtered[0].accuracy ?? 0) <= 5);
  });

  it('computes positive area for a closed ring', () => {
    const square = [
      { latitude: 9.0, longitude: 7.0 },
      { latitude: 9.001, longitude: 7.0 },
      { latitude: 9.001, longitude: 7.001 },
      { latitude: 9.0, longitude: 7.001 },
    ];
    const area = sphericalPolygonAreaM2(square);
    assert.ok(area > 5000);
    assert.ok(area < 20000);
  });

  it('builds GeoJSON with lng/lat order', () => {
    const geo = pointsToGeoJsonPolygon([
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 },
      { latitude: 5, longitude: 6 },
    ]);
    assert.equal(geo.type, 'Polygon');
    assert.deepEqual(geo.coordinates[0][0], [2, 1]);
    assert.deepEqual(geo.coordinates[0][geo.coordinates[0].length - 1], [2, 1]);
  });

  it('measures short haversine distances', () => {
    const d = haversineMeters(
      { latitude: 9.0, longitude: 7.0 },
      { latitude: 9.0, longitude: 7.0001 },
    );
    assert.ok(d > 5);
    assert.ok(d < 20);
  });
});
