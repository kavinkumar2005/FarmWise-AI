import { describe, it, expect } from 'vitest';
import { ImageAgent, SharedState, ModelRouter, PlanStep } from '../packages/agent-core/src/index.js';

describe('Phase 3: Image Agent & Multi-Tier Vision', () => {
  it('classifies crop and stage using Bedrock Titan Multimodal kNN route', async () => {
    const agent = new ImageAgent();
    const router = new ModelRouter();
    const request = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      rawQuery: 'Crop stage check',
      language: 'en' as const,
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      consentGiven: true,
      attachments: { fieldPhotoUrl: 'https://example.com/paddy_field.jpg' }
    };
    const state = new SharedState('RUN-IMAGE-01', request);

    const step: PlanStep = {
      id: 'step-3',
      name: 'Crop & Stage Image Analysis',
      agent: 'image',
      inputs: { surveyNumber: '202/55', village: 'Sanganaperi' },
      dependsOn: [],
      criticality: 'critical',
      requiredOutputs: ['cropName', 'growthStage'],
      candidateModels: ['titan-multimodal-embed']
    };

    const result = await agent.run(state, step, router);
    expect(result.status).toBe('success');
    expect(result.data.cropName).toBeDefined();
    expect(result.data.growthStage).toBeDefined();
    expect(result.data.visualEvidence).toContain('Bedrock Titan');
  }, 15000);

  it('classifies crop and stage using escalated Gemini Flash VLM route', async () => {
    const agent = new ImageAgent();
    const router = new ModelRouter();
    const request = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      rawQuery: 'Crop disease check',
      language: 'en' as const,
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      consentGiven: true,
      attachments: { fieldPhotoUrl: 'https://example.com/paddy_field.jpg' }
    };
    const state = new SharedState('RUN-IMAGE-02', request);

    const step: PlanStep = {
      id: 'step-3',
      name: 'Crop & Stage Image Analysis',
      agent: 'image',
      inputs: { surveyNumber: '202/55', village: 'Sanganaperi' },
      dependsOn: [],
      criticality: 'critical',
      requiredOutputs: ['cropName', 'growthStage'],
      candidateModels: ['gemini-flash']
    };

    const result = await agent.run(state, step, router);
    expect(result.status).toBe('success');
    expect(result.data.cropName).toBe('Paddy');
    expect(result.data.visualEvidence).toContain('gemini-flash');
  }, 15000);
});