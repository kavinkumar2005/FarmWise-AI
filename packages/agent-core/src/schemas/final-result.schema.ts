import { z } from 'zod';
import { ProvenanceSourceSchema } from './request.schema.js';
import { StepResultSchema } from './step-result.schema.js';
import { VerificationResultSchema } from './verification.schema.js';

export const FinalResultSchema = z.object({
  runId: z.string().min(1),
  timestamp: z.string(),
  status: z.enum(['COMPLETED', 'NEEDS_INPUT', 'FAILED']),
  parcel: z.object({
    district: z.string(),
    taluk: z.string(),
    village: z.string(),
    surveyNumber: z.string(),
    subdivision: z.string().optional(),
    geometry: z.any().optional(), // GeoJSON Feature or Polygon
    centroid: z.object({
      latitude: z.number(),
      longitude: z.number()
    }).optional(),
    areaAcres: z.number().optional(),
    gisAreaAcres: z.number().optional(),
    areaDiscrepancyPct: z.number().optional()
  }),
  landRecord: z.object({
    ownerNameMasked: z.string(), // e.g. 'R. K****'
    ownerNameFull: z.string().optional(), // visible only in officer view
    classification: z.enum([
      'Patta',
      'Poromboke',
      'Waterbody',
      'Temple',
      'Forest',
      'Government',
      'Disputed',
      'Unclassified'
    ]),
    extentAcres: z.number(),
    recordId: z.string(),
    provenance: ProvenanceSourceSchema
  }),
  cropAssessment: z.object({
    cropName: z.string(),
    growthStage: z.string(),
    condition: z.enum([
      'Healthy',
      'Pest Infestation',
      'Nutrient Deficiency',
      'Moisture Stress',
      'Uncertain'
    ]),
    confidence: z.number().min(0).max(1),
    visualEvidence: z.string(),
    alternatives: z.array(z.object({
      cropName: z.string(),
      confidence: z.number()
    })).default([]),
    modelUsed: z.string(),
    photoUrl: z.string().optional(),
    provenance: ProvenanceSourceSchema
  }),
  weather: z.object({
    location: z.object({
      latitude: z.number(),
      longitude: z.number()
    }),
    currentTempC: z.number(),
    humidityPct: z.number(),
    precipitationMm: z.number(),
    forecast7Day: z.array(z.object({
      date: z.string(),
      maxTempC: z.number(),
      minTempC: z.number(),
      rainProbPct: z.number(),
      rainMm: z.number()
    })),
    agronomicAlerts: z.array(z.string()),
    source: z.string()
  }),
  recommendations: z.array(z.object({
    id: z.string(),
    category: z.enum(['fertilizer', 'irrigation', 'pest_control', 'weather_action']),
    title: z.string(),
    description: z.string(),
    dosage: z.string().optional(),
    timing: z.string(),
    sourceCitation: z.object({
      sourceId: z.string(),
      title: z.string(),
      section: z.string(),
      provenance: ProvenanceSourceSchema
    })
  })),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    parcelMatch: z.number().min(0).max(1),
    cropPrediction: z.number().min(0).max(1),
    growthStage: z.number().min(0).max(1),
    advisoryRelevance: z.number().min(0).max(1)
  }),
  verification: VerificationResultSchema,
  routeTrace: z.array(StepResultSchema),
  costSummary: z.object({
    actualRoutedCostUSD: z.number().nonnegative(),
    allLargeModelCostUSD: z.number().nonnegative(),
    savingsPct: z.number(),
    totalTokens: z.number().nonnegative()
  }),
  reviewFlags: z.array(z.string()).default([])
});
export type FinalResult = z.infer<typeof FinalResultSchema>;
