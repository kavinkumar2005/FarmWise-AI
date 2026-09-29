import { describe, it, expect } from 'vitest';
import {
  pointInPolygon,
  calculateAreaAcres,
  calculateCentroid,
  distanceMeters,
  normalizeTamilNumerals
} from '../packages/agent-core/src/index.js';

describe('Phase 3: Geospatial & Turf Utilities', () => {
  it('normalizes Tamil numerals and hyphenated survey notation', () => {
    // ௨=2, ௦=0, ௫=5
    expect(normalizeTamilNumerals('௨௦௨/௫௫')).toBe('202/55');
    expect(normalizeTamilNumerals('202-55')).toBe('202/55');
    expect(normalizeTamilNumerals('1342-1B')).toBe('1342/1B');
    expect(normalizeTamilNumerals('சர்வே எண் ௩௮௭')).toBe('சர்வே எண் 387');
  });

  const testPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [77.3840, 9.2540],
        [77.3860, 9.2540],
        [77.3860, 9.2560],
        [77.3840, 9.2560],
        [77.3840, 9.2540]
      ]
    ]
  };

  it('determines whether a point lies inside or outside a parcel polygon', () => {
    const insidePoint = { latitude: 9.2550, longitude: 77.3850 };
    const outsidePoint = { latitude: 9.2600, longitude: 77.3900 };

    expect(pointInPolygon(insidePoint, testPolygon)).toBe(true);
    expect(pointInPolygon(outsidePoint, testPolygon)).toBe(false);
  });

  it('calculates polygon area in acres and centroid coordinates', () => {
    const acres = calculateAreaAcres(testPolygon);
    expect(acres).toBeGreaterThan(1);
    expect(acres).toBeLessThan(15);

    const centroid = calculateCentroid(testPolygon);
    expect(centroid.latitude).toBeCloseTo(9.255, 2);
    expect(centroid.longitude).toBeCloseTo(77.385, 2);
  });

  it('calculates geodesic distance in meters', () => {
    const p1 = { latitude: 9.2550, longitude: 77.3850 };
    const p2 = { latitude: 9.2560, longitude: 77.3850 };
    const meters = distanceMeters(p1, p2);
    expect(meters).toBeGreaterThan(90);
    expect(meters).toBeLessThan(130);
  });
});