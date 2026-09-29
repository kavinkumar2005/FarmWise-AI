import { z } from 'zod';

export const VerificationCheckSchema = z.object({
  checkId: z.string(),
  name: z.string(),
  type: z.enum(['deterministic', 'semantic_critic']),
  status: z.enum(['pass', 'warn', 'fail']),
  evidence: z.string(),
  explanation: z.string()
});
export type VerificationCheck = z.infer<typeof VerificationCheckSchema>;

export const VerificationResultSchema = z.object({
  overallStatus: z.enum(['VERIFIED', 'VERIFIED WITH WARNINGS', 'NEEDS HUMAN REVIEW']),
  checks: z.array(VerificationCheckSchema),
  criticModelUsed: z.string(),
  criticReasoning: z.string()
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
