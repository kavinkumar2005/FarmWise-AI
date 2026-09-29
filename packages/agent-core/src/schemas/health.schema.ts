import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded']),
  version: z.string(),
  timestamp: z.string(),
  region: z.literal('ap-south-1'),
  teamId: z.string(),
  environment: z.string(),
  services: z.record(z.string()),
  modelsConfigured: z.number().int().positive()
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
