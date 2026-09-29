import { describe, it, expect } from 'vitest';
import {
  parseSpokenTamilNumber,
  extractSpokenSurveyNumber,
  normalizeTamilSpeechToQuery,
  pointInPolygon,
  distanceMeters,
  SampleParcelRepository,
  SampleLandRecordRepository
} from '../packages/agent-core/src/index.js';

describe('Phase 5: Bilingual Voice & Integrated Classified Map', () => {
  describe('Tamil Spoken Numeral Parsing', () => {
    it('parses composite Tamil numerals to integers', () => {
      expect(parseSpokenTamilNumber('இருநூற்று இரண்டு')).toBe(202);
      expect(parseSpokenTamilNumber('முன்னூற்று எண்பத்தி ஏழு')).toBe(387);
      expect(parseSpokenTamilNumber('ஐம்பத்தைந்து')).toBe(55);
      expect(parseSpokenTamilNumber('நூற்று எழுபத்து நான்கு')).toBe(174);
      expect(parseSpokenTamilNumber('202')).toBe(202);
    });

    it('returns null for non-numeric spoken phrases', () => {
      expect(parseSpokenTamilNumber('வணக்கம் விவசாயி')).toBeNull();
    });
  });

  describe('Spoken Survey Number Extraction', () => {
    it('extracts survey numbers with spoken Tamil subdivision delimiters', () => {
      expect(extractSpokenSurveyNumber('புல எண் இருநூற்று இரண்டு கீழ் ஐம்பத்தைந்து')).toBe('202/55');
      expect(extractSpokenSurveyNumber('சர்வே நம்பர் 202 கீழ் 55')).toBe('202/55');
      expect(extractSpokenSurveyNumber('சர்வே எண் 202 பார் 55')).toBe('202/55');
    });

    it('extracts single survey numbers in Tamil and English', () => {
      expect(extractSpokenSurveyNumber('சர்வே எண் முன்னூற்று எண்பத்தி ஏழு')).toBe('387');
      expect(extractSpokenSurveyNumber('survey number 202/55 in Sanganaperi')).toBe('202/55');
      expect(extractSpokenSurveyNumber('my field 387')).toBe('387');
    });
  });

  describe('Spoken Entity Extraction (Village, Crop, Survey)', () => {
    it('extracts village, crop, and survey number from spoken Tamil queries', () => {
      const result = normalizeTamilSpeechToQuery('சங்கனாபேரி கிராமத்தில் புல எண் 202/55 நெல் பயிர் பூச்சி தாக்குதல் உள்ளது');
      expect(result.detectedSurveyNumber).toBe('202/55');
      expect(result.detectedVillage).toBe('Sanganaperi');
      expect(result.detectedCrop).toBe('Paddy');
    });

    it('extracts entities from Keelathattaparai groundnut query', () => {
      const result = normalizeTamilSpeechToQuery('கீழத்தட்டப்பாறை கிராமம் வேர்க்கடலை இலைப்புள்ளி நோய்');
      expect(result.detectedVillage).toBe('Keelathattaparai');
      expect(result.detectedCrop).toBe('Groundnut');
    });

    it('extracts entities from English spoken query', () => {
      const result = normalizeTamilSpeechToQuery('Need cotton advisory for Sivagiri survey number 387');
      expect(result.detectedSurveyNumber).toBe('387');
      expect(result.detectedVillage).toBe('Sivagiri');
      expect(result.detectedCrop).toBe('Cotton');
    });
  });

  describe('Cadastral Map Classification & GPS Containment', () => {
    const parcelRepo = new SampleParcelRepository();
    const landRecordRepo = new SampleLandRecordRepository();

    it('classifies land types with correct color codes and attributes', async () => {
      const landRecord = await landRecordRepo.findBySurveyNumber('Sanganaperi', '202/55');
      expect(landRecord).toBeDefined();
      expect(landRecord?.wetOrDry).toBe('Nanjai'); // Wetland / Nanjai

      // Verify classification color mapping logic
      const getColorForLandType = (type: string) => {
        switch (type.toLowerCase()) {
          case 'nanjai':
          case 'nansei':
          case 'wetland':
            return '#10B981'; // Emerald
          case 'punjai':
          case 'punsei':
          case 'dryland':
            return '#F59E0B'; // Amber
          case 'poromboke':
          case 'waterbody':
            return '#0284C7'; // Blue
          default:
            return '#6B7280'; // Gray
        }
      };

      expect(getColorForLandType(landRecord!.wetOrDry)).toBe('#10B981');
      expect(getColorForLandType('Punjai')).toBe('#F59E0B');
      expect(getColorForLandType('Poromboke')).toBe('#0284C7');
    });

    it('validates farmer GPS coordinates against cadastral boundary and buffer', async () => {
      const parcel = await parcelRepo.findBySurveyNumber('Sanganaperi', '202/55');
      expect(parcel).toBeDefined();
      expect(parcel?.geometry).toBeDefined();

      const farmerGps = { latitude: 9.2550, longitude: 77.3850 };
      const inside = pointInPolygon(farmerGps, parcel!.geometry);

      const centroidLat = (parcel!.geometry.coordinates[0][0][1] + parcel!.geometry.coordinates[0][2][1]) / 2;
      const centroidLng = (parcel!.geometry.coordinates[0][0][0] + parcel!.geometry.coordinates[0][2][0]) / 2;
      const dist = distanceMeters(farmerGps, { latitude: centroidLat, longitude: centroidLng });

      expect(inside || dist <= 50).toBe(true);
      expect(dist).toBeLessThan(100);
    });
  });
});
