import { z } from 'zod';

export const ProvenanceSourceSchema = z.enum([
  'FarmwiseAI-provided',
  'Public source',
  'User-uploaded',
  'AI-generated',
  'Sample data'
]);
export type ProvenanceSource = z.infer<typeof ProvenanceSourceSchema>;

export const FarmerRequestSchema = z.object({
  requestId: z.string().min(1),
  farmerName: z.string().optional(),
  language: z.enum(['en', 'ta', 'auto']).default('auto'),
  rawQuery: z.string().min(1),
  district: z.string().min(1),
  taluk: z.string().min(1),
  village: z.string().min(1),
  surveyNumber: z.string().min(1), // e.g. '1342', '202/55', '387'
  subdivision: z.string().optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  attachments: z.object({
    fieldPhotoUrl: z.string().url().optional(),
    fieldPhotoKey: z.string().optional(),
    landDocUrl: z.string().url().optional(),
    landDocKey: z.string().optional(),
    sowingDate: z.string().optional(),
    soilType: z.string().optional(),
    previousCrop: z.string().optional()
  }).default({}),
  consentGiven: z.boolean().default(true)
});

export type FarmerRequest = z.infer<typeof FarmerRequestSchema>;
