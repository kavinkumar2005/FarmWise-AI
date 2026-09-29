import { z } from 'zod';

export const AgentTypeSchema = z.enum([
  'planner',
  'geography',
  'landRecord',
  'image',
  'weather',
  'agriKnowledge',
  'verifier'
]);
export type AgentType = z.infer<typeof AgentTypeSchema>;

export const PlanStepSchema = z.object({
  id: z.string(), // e.g., 'step-1'
  name: z.string(),
  agent: AgentTypeSchema,
  inputs: z.record(z.any()),
  dependsOn: z.array(z.string()),
  criticality: z.enum(['critical', 'normal']),
  requiredOutputs: z.array(z.string()),
  candidateModels: z.array(z.string())
});
export type PlanStep = z.infer<typeof PlanStepSchema>;

export const PlanSchema = z.object({
  planId: z.string().min(1),
  summary: z.string(),
  steps: z.array(PlanStepSchema),
  missingInfo: z.array(z.string()).default([]),
  estimatedCostUSD: z.number().default(0),
  draftedBy: z.string()
});
export type Plan = z.infer<typeof PlanSchema>;
