import { BaseAgent } from './base-agent.js';
import { PlanStep } from '../schemas/plan.schema.js';
import { SharedState } from '../state/shared-state.js';
import { RoutingDecision } from '../router/router.js';
import { SampleLandRecordRepository } from '../adapters/sample/sample-data-adapter.js';
import { normalizeTamilNumerals } from '../geo/turf-utils.js';

export class LandRecordAgent extends BaseAgent {
  private landRepo = new SampleLandRecordRepository();

  constructor() {
    super('LandRecordAgent', 'landRecord');
  }

  protected async executeStep(state: SharedState, step: PlanStep, modelDecision: RoutingDecision) {
    const rawSurvey = step.inputs.surveyNumber || '202/55';
    const village = step.inputs.village || 'Sanganaperi';
    const cleanSurvey = normalizeTamilNumerals(rawSurvey);

    // 1. Fetch registry record
    const record = await this.landRepo.findBySurveyNumber(village, cleanSurvey);

    const baseRecord = record || {
      recordId: 'PATTA-TENK-202-55',
      district: step.inputs.district || 'Tenkasi',
      taluk: step.inputs.taluk || 'Sivagiri',
      village,
      surveyNumber: cleanSurvey,
      subdivision: 'A',
      ownerNameMasked: 'R. K****',
      ownerNameFull: 'R. Krishnan',
      classification: 'Patta' as const,
      wetOrDry: 'Nanjai' as const,
      extentAcres: 2.10,
      pattaNumber: '554',
      provenance: 'Sample data' as const
    };

    // 2. Cross-check document if landDocUrl was provided
    let crossCheckResult: { ownerMatches: boolean; extentDifferencePct: number; discrepancies: string[] } | null = null;
    if (step.inputs.landDocUrl) {
      // Multimodal document extraction simulation (Gemini OCR)
      const extractedDoc = {
        ownerNameFull: baseRecord.ownerNameFull,
        extentAcres: baseRecord.extentAcres, // Exact match or test variance
        surveyNumber: cleanSurvey
      };
      crossCheckResult = this.landRepo.crossCheck(extractedDoc, baseRecord);
    }

    const data = {
      recordId: baseRecord.recordId,
      district: baseRecord.district,
      taluk: baseRecord.taluk,
      village: baseRecord.village,
      surveyNumber: baseRecord.surveyNumber,
      subdivision: baseRecord.subdivision,
      ownerNameMasked: baseRecord.ownerNameMasked,
      ownerNameFull: baseRecord.ownerNameFull, // Kept in memory, rendered only in officer view
      classification: baseRecord.classification,
      wetOrDry: baseRecord.wetOrDry,
      extentAcres: baseRecord.extentAcres,
      pattaNumber: baseRecord.pattaNumber,
      crossCheck: crossCheckResult,
      provenance: baseRecord.provenance
    };

    const confidence = crossCheckResult && crossCheckResult.discrepancies.length > 0 ? 0.85 : 0.96;

    return {
      data,
      confidence,
      sources: [{
        id: baseRecord.recordId,
        name: 'Land Administration Registry (e-Adangal / Patta Chitta)',
        provenance: baseRecord.provenance
      }],
      tokens: { input: 120, output: 95 }
    };
  }
}