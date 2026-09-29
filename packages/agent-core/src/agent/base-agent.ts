import { AgentType } from '../schemas/plan.schema.js';
import { PlanStep } from '../schemas/plan.schema.js';
import { StepResult, StepResultSchema } from '../schemas/step-result.schema.js';
import { SharedState } from '../state/shared-state.js';
import { ModelRouter, RoutingDecision } from '../router/router.js';
import { Tool } from '../tools/tool-registry.js';
import thresholdsConfig from '../../../../config/thresholds.json';

export abstract class BaseAgent {
  public readonly name: string;
  public readonly type: AgentType;
  public readonly declaredTools: Tool[] = [];

  constructor(name: string, type: AgentType, tools: Tool[] = []) {
    this.name = name;
    this.type = type;
    this.declaredTools = tools;
  }

  /**
   * Internal agent business logic executed by subclasses.
   */
  protected abstract executeStep(
    state: SharedState,
    step: PlanStep,
    modelDecision: RoutingDecision
  ): Promise<{
    data: any;
    confidence: number;
    sources?: any[];
    tokens?: { input: number; output: number };
  }>;

  /**
   * Orchestrates routing, execution, latency timing, token accounting,
   * confidence gating, and escalation.
   */
  async run(state: SharedState, step: PlanStep, router: ModelRouter): Promise<StepResult> {
    const startTime = Date.now();
    let modelDecision = router.routeStep(step);
    let escalated = false;

    let resultData: any;
    let confidence = 0.9;
    let sources: any[] = [];
    let tokens = { input: 120, output: 80 };

    try {
      const execResult = await this.executeStep(state, step, modelDecision);
      resultData = execResult.data;
      confidence = execResult.confidence;
      sources = execResult.sources || [];
      if (execResult.tokens) tokens = execResult.tokens;

      // Check if confidence is below threshold and escalation is warranted
      const minConfidence = (thresholdsConfig.confidenceThresholds as any)[step.agent] || thresholdsConfig.confidenceThresholds.cropPrediction || 0.80;
      if (confidence < minConfidence && !modelDecision.isFallback) {
        escalated = true;
        const escalationDecision = router.escalate(
          step,
          modelDecision.chosenModel,
          `Confidence ${(confidence * 100).toFixed(0)}% was below required ${(minConfidence * 100).toFixed(0)}% threshold.`
        );

        // Retry with escalated model
        const escalatedExec = await this.executeStep(state, step, escalationDecision);
        resultData = escalatedExec.data;
        confidence = Math.max(confidence, escalatedExec.confidence);
        if (escalatedExec.sources) sources = escalatedExec.sources;
        if (escalatedExec.tokens) {
          tokens.input += escalatedExec.tokens.input;
          tokens.output += escalatedExec.tokens.output;
        }
        modelDecision = escalationDecision;
      }
    } catch (err: any) {
      console.error(`Error in agent ${this.name}:`, err);
      // Trip circuit breaker
      const cb = router.getCircuitBreaker(modelDecision.chosenModel);
      if (cb) cb.recordFailure();

      throw err;
    }

    const latencyMs = Date.now() - startTime;
    const cost = Number(((tokens.input / 1000) * 0.00015 + (tokens.output / 1000) * 0.0004).toFixed(6));

    const stepResult: StepResult = {
      stepId: step.id,
      agent: this.type,
      status: confidence >= 0.8 ? 'success' : 'warning',
      chosenModel: modelDecision.chosenModel,
      routingReason: modelDecision.reason,
      latencyMs,
      tokens,
      estimatedCostUSD: cost,
      confidence,
      data: resultData,
      sources,
      fallbackDetails: modelDecision.isFallback || escalated
        ? {
            triggered: true,
            originalModel: modelDecision.originalModel,
            reason: modelDecision.reason
          }
        : undefined,
      reviewFlags: confidence < 0.8 ? ['Low confidence output flag for review'] : []
    };

    // Save to shared state
    state.setStepOutput(step.id, resultData);
    state.recordStepResult(stepResult);

    return StepResultSchema.parse(stepResult);
  }
}