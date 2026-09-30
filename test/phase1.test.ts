import { describe, it, expect } from 'vitest';
import {
  FarmerRequestSchema,
  PlanSchema,
  StepResultSchema,
  FinalResultSchema,
  HealthResponseSchema,
  SampleParcelRepository,
  SampleLandRecordRepository,
  SampleAdvisoryCorpus,
  maskName
} from '../packages/agent-core/src/index.js';
import { handleHealth, handler } from '../services/api-gateway-handler/src/index.js';

describe('Phase 1: Foundation Schemas', () => {
  it('validates a valid farmer request', () => {
    const validRequest = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      farmerName: 'R. Krishnan',
      language: 'en',
      rawQuery: 'What crop is on Survey 202/55?',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      consentGiven: true
    };

    const parsed = FarmerRequestSchema.parse(validRequest);
    expect(parsed.surveyNumber).toBe('202/55');
    expect(parsed.language).toBe('en');
  });

  it('rejects invalid request lacking survey number or query', () => {
    const invalidRequest = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      district: 'Tenkasi'
    };
    expect(() => FarmerRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('validates a structured agent execution plan', () => {
    const validPlan = {
      planId: '123e4567-e89b-12d3-a456-426614174001',
      summary: 'Resolve parcel, analyze field photo, and get TNAU recommendations',
      steps: [
        {
          id: 'step-1',
          name: 'Resolve Survey Number & Locate Cadastral Parcel',
          agent: 'geography',
          inputs: { village: 'Sanganaperi', surveyNumber: '202/55' },
          dependsOn: [],
          criticality: 'critical',
          requiredOutputs: ['parcelGeometry', 'centroid'],
          candidateModels: ['ministral-8b']
        },
        {
          id: 'step-2',
          name: 'Verify Critical Results with Critic',
          agent: 'verifier',
          inputs: {},
          dependsOn: ['step-1'],
          criticality: 'critical',
          requiredOutputs: ['verificationStatus'],
          candidateModels: ['claude-sonnet']
        }
      ],
      missingInfo: [],
      estimatedCostUSD: 0.0012,
      draftedBy: 'mistral.ministral-8b-instruct'
    };

    const parsed = PlanSchema.parse(validPlan);
    expect(parsed.steps).toHaveLength(2);
    expect(parsed.steps[0].agent).toBe('geography');
  });
});

describe('Phase 1: Grounded Data Adapters & Privacy', () => {
  it('correctly masks farmer and owner names for privacy', () => {
    expect(maskName('R. Krishnan')).toBe('R. K****');
    expect(maskName('Muthusamy')).toBe('Mu****');
    expect(maskName('P. M. Subbiah')).toBe('P. M. S****');
  });

  it('queries parcels from sample repository with subdivision and normalization', async () => {
    const repo = new SampleParcelRepository();
    
    // Exact survey lookup
    const parcel1 = await repo.findBySurveyNumber('Keelathattaparai', '387');
    expect(parcel1).not.toBeNull();
    expect(parcel1?.surveyNumber).toBe('387');
    expect(parcel1?.provenance).toBe('FarmwiseAI-provided');

    // Normalized survey lookup (202-55 vs 202/55)
    const parcel2 = await repo.findBySurveyNumber('Sanganaperi', '202-55');
    expect(parcel2).not.toBeNull();
    expect(parcel2?.surveyNumber).toBe('202/55');
  });

  it('queries land records and validates crossCheck discrepancies', async () => {
    const repo = new SampleLandRecordRepository();
    const record = await repo.findBySurveyNumber('Sanganaperi', '202/55');
    expect(record).not.toBeNull();
    expect(record?.ownerNameMasked).toBe('R. K****');

    // Cross-check test: Extent difference > 5%
    const checkResult = repo.crossCheck({ ownerNameFull: 'R. Krishnan', extentAcres: 3.5 }, record!);
    expect(checkResult.ownerMatches).toBe(true);
    expect(checkResult.discrepancies.length).toBeGreaterThan(0);
    expect(checkResult.discrepancies[0]).toContain('Extent difference exceeds 5%');
  });

  it('retrieves grounded agronomic practices from TNAU advisory corpus', async () => {
    const corpus = new SampleAdvisoryCorpus();
    const practices = await corpus.searchPractices('Paddy', 'tillering');
    expect(practices.length).toBeGreaterThan(0);
    expect(practices[0].dosage).toContain('Neem-coated Urea');
    expect(practices[0].sourceTitle).toContain('TNAU Agritech Portal');
  });
});

describe('Phase 1: Health & API Gateway Handler', () => {
  it('returns healthy status conforming to HealthResponseSchema', async () => {
    const res = await handleHealth();
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    const parsed = HealthResponseSchema.parse(body);
    expect(parsed.status).toBe('healthy');
    expect(parsed.region).toBe('ap-south-1');
    expect(parsed.modelsConfigured).toBeGreaterThanOrEqual(7);
  });

  it('handles API Gateway proxy event routing to /health', async () => {
    const event = {
      rawPath: '/health',
      requestContext: { http: { method: 'GET' } }
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.region).toBe('ap-south-1');
  });

  it('returns 404 for unknown route', async () => {
    const event = {
      rawPath: '/unknown',
      requestContext: { http: { method: 'GET' } }
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(404);
  });
});
