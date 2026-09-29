import { describe, it, expect } from 'vitest';
import { VerifierAgent, SharedState, ModelRouter, PlanStep } from '../packages/agent-core/src/index.js';

describe('Phase 3: Verifier Agent (Deterministic & Critic)', () => {
  it('executes all 7 domain checks and semantic critic validation', async () => {
    const agent = new VerifierAgent();
    const router = new ModelRouter();
    const request = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      rawQuery: 'Verify analysis',
      language: 'en' as const,
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      consentGiven: true,
      attachments: {}
    };
    const state = new SharedState('RUN-VERIFY-01', request);

    // Mock prior outputs in state
    state.setStepOutput('step-1', {
      surveyNumber: '202/55',
      centroid: { latitude: 9.2550, longitude: 77.3850 },
      gpsWarning: undefined
    });
    state.setStepOutput('step-3', {
      cropName: 'Paddy',
      growthStage: 'tillering',
      photoUrl: 'sample_paddy.jpg'
    });
    state.setStepOutput('step-4', {
      forecast7Day: [{ date: '2026-09-30', rainMm: 0 }]
    });
    state.setStepOutput('step-5', [
      { id: 'ADV-1', dosage: 'Neem-coated Urea: 30 kg/acre', sourceCitation: { sourceId: 'TNAU-S4' } }
    ]);

    const step: PlanStep = {
      id: 'step-6',
      name: 'Independent Deterministic & Critic Verification',
      agent: 'verifier',
      inputs: {},
      dependsOn: ['step-1', 'step-3', 'step-4', 'step-5'],
      criticality: 'critical',
      requiredOutputs: ['overallStatus', 'checks'],
      candidateModels: ['claude-sonnet']
    };

    const result = await agent.run(state, step, router);
    expect(result.status).toBe('success');
    expect(result.data.checks.length).toBe(7);
    expect(result.data.overallStatus).toBe('VERIFIED');
    expect(result.data.criticModelUsed).toBeDefined();
  });
});