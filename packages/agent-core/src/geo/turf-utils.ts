import * as turf from '@turf/turf';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export function normalizeTamilNumerals(text: string): string {
  if (!text) return '';
  const tamilDigits: Record<string, string> = {
    '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
    '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9'
  };
  let result = text;
  for (const [tamil, arabic] of Object.entries(tamilDigits)) {
    result = result.replaceAll(tamil, arabic);
  }
  // Normalize dashes or spaces in survey numbers, e.g. 202-55 -> 202/55
  result = result.replace(/(\d+)\s*[-_]\s*(\d+)/g, '$1/$2');
  return result;
}

export function pointInPolygon(point: LatLng, geometry: any): boolean {
  if (!geometry) return false;
  try {
    const pt = turf.point([point.longitude, point.latitude]);
    const geom = geometry.type === 'Feature' ? geometry : turf.feature(geometry);
    return turf.booleanPointInPolygon(pt, geom);
  } catch (err) {
    console.warn('Error in pointInPolygon calculation:', err);
    return false;
  }
}

export function calculateAreaAcres(geometry: any): number {
  if (!geometry) return 0;
  try {
    const geom = geometry.type === 'Feature' ? geometry : turf.feature(geometry);
    const sqMeters = turf.area(geom);
    // 1 sq meter = 0.000247105 acres
    return Number((sqMeters * 0.000247105).toFixed(2));
  } catch (err) {
    console.warn('Error in calculateAreaAcres:', err);
    return 0;
  }
}

export function calculateCentroid(geometry: any): LatLng {
  if (!geometry) return { latitude: 0, longitude: 0 };
  try {
    const geom = geometry.type === 'Feature' ? geometry : turf.feature(geometry);
    const cent = turf.centroid(geom);
    return {
      latitude: Number(cent.geometry.coordinates[1].toFixed(6)),
      longitude: Number(cent.geometry.coordinates[0].toFixed(6))
    };
  } catch (err) {
    console.warn('Error in calculateCentroid:', err);
    return { latitude: 0, longitude: 0 };
  }
}

export function distanceMeters(p1: LatLng, p2: LatLng): number {
  try {
    const from = turf.point([p1.longitude, p1.latitude]);
    const to = turf.point([p2.longitude, p2.latitude]);
    return Math.round(turf.distance(from, to, { units: 'meters' }));
  } catch (err) {
    return 0;
  }
}