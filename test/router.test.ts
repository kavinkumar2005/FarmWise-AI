import { describe, it, expect } from 'vitest';
import { ModelRouter, PlanStep } from '../packages/agent-core/src/index.js';

describe('Phase 2: Model Router', () => {
  const router = new ModelRouter();

  it('scores models according to capability, confidence, latency, and cost', () => {
    const step: PlanStep = {
      id: 'step-1',
      name: 'Resolve Cadastral Parcel',
      agent: 'geography',
      inputs: {},
      dependsOn: [],
      criticality: 'normal',
      requiredOutputs: ['parcelGeometry'],
      candidateModels: ['ministral-8b', 'ministral-3b', 'claude-sonnet']
    };

    const score8b = router.scoreModel('ministral-8b', step);
    const scoreClaude = router.scoreModel('claude-sonnet', step);

    expect(score8b.score).toBeGreaterThan(-1);
    expect(scoreClaude.score).toBeGreaterThan(-1);
    expect(score8b.costNorm).toBeLessThan(scoreClaude.costNorm);
  });

  it('routes to cheapest capable model first for routine steps', () => {
    const step: PlanStep = {
      id: 'step-1',
      name: 'Resolve Cadastral Parcel',
      agent: 'geography',
      inputs: {},
      dependsOn: [],
      criticality: 'normal',
      requiredOutputs: ['parcelGeometry'],
      candidateModels: ['ministral-8b', 'claude-sonnet']
    };

    const decision = router.routeStep(step);
    expect(decision.chosenModel).toBe('ministral-8b');
    expect(decision.isFallback).toBe(false);
    expect(decision.reason).toContain('cost-effective');
  });

  it('routes to frontier model for critical verifier step', () => {
    const step: PlanStep = {
      id: 'step-6',
      name: 'Independent Deterministic & Critic Verification',
      agent: 'verifier',
      inputs: {},
      dependsOn: ['step-1'],
      criticality: 'critical',
      requiredOutputs: ['verificationChecks'],
      candidateModels: ['claude-sonnet', 'ministral-3b']
    };

    const decision = router.routeStep(step);
    expect(decision.chosenModel).toBe('claude-sonnet');
  });

  it('falls back when candidate circuit breaker is OPEN', () => {
    const cb = router.getCircuitBreaker('ministral-8b');
    cb?.trip();

    const step: PlanStep = {
      id: 'step-1',
      name: 'Draft Execution Plan',
      agent: 'planner',
      inputs: {},
      dependsOn: [],
      criticality: 'normal',
      requiredOutputs: ['plan'],
      candidateModels: ['ministral-8b']
    };

    const decision = router.routeStep(step);
    expect(decision.isFallback).toBe(true);
    expect(decision.chosenModel).toBe('claude-sonnet');

    cb?.reset();
  });
});