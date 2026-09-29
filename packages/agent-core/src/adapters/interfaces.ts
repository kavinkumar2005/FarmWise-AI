import { ProvenanceSource } from '../schemas/request.schema.js';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ParcelRecord {
  id: string;
  district: string;
  taluk: string;
  village: string;
  surveyNumber: string;
  subdivision?: string;
  geometry: any; // GeoJSON geometry (Polygon / MultiPolygon)
  centroid: GeoPoint;
  areaAcres: number;
  provenance: ProvenanceSource;
}

export interface LandRecord {
  recordId: string;
  district: string;
  taluk: string;
  village: string;
  surveyNumber: string;
  subdivision?: string;
  ownerNameMasked: string;
  ownerNameFull?: string;
  classification: 'Patta' | 'Poromboke' | 'Waterbody' | 'Temple' | 'Forest' | 'Government' | 'Disputed' | 'Unclassified';
  wetOrDry: 'Nanjai' | 'Punjai' | 'Manavari' | 'Non-Agricultural';
  extentAcres: number;
  pattaNumber?: string;
  provenance: ProvenanceSource;
}

export interface FieldImageRecord {
  id: string;
  surveyNumber: string;
  subdivision?: string;
  village: string;
  cropName: string;
  cropStage: string;
  imagePath: string;
  capturedAt: string;
  coordinates: GeoPoint;
  provenance: ProvenanceSource;
}

export interface AdvisoryPractice {
  id: string;
  cropName: string;
  cropStage: string;
  season: 'Kharif' | 'Rabi' | 'Navarai' | 'Annual' | 'All';
  category: 'fertilizer' | 'irrigation' | 'pest_control' | 'weather_action';
  title: string;
  description: string;
  dosage?: string;
  timing: string;
  sourceId: string;
  sourceTitle: string;
  sourceSection: string;
  provenance: ProvenanceSource;
}

export interface ParcelRepository {
  findBySurveyNumber(village: string, surveyNumber: string, subdivision?: string): Promise<ParcelRecord | null>;
  findByCoordinates(lat: number, lng: number): Promise<ParcelRecord | null>;
  listVillages(): Promise<{ district: string; taluk: string; village: string }[]>;
}

export interface LandRecordRepository {
  findBySurveyNumber(village: string, surveyNumber: string, subdivision?: string): Promise<LandRecord | null>;
  crossCheck(extractedDoc: Partial<LandRecord>, registryRecord: LandRecord): {
    ownerMatches: boolean;
    extentDifferencePct: number;
    discrepancies: string[];
  };
}

export interface FieldImageRepository {
  findImagesByParcel(village: string, surveyNumber: string, subdivision?: string): Promise<FieldImageRecord[]>;
  getReferenceSamples(cropName?: string, stage?: string): Promise<FieldImageRecord[]>;
}

export interface AdvisoryCorpus {
  searchPractices(cropName: string, stage?: string, query?: string): Promise<AdvisoryPractice[]>;
}
