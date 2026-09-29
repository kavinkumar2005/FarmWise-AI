import { FarmerRequest, FarmerRequestSchema } from '../schemas/request.schema.js';
import { Plan } from '../schemas/plan.schema.js';
import { FinalResult } from '../schemas/final-result.schema.js';
import { SharedState } from '../state/shared-state.js';
import { ModelRouter } from '../router/router.js';
import { PlannerAgent } from '../planner/planner.js';
import { BaseAgent } from '../agent/base-agent.js';
import { GeographyAgent } from '../agent/geography-agent.js';
import { LandRecordAgent } from '../agent/land-record-agent.js';
import { ImageAgent } from '../agent/image-agent.js';
import { WeatherAgent } from '../agent/weather-agent.js';
import { AgriKnowledgeAgent } from '../agent/agri-knowledge-agent.js';
import { VerifierAgent } from '../agent/verifier-agent.js';
import { ResultIntegrator } from './result-integrator.js';

export interface PipelineProgressEvent {
  stepIndex: number;
  totalSteps: number;
  stepId: string;
  agent: string;
  status: 'started' | 'completed' | 'escalated' | 'failed';
  modelUsed?: string;
  latencyMs?: number;
  costUsd?: number;
  data?: any;
}

export interface PipelineExecutionResult {
  status: 'COMPLETED' | 'NEEDS_CLARIFICATION' | 'FAILED';
  runId: string;
  plan: Plan;
  trace: any[];
  finalResult?: FinalResult;
  clarifyingQuestions?: string[];
  error?: string;
}

export class OrchestrationPipeline {
  private router: ModelRouter;
  private planner: PlannerAgent;
  private agentMap: Record<string, BaseAgent>;

  constructor() {
    this.router = new ModelRouter();
    this.planner = new PlannerAgent();
    this.agentMap = {
      geography: new GeographyAgent(),
      landRecord: new LandRecordAgent(),
      image: new ImageAgent(),
      weather: new WeatherAgent(),
      agriKnowledge: new AgriKnowledgeAgent(),
      verifier: new VerifierAgent()
    };
  }

  public async execute(
    rawRequest: FarmerRequest,
    onProgress?: (event: PipelineProgressEvent) => void
  ): Promise<PipelineExecutionResult> {
    const request = FarmerRequestSchema.parse(rawRequest);
    const runId = `RUN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const state = new SharedState(runId, request);

    // Step 1: Dynamic Planning
    const plan = await this.planner.createPlan(request);
    state.setPlan(plan);

    // Check for missing required information (e.g. missing survey number/village)
    if (plan.missingInfo && plan.missingInfo.length > 0 && plan.steps.length === 0) {
      return {
        status: 'NEEDS_CLARIFICATION',
        runId,
        plan,
        trace: state.getExecutionTrace(),
        clarifyingQuestions: plan.missingInfo
      };
    }

    // Step 2: Sequential execution across specialized agents
    let stepIndex = 0;
    for (const step of plan.steps) {
      stepIndex++;
      const agent = this.agentMap[step.agent];
      if (!agent) {
        throw new Error(`Unregistered agent type: ${step.agent} for step ${step.id}`);
      }

      onProgress?.({
        stepIndex,
        totalSteps: plan.steps.length,
        stepId: step.id,
        agent: step.agent,
        status: 'started'
      });

      const stepResult = await agent.run(state, step, this.router);

      onProgress?.({
        stepIndex,
        totalSteps: plan.steps.length,
        stepId: step.id,
        agent: step.agent,
        status: stepResult.status === 'success' ? 'completed' : 'failed',
        modelUsed: stepResult.chosenModel,
        latencyMs: stepResult.latencyMs,
        costUsd: stepResult.estimatedCostUSD,
        data: stepResult.data
      });
    }

    // Step 3: Result Integration
    const finalResult = ResultIntegrator.integrate(state);

    return {
      status: 'COMPLETED',
      runId,
      plan,
      trace: state.getExecutionTrace(),
      finalResult
    };
  }
}
