import { BaseAgent } from './base-agent.js';
import { PlanStep } from '../schemas/plan.schema.js';
import { SharedState } from '../state/shared-state.js';
import { RoutingDecision } from '../router/router.js';
import { SampleAdvisoryCorpus } from '../adapters/sample/sample-data-adapter.js';

export class AgriKnowledgeAgent extends BaseAgent {
  private advisoryCorpus = new SampleAdvisoryCorpus();

  constructor() {
    super('AgriKnowledgeAgent', 'agriKnowledge');
  }

  protected async executeStep(state: SharedState, step: PlanStep, modelDecision: RoutingDecision) {
    // 1. Read crop & stage from image step (or fallback to Paddy tillering)
    const imageOutput = state.getStepOutput<any>('step-3') || state.getStepOutput<any>('step-image');
    const cropName = imageOutput?.cropName || 'Paddy';
    const cropStage = imageOutput?.growthStage || 'tillering';

    // 2. Read weather alerts from weather step
    const weatherOutput = state.getStepOutput<any>('step-4') || state.getStepOutput<any>('step-weather');
    const alerts: string[] = weatherOutput?.agronomicAlerts || [];
    const hasRainAlert = alerts.some((a: string) => a.toLowerCase().includes('rain'));

    // 3. Search grounded advisory corpus
    const practices = await this.advisoryCorpus.searchPractices(cropName, cropStage);

    // 4. Synthesize weather-adapted recommendations
    const recommendations = practices.map(p => {
      let timing = p.timing;
      let description = p.description;

      if (p.category === 'fertilizer' && hasRainAlert) {
        timing = 'Post-rain window (delay application by 24-48 hours until soil moisture drains)';
        description = `${p.description} NOTE: Forecasted rainfall within 48h requires delaying nitrogen application to prevent leaching losses.`;
      }

      return {
        id: p.id,
        category: p.category,
        title: p.title,
        description,
        dosage: p.dosage,
        timing,
        sourceCitation: {
          sourceId: p.sourceId,
          title: p.sourceTitle,
          section: p.sourceSection,
          provenance: p.provenance
        }
      };
    });

    return {
      data: recommendations,
      confidence: 0.95,
      sources: practices.map(p => ({
        id: p.sourceId,
        name: p.sourceTitle,
        provenance: p.provenance
      })),
      tokens: { input: 280, output: 210 }
    };
  }
}