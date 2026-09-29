import {
  ParcelRepository,
  LandRecordRepository,
  FieldImageRepository,
  AdvisoryCorpus,
  ParcelRecord,
  LandRecord,
  FieldImageRecord,
  AdvisoryPractice
} from '../interfaces.js';

export function maskName(fullName: string): string {
  if (!fullName) return 'Unknown';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    const name = parts[0];
    return name.length > 2 ? `${name.slice(0, 2)}****` : `${name}****`;
  }
  const prefix = parts.slice(0, -1).join(' ');
  const last = parts[parts.length - 1];
  const maskedLast = last.length > 1 ? `${last[0]}****` : '****';
  return `${prefix} ${maskedLast}`;
}

export class SampleParcelRepository implements ParcelRepository {
  private parcels: ParcelRecord[] = [
    {
      id: 'PARCEL-TN-THOO-001',
      district: 'Thoothukudi',
      taluk: 'Thoothukudi',
      village: 'Keelathattaparai',
      surveyNumber: '387',
      subdivision: '1',
      areaAcres: 2.45,
      centroid: { latitude: 8.7788, longitude: 78.0261 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.02659, 8.77878],
            [78.02682, 8.77855],
            [78.02605, 8.77810],
            [78.02544, 8.77853],
            [78.02526, 8.77876],
            [78.02659, 8.77878]
          ]
        ]
      },
      provenance: 'FarmwiseAI-provided'
    },
    {
      id: 'PARCEL-TN-THOO-002',
      district: 'Thoothukudi',
      taluk: 'Thoothukudi',
      village: 'Keelathattaparai',
      surveyNumber: '388',
      subdivision: '2',
      areaAcres: 1.80,
      centroid: { latitude: 8.7777, longitude: 78.0268 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.02714, 8.77824],
            [78.02731, 8.77808],
            [78.02682, 8.77855],
            [78.02714, 8.77824]
          ]
        ]
      },
      provenance: 'FarmwiseAI-provided'
    },
    {
      id: 'PARCEL-TN-THOO-003',
      district: 'Thoothukudi',
      taluk: 'Thoothukudi',
      village: 'Peroorani',
      surveyNumber: '174',
      subdivision: '1',
      areaAcres: 3.12,
      centroid: { latitude: 8.7812, longitude: 78.0094 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.00918, 8.78186],
            [78.01048, 8.78157],
            [78.01006, 8.78009],
            [78.00845, 8.78025],
            [78.00918, 8.78186]
          ]
        ]
      },
      provenance: 'FarmwiseAI-provided'
    },
    {
      id: 'PARCEL-TN-TENK-1342',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '1342',
      subdivision: '1B',
      areaAcres: 1.65,
      centroid: { latitude: 9.2463, longitude: 77.3798 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.3790, 9.2460],
            [77.3805, 9.2460],
            [77.3805, 9.2468],
            [77.3790, 9.2468],
            [77.3790, 9.2460]
          ]
        ]
      },
      provenance: 'FarmwiseAI-provided'
    },
    {
      id: 'PARCEL-TN-TENK-202-55',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      subdivision: 'A',
      areaAcres: 2.10,
      centroid: { latitude: 9.2550, longitude: 77.3850 },
      geometry: {
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
      },
      provenance: 'Sample data'
    }
  ];

  async findBySurveyNumber(village: string, surveyNumber: string, subdivision?: string): Promise<ParcelRecord | null> {
    const cleanSurvey = surveyNumber.trim().replace(/[-\s]/g, '/');
    const cleanVillage = village.trim().toLowerCase();

    const match = this.parcels.find(p => {
      const pVillage = p.village.toLowerCase();
      const pSurvey = p.surveyNumber.replace(/[-\s]/g, '/');
      const villageMatches = pVillage.includes(cleanVillage) || cleanVillage.includes(pVillage);
      const surveyMatches = pSurvey === cleanSurvey || (p.subdivision && `${pSurvey}/${p.subdivision}` === cleanSurvey);
      return villageMatches && surveyMatches;
    });

    return match || null;
  }

  async findByCoordinates(lat: number, lng: number): Promise<ParcelRecord | null> {
    // Quick bounding box proximity check
    for (const p of this.parcels) {
      const dLat = Math.abs(p.centroid.latitude - lat);
      const dLng = Math.abs(p.centroid.longitude - lng);
      if (dLat < 0.005 && dLng < 0.005) {
        return p;
      }
    }
    return null;
  }

  async listVillages(): Promise<{ district: string; taluk: string; village: string }[]> {
    return [
      { district: 'Thoothukudi', taluk: 'Thoothukudi', village: 'Keelathattaparai' },
      { district: 'Thoothukudi', taluk: 'Thoothukudi', village: 'Peroorani' },
      { district: 'Tenkasi', taluk: 'Sivagiri', village: 'Sanganaperi' },
      { district: 'Tenkasi', taluk: 'Sivagiri', village: 'Vasudevanallur' }
    ];
  }
}

export class SampleLandRecordRepository implements LandRecordRepository {
  private records: LandRecord[] = [
    {
      recordId: 'PATTA-THOO-387',
      district: 'Thoothukudi',
      taluk: 'Thoothukudi',
      village: 'Keelathattaparai',
      surveyNumber: '387',
      subdivision: '1',
      ownerNameMasked: 'M. S****',
      ownerNameFull: 'M. Subbiah',
      classification: 'Patta',
      wetOrDry: 'Punjai',
      extentAcres: 2.45,
      pattaNumber: '1042',
      provenance: 'FarmwiseAI-provided'
    },
    {
      recordId: 'PATTA-TENK-1342-1B',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '1342',
      subdivision: '1B',
      ownerNameMasked: 'P. M****',
      ownerNameFull: 'P. Muthusamy',
      classification: 'Patta',
      wetOrDry: 'Nanjai',
      extentAcres: 1.65,
      pattaNumber: '892',
      provenance: 'FarmwiseAI-provided'
    },
    {
      recordId: 'PATTA-TENK-202-55',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      subdivision: 'A',
      ownerNameMasked: 'R. K****',
      ownerNameFull: 'R. Krishnan',
      classification: 'Patta',
      wetOrDry: 'Nanjai',
      extentAcres: 2.10,
      pattaNumber: '554',
      provenance: 'Sample data'
    }
  ];

  async findBySurveyNumber(village: string, surveyNumber: string): Promise<LandRecord | null> {
    const cleanSurvey = surveyNumber.trim().replace(/[-\s]/g, '/');
    const cleanVillage = village.trim().toLowerCase();

    const match = this.records.find(r => {
      const vMatch = r.village.toLowerCase().includes(cleanVillage) || cleanVillage.includes(r.village.toLowerCase());
      const sMatch = r.surveyNumber === cleanSurvey || (r.subdivision && `${r.surveyNumber}/${r.subdivision}` === cleanSurvey);
      return vMatch && sMatch;
    });

    return match || null;
  }

  crossCheck(extractedDoc: Partial<LandRecord>, registryRecord: LandRecord) {
    const discrepancies: string[] = [];
    let ownerMatches = true;

    if (extractedDoc.ownerNameFull && registryRecord.ownerNameFull) {
      const cleanExtracted = extractedDoc.ownerNameFull.toLowerCase().replace(/[^a-z]/g, '');
      const cleanRegistry = registryRecord.ownerNameFull.toLowerCase().replace(/[^a-z]/g, '');
      if (!cleanRegistry.includes(cleanExtracted) && !cleanExtracted.includes(cleanRegistry)) {
        ownerMatches = false;
        discrepancies.push(`Owner name mismatch: Document says '${extractedDoc.ownerNameFull}', Registry says '${registryRecord.ownerNameFull}'`);
      }
    }

    let extentDifferencePct = 0;
    if (extractedDoc.extentAcres !== undefined && registryRecord.extentAcres) {
      extentDifferencePct = Math.abs(extractedDoc.extentAcres - registryRecord.extentAcres) / registryRecord.extentAcres * 100;
      if (extentDifferencePct > 5) {
        discrepancies.push(`Extent difference exceeds 5%: Document says ${extractedDoc.extentAcres} acres, Registry says ${registryRecord.extentAcres} acres (${extentDifferencePct.toFixed(1)}% variance)`);
      }
    }

    return {
      ownerMatches,
      extentDifferencePct,
      discrepancies
    };
  }
}

export class SampleFieldImageRepository implements FieldImageRepository {
  private images: FieldImageRecord[] = [
    {
      id: 'IMG-COCO-001',
      surveyNumber: '1342',
      subdivision: '1B',
      village: 'Sanganaperi',
      cropName: 'Coconut',
      cropStage: 'full_growth',
      imagePath: 'Datasets/images/images/fdbc9fbcc153608c-43509-10631721293620.jpg',
      capturedAt: '2024-08-11T10:00:00Z',
      coordinates: { latitude: 9.253688, longitude: 77.393118 },
      provenance: 'FarmwiseAI-provided'
    },
    {
      id: 'IMG-PADDY-002',
      surveyNumber: '202/55',
      subdivision: 'A',
      village: 'Sanganaperi',
      cropName: 'Paddy',
      cropStage: 'tillering',
      imagePath: 'Datasets/images/images/sample_paddy_tillering.jpg',
      capturedAt: '2024-09-15T09:30:00Z',
      coordinates: { latitude: 9.2550, longitude: 77.3850 },
      provenance: 'Sample data'
    }
  ];

  async findImagesByParcel(village: string, surveyNumber: string): Promise<FieldImageRecord[]> {
    const cleanSurvey = surveyNumber.trim();
    return this.images.filter(img => 
      img.surveyNumber === cleanSurvey || 
      (img.subdivision && `${img.surveyNumber}/${img.subdivision}` === cleanSurvey)
    );
  }

  async getReferenceSamples(cropName?: string, stage?: string): Promise<FieldImageRecord[]> {
    if (!cropName) return this.images;
    return this.images.filter(img => 
      img.cropName.toLowerCase() === cropName.toLowerCase() &&
      (!stage || img.cropStage.toLowerCase() === stage.toLowerCase())
    );
  }
}

export class SampleAdvisoryCorpus implements AdvisoryCorpus {
  private practices: AdvisoryPractice[] = [
    {
      id: 'ADV-PAD-TILL-01',
      cropName: 'Paddy',
      cropStage: 'tillering',
      season: 'Kharif',
      category: 'fertilizer',
      title: 'Top Dressing Nitrogen Application for Active Tillering',
      description: 'Apply Neem Coated Urea at active tillering stage (20-25 days after transplanting). Drain standing water before broadcast and irrigate after 24 hours.',
      dosage: 'Neem-coated Urea: 30 kg/acre (or 65 kg/ha) along with 10 kg/acre Muriate of Potash (MOP)',
      timing: '20 to 25 days after transplanting (active tillering phase)',
      sourceId: 'TNAU-CPG-2024-PADDY-S4',
      sourceTitle: 'TNAU Agritech Portal: Crop Production Guide - Wetland Rice',
      sourceSection: 'Section 4.3 Nutrient Management in Tillering Stage',
      provenance: 'Public source'
    },
    {
      id: 'ADV-PAD-PEST-02',
      cropName: 'Paddy',
      cropStage: 'tillering',
      season: 'All',
      category: 'pest_control',
      title: 'Stem Borer and Leaf Folder Prophylactic Monitoring',
      description: 'Set up light traps and pheromone traps (5 traps/acre). If leaf folder damage exceeds 10% damaged leaves, spray Chlorantraniliprole 18.5% SC.',
      dosage: 'Chlorantraniliprole 18.5% SC @ 60 ml/acre in 200 L water',
      timing: 'At first appearance of leaf fold or adult moths during tillering',
      sourceId: 'TNAU-CPG-2024-PADDY-S7',
      sourceTitle: 'TNAU Agritech Portal: Integrated Pest Management',
      sourceSection: 'Section 7.1 Stem Borer & Leaf Folder Control',
      provenance: 'Public source'
    },
    {
      id: 'ADV-COCO-GROWTH-01',
      cropName: 'Coconut',
      cropStage: 'full_growth',
      season: 'All',
      category: 'fertilizer',
      title: 'Adult Palm Regular Manurial Schedule',
      description: 'Apply balanced NPK fertilizers in two equal split doses (May-June and Sept-Oct) along basin at 1.8 m radius from trunk.',
      dosage: 'Urea: 1.3 kg/palm/year, Super Phosphate: 2.0 kg/palm/year, MOP: 2.0 kg/palm/year, Neem cake: 5 kg/palm',
      timing: 'Post-monsoon split application in circular ring trench',
      sourceId: 'CPCRI-TNAU-COCO-2023',
      sourceTitle: 'ICAR-CPCRI / TNAU Coconut Management Manual',
      sourceSection: 'Chapter 5 Nutrient Management for Adult Palms',
      provenance: 'Public source'
    }
  ];

  async searchPractices(cropName: string, stage?: string): Promise<AdvisoryPractice[]> {
    const cleanCrop = cropName.toLowerCase();
    const cleanStage = stage ? stage.toLowerCase() : '';

    return this.practices.filter(p => {
      const cropMatches = p.cropName.toLowerCase().includes(cleanCrop);
      const stageMatches = !cleanStage || p.cropStage.toLowerCase().includes(cleanStage);
      return cropMatches && stageMatches;
    });
  }
}
