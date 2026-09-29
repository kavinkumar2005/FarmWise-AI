import { z } from 'zod';
import { ProvenanceSourceSchema } from './request.schema.js';
import { AgentTypeSchema } from './plan.schema.js';

export const StepResultSchema = z.object({
  stepId: z.string(),
  agent: AgentTypeSchema,
  status: z.enum(['success', 'warning', 'failed', 'fallback', 'skipped']),
  chosenModel: z.string(),
  routingReason: z.string(),
  latencyMs: z.number().nonnegative(),
  tokens: z.object({
    input: z.number().nonnegative().default(0),
    output: z.number().nonnegative().default(0)
  }),
  estimatedCostUSD: z.number().nonnegative().default(0),
  confidence: z.number().min(0).max(1),
  data: z.any(),
  sources: z.array(z.object({
    id: z.string(),
    name: z.string(),
    provenance: ProvenanceSourceSchema,
    uri: z.string().optional()
  })).default([]),
  fallbackDetails: z.object({
    triggered: z.boolean(),
    originalModel: z.string().optional(),
    reason: z.string().optional()
  }).optional(),
  reviewFlags: z.array(z.string()).default([])
});
export type StepResult = z.infer<typeof StepResultSchema>;
