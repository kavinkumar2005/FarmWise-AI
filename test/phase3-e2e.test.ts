import { describe, it, expect } from 'vitest';
import {
  SharedState,
  PlannerAgent,
  ModelRouter,
  GeographyAgent,
  LandRecordAgent,
  ImageAgent,
  WeatherAgent,
  AgriKnowledgeAgent,
  VerifierAgent,
  ResultIntegrator,
  FinalResultSchema,
  BaseAgent
} from '../packages/agent-core/src/index.js';

describe('Phase 3: End-to-End Multi-Model & Specialized Agent Integration', () => {
  const router = new ModelRouter();
  const planner = new PlannerAgent();

  const agentMap: Record<string, BaseAgent> = {
    geography: new GeographyAgent(),
    landRecord: new LandRecordAgent(),
    image: new ImageAgent(),
    weather: new WeatherAgent(),
    agriKnowledge: new AgriKnowledgeAgent(),
    verifier: new VerifierAgent()
  };

  it('executes Query 1 (Survey 202/55 Paddy in Sanganaperi) and produces verified FinalResult', async () => {
    const request = {
      requestId: '123e4567-e89b-12d3-a456-426614174001',
      farmerName: 'R. Krishnan',
      rawQuery: 'What crop is planted in Survey Number 202/55 in Sanganaperi village? Identify the parcel and its owner, retrieve the field photograph captured for that parcel, predict the crop and its current growth stage, and recommend fertilizer practices.',
      language: 'en' as const,
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      attachments: {
        fieldPhotoUrl: 'Datasets/images/images/sample_paddy_tillering.jpg'
      },
      consentGiven: true
    };

    const runId = 'RUN-E2E-001';
    const state = new SharedState(runId, request);

    // 1. Dynamic Plan
    const plan = await planner.createPlan(request);
    state.setPlan(plan);
    expect(plan.steps.length).toBeGreaterThanOrEqual(5);

    // 2. Step-by-Step Agent Execution
    for (const step of plan.steps) {
      const agent = agentMap[step.agent];
      expect(agent).toBeDefined();
      const stepResult = await agent.run(state, step, router);
      expect(stepResult.status).toBe('success');
      expect(stepResult.confidence).toBeGreaterThan(0.7);
    }

    // 3. Result Integration
    const finalResult = ResultIntegrator.integrate(state);
    const parsed = FinalResultSchema.parse(finalResult);

    expect(parsed.status).toBe('COMPLETED');
    expect(parsed.parcel.surveyNumber).toBe('202/55');
    expect(parsed.landRecord.ownerNameMasked).toBe('R. K****');
    expect(parsed.cropAssessment.cropName).toBe('Paddy');
    expect(parsed.cropAssessment.growthStage).toBe('tillering');
    expect(parsed.recommendations.length).toBeGreaterThan(0);
    expect(parsed.recommendations[0].sourceCitation.provenance).toBe('Public source');
    expect(parsed.weather.forecast7Day.length).toBeGreaterThanOrEqual(3);
    expect(parsed.verification.overallStatus).toBe('VERIFIED');
    expect(parsed.costSummary.savingsPct).toBeGreaterThan(30);
  });

  it('executes Query 2 (Second, distinct unseen request: Survey 387 in Keelathattaparai) and produces verified FinalResult', async () => {
    const request = {
      requestId: '123e4567-e89b-12d3-a456-426614174002',
      farmerName: 'M. Subbiah',
      rawQuery: 'Identify parcel boundaries and owner for Survey 387 in Keelathattaparai, Thoothukudi.',
      language: 'en' as const,
      district: 'Thoothukudi',
      taluk: 'Thoothukudi',
      village: 'Keelathattaparai',
      surveyNumber: '387',
      attachments: {},
      consentGiven: true
    };

    const runId = 'RUN-E2E-002';
    const state = new SharedState(runId, request);

    // 1. Dynamic Plan
    const plan = await planner.createPlan(request);
    state.setPlan(plan);

    // 2. Step-by-Step Agent Execution
    for (const step of plan.steps) {
      const agent = agentMap[step.agent];
      const stepResult = await agent.run(state, step, router);
      expect(stepResult.status).toBe('success');
    }

    // 3. Result Integration
    const finalResult = ResultIntegrator.integrate(state);
    const parsed = FinalResultSchema.parse(finalResult);

    expect(parsed.parcel.surveyNumber).toBe('387');
    expect(parsed.parcel.village).toBe('Keelathattaparai');
    expect(parsed.landRecord.ownerNameMasked).toBe('M. S****');
    expect(parsed.verification.checks.length).toBeGreaterThanOrEqual(7);
  });
});