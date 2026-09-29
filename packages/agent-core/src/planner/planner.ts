import { randomUUID } from 'crypto';
import { FarmerRequest } from '../schemas/request.schema.js';
import { Plan, PlanStep, PlanSchema } from '../schemas/plan.schema.js';

export class PlannerAgent {
  /**
   * Dynamically constructs an execution plan based on the user's intent, query,
   * provided inputs, and attachments.
   */
  async createPlan(request: FarmerRequest): Promise<Plan> {
    const query = request.rawQuery.toLowerCase();
    const steps: PlanStep[] = [];
    const missingInfo: string[] = [];

    // Check for essential inputs when a parcel-specific query is made
    const isParcelSpecific =
      query.includes('parcel') ||
      query.includes('survey') ||
      query.includes('நிலம்') ||
      query.includes('சர்வே') ||
      query.includes('crop') ||
      query.includes('பயிர்');

    if (isParcelSpecific && (!request.surveyNumber || request.surveyNumber.trim() === '')) {
      const question =
        request.language === 'ta'
          ? 'உங்கள் நிலத்தின் சர்வே எண் மற்றும் கிராமத்தின் பெயரை குறிப்பிடவும்.'
          : 'Please provide your parcel survey number and village name to proceed with the analysis.';
      missingInfo.push(question);
    }

    if (missingInfo.length > 0) {
      return PlanSchema.parse({
        planId: randomUUID(),
        summary: 'Request requires additional information from the farmer before planning execution.',
        steps: [],
        missingInfo,
        estimatedCostUSD: 0.0001,
        draftedBy: 'mistral.ministral-8b-instruct'
      });
    }

    // Determine request scope dynamically
    const hasPhoto = !!request.attachments?.fieldPhotoUrl || !!request.attachments?.fieldPhotoKey || query.includes('photo') || query.includes('crop') || query.includes('படம்');
    const hasDocument = !!request.attachments?.landDocUrl || !!request.attachments?.landDocKey || query.includes('document') || query.includes('patta') || query.includes('பத்திரம்');
    const asksWeatherOrSpray = query.includes('weather') || query.includes('rain') || query.includes('spray') || query.includes('மழை') || query.includes('வானிலை');
    const asksAdvisory = query.includes('fertilizer') || query.includes('urea') || query.includes('spray') || query.includes('உரம்') || query.includes('நோய்') || query.includes('disease') || query.includes('recommend');

    let stepCounter = 1;

    // Step 1: Geography Agent (Resolves survey number & boundary)
    const geoStepId = `step-${stepCounter++}`;
    steps.push({
      id: geoStepId,
      name: 'Resolve Survey Number & Locate Cadastral Parcel',
      agent: 'geography',
      inputs: {
        district: request.district,
        taluk: request.taluk,
        village: request.village,
        surveyNumber: request.surveyNumber,
        subdivision: request.subdivision,
        coordinates: request.coordinates
      },
      dependsOn: [],
      criticality: 'critical',
      requiredOutputs: ['parcelGeometry', 'centroid', 'areaAcres'],
      candidateModels: ['ministral-8b', 'ministral-3b']
    });

    // Step 2: Land Record Agent (Fetches Patta / Land Record & cross-checks if doc uploaded)
    const landStepId = `step-${stepCounter++}`;
    steps.push({
      id: landStepId,
      name: hasDocument ? 'Extract Land Document & Cross-Check Registry' : 'Retrieve Registry Land Record & Ownership',
      agent: 'landRecord',
      inputs: {
        district: request.district,
        taluk: request.taluk,
        village: request.village,
        surveyNumber: request.surveyNumber,
        landDocUrl: request.attachments?.landDocUrl
      },
      dependsOn: [geoStepId],
      criticality: 'normal',
      requiredOutputs: ['landRecord', 'classification', 'ownerNameMasked'],
      candidateModels: hasDocument ? ['gemini-flash', 'ministral-8b'] : ['ministral-8b', 'ministral-3b']
    });

    // Step 3: Image Analysis Agent (if photo present or crop prediction requested)
    let imageStepId: string | null = null;
    if (hasPhoto) {
      imageStepId = `step-${stepCounter++}`;
      steps.push({
        id: imageStepId,
        name: 'Multimodal Crop & Growth Stage Analysis',
        agent: 'image',
        inputs: {
          photoUrl: request.attachments?.fieldPhotoUrl,
          village: request.village,
          surveyNumber: request.surveyNumber
        },
        dependsOn: [geoStepId],
        criticality: 'critical',
        requiredOutputs: ['cropName', 'growthStage', 'condition', 'confidence'],
        candidateModels: ['titan-multimodal-embed', 'gemini-flash', 'gemini-pro']
      });
    }

    // Step 4: Weather Agent (Always useful for field advice and spray windows)
    const weatherStepId = `step-${stepCounter++}`;
    steps.push({
      id: weatherStepId,
      name: 'Fetch Localized 7-Day Weather & Agronomic Risk Window',
      agent: 'weather',
      inputs: {
        district: request.district,
        village: request.village
      },
      dependsOn: [geoStepId],
      criticality: 'normal',
      requiredOutputs: ['currentTempC', 'forecast7Day', 'agronomicAlerts'],
      candidateModels: ['ministral-8b', 'ministral-3b']
    });

    // Step 5: Agricultural Knowledge Agent (TNAU grounded RAG recommendations)
    if (asksAdvisory || hasPhoto || !asksWeatherOrSpray) {
      const knowledgeStepId = `step-${stepCounter++}`;
      const dependsOn = [geoStepId, weatherStepId];
      if (imageStepId) dependsOn.push(imageStepId);

      steps.push({
        id: knowledgeStepId,
        name: 'Retrieve Stage-Specific Agronomic Practices from Verified Corpus',
        agent: 'agriKnowledge',
        inputs: {
          soilType: request.attachments?.soilType,
          sowingDate: request.attachments?.sowingDate
        },
        dependsOn,
        criticality: 'normal',
        requiredOutputs: ['recommendations', 'dosages', 'citations'],
        candidateModels: ['titan-text-embed-v2', 'ministral-8b']
      });
    }

    // Step 6: Verifier Agent (Deterministic & Critic verification across all critical outputs)
    const verifierStepId = `step-${stepCounter++}`;
    const allPreviousSteps = steps.map(s => s.id);
    steps.push({
      id: verifierStepId,
      name: 'Independent Deterministic & Critic Verification',
      agent: 'verifier',
      inputs: {},
      dependsOn: allPreviousSteps,
      criticality: 'critical',
      requiredOutputs: ['overallStatus', 'verificationChecks'],
      candidateModels: ['claude-sonnet', 'gemini-pro']
    });

    const isComplex = steps.length > 5 || hasDocument;
    const draftedBy = isComplex ? 'claude-3-5-sonnet-20241022' : 'mistral.ministral-8b-instruct';

    return PlanSchema.parse({
      planId: randomUUID(),
      summary: `Dynamic ${steps.length}-step execution plan synthesized for ${request.district} / ${request.village} (Survey: ${request.surveyNumber}).`,
      steps,
      missingInfo: [],
      estimatedCostUSD: Number((steps.length * 0.0003).toFixed(5)),
      draftedBy
    });
  }
}