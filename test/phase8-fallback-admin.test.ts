import { describe, it, expect } from 'vitest';
import {
  CircuitBreaker,
  ModelRouter,
  CostAnalyticsCalculator,
  EvaluationHarness,
  PlanStep
} from '../packages/agent-core/src/index.js';

describe('Phase 8: Fault Injection, Circuit Breakers, Cost Analytics & Task 1 Evaluation', () => {
  describe('1. Dynamic Circuit Breaker State Machine & Fault Injection', () => {
    it('initializes in CLOSED state with valid telemetry', () => {
      const cb = new CircuitBreaker('test-bedrock-ministral', { failureThreshold: 3 });
      expect(cb.getState()).toBe('CLOSED');
      expect(cb.canExecute()).toBe(true);

      const telemetry = cb.getTelemetry();
      expect(telemetry.name).toBe('test-bedrock-ministral');
      expect(telemetry.state).toBe('CLOSED');
      expect(telemetry.failureCount).toBe(0);
      expect(telemetry.isSimulatedFailure).toBe(false);
    });

    it('trips to OPEN state when failure threshold is exceeded', () => {
      const cb = new CircuitBreaker('test-open-meteo', { failureThreshold: 2 });
      cb.recordFailure();
      expect(cb.getState()).toBe('CLOSED');
      expect(cb.canExecute()).toBe(true);

      cb.recordFailure();
      expect(cb.getState()).toBe('OPEN');
      expect(cb.canExecute()).toBe(false);
    });

    it('supports interactive fault injection via simulateFailure()', () => {
      const cb = new CircuitBreaker('test-gemini-flash');
      expect(cb.getState()).toBe('CLOSED');

      // Inject simulated outage
      cb.simulateFailure(true);
      expect(cb.getState()).toBe('OPEN');
      expect(cb.canExecute()).toBe(false);
      expect(cb.getTelemetry().isSimulatedFailure).toBe(true);

      // Restore service
      cb.simulateFailure(false);
      expect(cb.getState()).toBe('CLOSED');
      expect(cb.canExecute()).toBe(true);
      expect(cb.getTelemetry().isSimulatedFailure).toBe(false);
    });

    it('transitions from OPEN to HALF_OPEN after resetTimeoutMs and recovers on success', () => {
      const cb = new CircuitBreaker('test-half-open', {
        failureThreshold: 1,
        resetTimeoutMs: 50,
        halfOpenMaxAttempts: 2
      });

      cb.recordFailure();
      expect(cb.getState()).toBe('OPEN');

      // Wait for reset timeout
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cb.getState()).toBe('HALF_OPEN');
          expect(cb.canExecute()).toBe(true);

          // First probe attempt
          cb.recordSuccess();
          expect(cb.getState()).toBe('HALF_OPEN');

          // Second probe attempt recovers circuit
          cb.recordSuccess();
          expect(cb.getState()).toBe('CLOSED');
          resolve();
        }, 70);
      });
    });
  });

  describe('2. ModelRouter Dynamic Failover & Resilient Fallback', () => {
    const router = new ModelRouter();

    it('routes plan step to open-weight ministral-8b under normal conditions', () => {
      const step: PlanStep = {
        id: 'step-plan',
        name: 'Draft Execution Plan',
        agent: 'planner',
        action: 'draftPlan',
        inputs: {},
        expectedOutputs: ['plan'],
        candidateModels: ['ministral-8b', 'ministral-3b', 'claude-sonnet'],
        criticality: 'routine'
      };

      const decision = router.routeStep(step);
      expect(decision.chosenModel).toBe('ministral-8b');
      expect(decision.isFallback).toBe(false);
    });

    it('gracefully fails over when primary model circuit breaker is tripped', () => {
      const step: PlanStep = {
        id: 'step-plan-failover',
        name: 'Draft Execution Plan Under Outage',
        agent: 'planner',
        action: 'draftPlan',
        inputs: {},
        expectedOutputs: ['plan'],
        candidateModels: ['ministral-8b', 'ministral-3b', 'claude-sonnet'],
        criticality: 'routine'
      };

      // Simulate Bedrock Ministral-8b outage
      router.simulateFailure('ministral-8b', true);

      const decision = router.routeStep(step);
      expect(decision.chosenModel).not.toBe('ministral-8b');
      expect(['ministral-3b', 'claude-sonnet']).toContain(decision.chosenModel);

      // Restore Ministral
      router.simulateFailure('ministral-8b', false);
      const restoredDecision = router.routeStep(step);
      expect(restoredDecision.chosenModel).toBe('ministral-8b');
    });

    it('escalates to frontier model with isFallback=true when all primary candidates are OPEN', () => {
      const step: PlanStep = {
        id: 'step-critical',
        name: 'Emergency Advisory Generation',
        agent: 'agri-knowledge',
        action: 'synthesize',
        inputs: {},
        expectedOutputs: ['advisory'],
        candidateModels: ['ministral-8b'],
        criticality: 'routine'
      };

      // Force primary candidate offline
      router.simulateFailure('ministral-8b', true);

      const decision = router.routeStep(step);
      expect(decision.isFallback).toBe(true);
      expect(decision.chosenModel).toBe('claude-sonnet');
      expect(decision.reason).toContain('circuit breaker');

      // Reset
      router.resetAllCircuitBreakers();
    });

    it('exports complete circuit breaker telemetry for all registered models', () => {
      const telemetries = router.getAllCircuitBreakersTelemetry();
      expect(telemetries.length).toBeGreaterThanOrEqual(4);

      const modelNames = telemetries.map(t => t.name);
      expect(modelNames).toContain('ministral-8b');
      expect(modelNames).toContain('gemini-flash');
      expect(modelNames).toContain('claude-sonnet');
    });
  });

  describe('3. Cost & Latency Analytics Engine', () => {
    it('quantifies >= 70% cost savings for multi-model architecture vs monolithic baseline', () => {
      const analytics = CostAnalyticsCalculator.calculateComparison(10000);

      expect(analytics.savings.costSavingsPct).toBeGreaterThanOrEqual(70);
      expect(analytics.monolithic.costPerRunUSD).toBeGreaterThan(analytics.multiModel.costPerRunUSD * 3);
      expect(analytics.savings.costSavingsUSDPer10kRuns).toBeGreaterThan(100);
    });

    it('quantifies >= 40% latency reduction via parallel routing and fast open-weight models', () => {
      const analytics = CostAnalyticsCalculator.calculateComparison(10000);

      expect(analytics.savings.latencyReductionPct).toBeGreaterThanOrEqual(40);
      expect(analytics.multiModel.avgLatencyMs).toBeLessThan(analytics.monolithic.avgLatencyMs);
    });

    it('verifies strict compliance with the USD 100 AWS event budget', () => {
      const analytics = CostAnalyticsCalculator.calculateComparison(10000);

      // At 10,000 queries per month, total cost is ~$35-$45, well below the USD 100 limit
      expect(analytics.multiModel.monthlyCostUSD).toBeLessThan(100);
      expect(analytics.savings.awsBudgetUtilizationPct).toBeLessThan(100);
    });
  });

  describe('4. Task 1 Evaluation Benchmark Suite', () => {
    it('executes evaluation harness and produces comprehensive benchmark scorecard', async () => {
      const harness = new EvaluationHarness();
      const report = await harness.runBenchmark();

      expect(report.totalTests).toBe(7);
      expect(report.passedTests).toBe(7);
      expect(report.groundednessScorePct).toBeGreaterThanOrEqual(90);
      expect(report.hallucinationPreventionPct).toBe(100);
      expect(report.costSavingsPct).toBeGreaterThanOrEqual(70);
    });
  });
});
