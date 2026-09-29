import { PlanStep } from '../schemas/plan.schema.js';
import { CircuitBreaker, CircuitBreakerTelemetry } from './circuit-breaker.js';
import modelsConfig from '../../../../config/models.config.json';
import thresholdsConfig from '../../../../config/thresholds.json';

export interface CandidateScore {
  model: string;
  score: number;
  capabilityFit: number;
  expectedConfidence: number;
  latencyNorm: number;
  costNorm: number;
  isAvailable: boolean;
}

export interface RoutingDecision {
  chosenModel: string;
  chosenModelId: string;
  candidateScores: CandidateScore[];
  reason: string;
  isFallback: boolean;
  originalModel?: string;
}

export class ModelRouter {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private readonly weights: {
    capabilityFit: number;
    expectedConfidence: number;
    latencyNorm: number;
    costNorm: number;
  };

  constructor() {
    this.weights = modelsConfig.routerWeights || {
      capabilityFit: 0.35,
      expectedConfidence: 0.35,
      latencyNorm: 0.15,
      costNorm: 0.15
    };

    // Initialize a circuit breaker for each registered model
    for (const modelKey of Object.keys(modelsConfig.models)) {
      this.circuitBreakers.set(
        modelKey,
        new CircuitBreaker(modelKey, {
          failureThreshold: thresholdsConfig.circuitBreaker.failureThreshold,
          resetTimeoutMs: thresholdsConfig.circuitBreaker.resetTimeoutMs
        })
      );
    }
  }

  getCircuitBreaker(modelKey: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(modelKey);
  }

  /**
   * Scores a model for a specific step based on capability, expected confidence, latency, and cost.
   * score = w1*capabilityFit + w2*expectedConfidence - w3*latencyNorm - w4*costNorm
   */
  scoreModel(modelKey: string, step: PlanStep): CandidateScore {
    const model = (modelsConfig.models as Record<string, any>)[modelKey];
    const cb = this.circuitBreakers.get(modelKey);
    const isAvailable = cb ? cb.canExecute() : true;

    if (!model) {
      return {
        model: modelKey,
        score: -999,
        capabilityFit: 0,
        expectedConfidence: 0,
        latencyNorm: 1,
        costNorm: 1,
        isAvailable: false
      };
    }

    // 1. Capability Fit
    let capabilityFit = 0.5;
    if (step.agent === 'verifier') {
      capabilityFit = model.capabilities.includes('verification') || model.capabilities.includes('critical-evaluation') ? 1.0 : 0.2;
    } else if (step.agent === 'image') {
      capabilityFit = model.capabilities.includes('vision') || model.capabilities.includes('image-embedding') ? 1.0 : 0.1;
    } else if (step.agent === 'planner') {
      capabilityFit = model.capabilities.includes('planning-draft') || model.capabilities.includes('critical-evaluation') ? 0.95 : 0.4;
    } else if (model.capabilities.includes('json') || model.capabilities.includes('text')) {
      capabilityFit = 0.85;
    }

    // 2. Expected Confidence
    let expectedConfidence = 0.85;
    if (model.tier === 'frontier') expectedConfidence = 0.98;
    else if (model.tier === 'advanced-multimodal') expectedConfidence = 0.92;
    else if (model.tier === 'fast-multimodal') expectedConfidence = 0.88;
    else if (model.tier === 'small') expectedConfidence = 0.82;
    else if (model.tier === 'nano') expectedConfidence = 0.75;

    // Adjust for step criticality: critical steps expect high confidence
    if (step.criticality === 'critical' && model.tier === 'small') {
      expectedConfidence -= 0.10;
    }

    // 3. Normalized Latency [0, 1]
    const latencyNorm = Math.min(1.0, (model.avgLatencyMs || 1000) / 3000);

    // 4. Normalized Cost [0, 1]
    const costPer1k = model.costPer1kInputTokens || 0.0001;
    const costNorm = Math.min(1.0, costPer1k / 0.005);

    // Calculate composite score
    const score = Number(
      (
        this.weights.capabilityFit * capabilityFit +
        this.weights.expectedConfidence * expectedConfidence -
        this.weights.latencyNorm * latencyNorm -
        this.weights.costNorm * costNorm
      ).toFixed(4)
    );

    return {
      model: modelKey,
      score,
      capabilityFit,
      expectedConfidence,
      latencyNorm,
      costNorm,
      isAvailable
    };
  }

  /**
   * Evaluates all candidate models for the step and selects the cheapest capable model first.
   */
  routeStep(step: PlanStep): RoutingDecision {
    const candidates = step.candidateModels && step.candidateModels.length > 0
      ? step.candidateModels
      : Object.keys(modelsConfig.models);

    const scoredCandidates: CandidateScore[] = candidates.map(c => this.scoreModel(c, step));

    // Sort available candidates by score descending
    const available = scoredCandidates
      .filter(c => c.isAvailable)
      .sort((a, b) => b.score - a.score);

    if (available.length > 0) {
      const best = available[0];
      const modelMeta = (modelsConfig.models as Record<string, any>)[best.model];
      const reason = `Selected ${best.model} (${modelMeta?.type || 'model'}) as most cost-effective with sufficient confidence (${(best.expectedConfidence * 100).toFixed(0)}%) for ${step.name}.`;

      return {
        chosenModel: best.model,
        chosenModelId: modelMeta?.id || best.model,
        candidateScores: scoredCandidates,
        reason,
        isFallback: false
      };
    }

    // If all candidates in circuit breaker are OPEN, fallback to Claude or Gemini Pro
    const fallbackModelKey = 'claude-sonnet';
    const fallbackMeta = (modelsConfig.models as Record<string, any>)[fallbackModelKey];

    return {
      chosenModel: fallbackModelKey,
      chosenModelId: fallbackMeta?.id || fallbackModelKey,
      candidateScores: scoredCandidates,
      reason: `Primary candidates (${candidates.join(', ')}) unavailable due to circuit breaker trip; escalated to fallback frontier model.`,
      isFallback: true,
      originalModel: candidates[0]
    };
  }

  /**
   * Escalates step to a higher-tier model when confidence is below threshold or verification fails.
   */
  escalate(step: PlanStep, currentModel: string, reason: string): RoutingDecision {
    const candidates = ['gemini-pro', 'claude-sonnet'];
    const targetModel = currentModel === 'gemini-pro' ? 'claude-sonnet' : candidates[0];
    const modelMeta = (modelsConfig.models as Record<string, any>)[targetModel];

    return {
      chosenModel: targetModel,
      chosenModelId: modelMeta?.id || targetModel,
      candidateScores: [],
      reason: `Escalated from ${currentModel} to ${targetModel}: ${reason}`,
      isFallback: true,
      originalModel: currentModel
    };
  }

  getAllCircuitBreakersTelemetry(): CircuitBreakerTelemetry[] {
    const list: CircuitBreakerTelemetry[] = [];
    for (const cb of this.circuitBreakers.values()) {
      list.push(cb.getTelemetry());
    }
    return list;
  }

  simulateFailure(modelKey: string, enabled: boolean = true): void {
    const cb = this.circuitBreakers.get(modelKey);
    if (cb) {
      cb.simulateFailure(enabled);
    }
  }

  resetAllCircuitBreakers(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.reset();
    }
  }
}