import { FarmerRequest } from '../schemas/request.schema.js';
import { Plan, PlanStep } from '../schemas/plan.schema.js';
import { StepResult } from '../schemas/step-result.schema.js';
import costsConfig from '../../../../config/costs.config.json';

export class SharedState {
  public readonly runId: string;
  public readonly request: FarmerRequest;
  private plan?: Plan;
  private stepOutputs: Map<string, any> = new Map();
  private stepResults: StepResult[] = [];
  private metadata: Record<string, any> = {};

  constructor(runId: string, request: FarmerRequest) {
    this.runId = runId;
    this.request = request;
  }

  setPlan(plan: Plan): void {
    this.plan = plan;
  }

  getPlan(): Plan | undefined {
    return this.plan;
  }

  setStepOutput(stepId: string, output: any): void {
    this.stepOutputs.set(stepId, output);
  }

  getStepOutput<T = any>(stepId: string): T | undefined {
    return this.stepOutputs.get(stepId) as T;
  }

  getAllOutputs(): Record<string, any> {
    return Object.fromEntries(this.stepOutputs.entries());
  }

  recordStepResult(result: StepResult): void {
    this.stepResults.push(result);
  }

  getExecutionTrace(): StepResult[] {
    return [...this.stepResults];
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  getMetadata<T = any>(key: string): T | undefined {
    return this.metadata[key];
  }

  /**
   * Computes cumulative actual cost of routed steps vs what it would cost if all steps
   * were dispatched to the frontier benchmark model (claude-3-5-sonnet).
   */
  computeCostComparison(): {
    actualCostUSD: number;
    benchmarkCostUSD: number;
    savingsPct: number;
    totalTokens: { input: number; output: number };
  } {
    let actualCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalImages = 0;

    for (const step of this.stepResults) {
      actualCost += step.estimatedCostUSD || 0;
      totalInputTokens += step.tokens?.input || 0;
      totalOutputTokens += step.tokens?.output || 0;
      if (step.agent === 'image') {
        totalImages += 1;
      }
    }

    // Benchmark rates for claude-3-5-sonnet-20241022
    const benchmarkRates = costsConfig.rates['claude-3-5-sonnet-20241022'];
    const benchmarkTokenCost =
      (totalInputTokens / 1000) * benchmarkRates.inputPer1k +
      (totalOutputTokens / 1000) * benchmarkRates.outputPer1k;
    const benchmarkImageCost = totalImages * (benchmarkRates.perImage || 0.0048);
    const benchmarkCost = Number((benchmarkTokenCost + benchmarkImageCost).toFixed(6));

    const roundedActual = Number(actualCost.toFixed(6));
    const savingsPct = benchmarkCost > 0
      ? Number((((benchmarkCost - roundedActual) / benchmarkCost) * 100).toFixed(1))
      : 0;

    return {
      actualCostUSD: roundedActual,
      benchmarkCostUSD: benchmarkCost,
      savingsPct: Math.max(0, savingsPct),
      totalTokens: { input: totalInputTokens, output: totalOutputTokens }
    };
  }

  toSerializable(): Record<string, any> {
    return {
      runId: this.runId,
      request: this.request,
      plan: this.plan,
      stepOutputs: this.getAllOutputs(),
      routeTrace: this.stepResults,
      costComparison: this.computeCostComparison()
    };
  }
}