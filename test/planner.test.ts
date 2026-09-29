import { describe, it, expect } from 'vitest';
import { PlannerAgent } from '../packages/agent-core/src/index.js';

describe('Phase 2: Planner Agent', () => {
  const planner = new PlannerAgent();

  it('dynamically creates a full multi-agent plan for a comprehensive parcel query', async () => {
    const plan = await planner.createPlan({
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      rawQuery: 'What crop is on Survey 202/55 in Sanganaperi village and what fertilizer should I apply?',
      language: 'en',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      consentGiven: true,
      attachments: {}
    });

    expect(plan.steps.length).toBeGreaterThanOrEqual(4);
    expect(plan.missingInfo).toHaveLength(0);

    const agentSequence = plan.steps.map(s => s.agent);
    expect(agentSequence).toContain('geography');
    expect(agentSequence).toContain('landRecord');
    expect(agentSequence).toContain('weather');
    expect(agentSequence).toContain('verifier');
  });

  it('detects missing survey number and formulates a polite question instead of guessing', async () => {
    const plan = await planner.createPlan({
      requestId: '123e4567-e89b-12d3-a456-426614174001',
      rawQuery: 'நிலத்தின் பயிர் மற்றும் உரிமையாளர் விவரங்களை கூறவும்.',
      language: 'ta',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '',
      consentGiven: true,
      attachments: {}
    });

    expect(plan.steps).toHaveLength(0);
    expect(plan.missingInfo).toHaveLength(1);
    expect(plan.missingInfo[0]).toContain('சர்வே எண்');
  });
});