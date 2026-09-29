import { describe, it, expect } from 'vitest';
import {
  SharedState,
  PlannerAgent,
  ModelRouter,
  TraceRecorder,
  GeographyAgent,
  LandRecordAgent,
  ImageAgent,
  WeatherAgent,
  AgriKnowledgeAgent,
  VerifierAgent,
  BaseAgent
} from '../packages/agent-core/src/index.js';

describe('Phase 2: End-to-End Core Agent Execution', () => {
  it('executes a dynamic plan through SharedState, ModelRouter, and Agents with recorded trace', async () => {
    const request = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      rawQuery: 'What crop is planted in Survey Number 202/55 in Sanganaperi? Retrieve parcel, owner, crop stage, and fertilizer recommendations.',
      language: 'en' as const,
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      attachments: {
        fieldPhotoUrl: 'https://example.com/field.jpg'
      },
      consentGiven: true
    };

    const runId = 'RUN-TEST-001';
    const state = new SharedState(runId, request);
    const trace = new TraceRecorder(runId);
    const router = new ModelRouter();
    const planner = new PlannerAgent();

    // 1. Dynamic Plan Generation
    trace.emit('step_start', { step: 'planning' });
    const plan = await planner.createPlan(request);
    state.setPlan(plan);
    expect(plan.steps.length).toBeGreaterThanOrEqual(5);

    // Map agents by type
    const agentMap: Record<string, BaseAgent> = {
      geography: new GeographyAgent(),
      landRecord: new LandRecordAgent(),
      image: new ImageAgent(),
      weather: new WeatherAgent(),
      agriKnowledge: new AgriKnowledgeAgent(),
      verifier: new VerifierAgent()
    };

    // 2. Sequential Step Execution (simulating orchestrator)
    for (const step of plan.steps) {
      trace.emit('step_start', { name: step.name }, step.id, step.agent);

      const agent = agentMap[step.agent];
      expect(agent).toBeDefined();

      const stepResult = await agent.run(state, step, router);
      expect(stepResult.status).toBe('success');
      expect(stepResult.confidence).toBeGreaterThanOrEqual(0.8);

      trace.emit(
        'step_complete',
        { model: stepResult.chosenModel, cost: stepResult.estimatedCostUSD },
        step.id,
        step.agent
      );
    }

    // 3. Trace & State Verification
    const executedTrace = state.getExecutionTrace();
    expect(executedTrace).toHaveLength(plan.steps.length);

    // 4. Cost Comparison Verification
    const costComparison = state.computeCostComparison();
    expect(costComparison.actualCostUSD).toBeGreaterThan(0);
    expect(costComparison.benchmarkCostUSD).toBeGreaterThan(costComparison.actualCostUSD);
    expect(costComparison.savingsPct).toBeGreaterThan(30); // Routed execution should be significantly cheaper than all-Claude

    // 5. TraceRecorder Event Capture
    const events = trace.getEvents();
    expect(events.length).toBeGreaterThanOrEqual(plan.steps.length * 2);
  });
});