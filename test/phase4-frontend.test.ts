import { describe, it, expect } from 'vitest';
import { OrchestrationPipeline, FarmerRequest } from '../packages/agent-core/src/index.js';
import { handler } from '../services/api-gateway-handler/src/index.js';

describe('Phase 4: Frontend Shell, Wizard & Orchestration Engine', () => {
  const pipeline = new OrchestrationPipeline();

  it('executes full pipeline with progress callbacks', async () => {
    const request: FarmerRequest = {
      requestId: 'TEST-REQ-P4-01',
      farmerName: 'R. Krishnan',
      rawQuery: 'What crop is in Survey 202/55 Sanganaperi? Diagnose pest from field photo and recommend fertilizer.',
      language: 'ta',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      subdivision: '55',
      coordinates: { latitude: 9.3512, longitude: 77.4819 },
      attachments: {
        fieldPhotoUrl: 'Datasets/images/images/sample_paddy_tillering.jpg',
        soilType: 'Clay Loam'
      },
      consentGiven: true
    };

    const progressEvents: any[] = [];
    const result = await pipeline.execute(request, evt => {
      progressEvents.push(evt);
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.finalResult).toBeDefined();
    expect(result.finalResult?.parcel.surveyNumber).toBe('202/55');
    expect(result.finalResult?.cropAssessment.cropName).toBe('Paddy');
    expect(['VERIFIED', 'VERIFIED WITH WARNINGS']).toContain(result.finalResult?.verification.overallStatus);
    expect(progressEvents.length).toBeGreaterThanOrEqual(10);
    expect(progressEvents.some(e => e.status === 'completed')).toBe(true);
  });

  it('triggers interactive clarification loop when essential parcel info is missing', async () => {
    const missingInfoRequest: FarmerRequest = {
      requestId: 'TEST-REQ-P4-02',
      farmerName: 'S. Murugan',
      rawQuery: 'My crop leaves are turning yellow, what should I spray on my field?',
      language: 'ta',
      district: '',
      taluk: '',
      village: '',
      surveyNumber: '',
      attachments: {},
      consentGiven: true
    };

    const result = await pipeline.execute(missingInfoRequest);
    expect(result.status).toBe('NEEDS_CLARIFICATION');
    expect(result.clarifyingQuestions).toBeDefined();
    expect(result.clarifyingQuestions?.length).toBeGreaterThan(0);
    expect(result.finalResult).toBeUndefined();
  });

  it('API Gateway handles POST /api/orchestrate correctly', async () => {
    const requestPayload = {
      requestId: 'TEST-REQ-API-01',
      farmerName: 'M. Subbiah',
      rawQuery: 'Identify parcel boundaries and owner for Survey 387 in Keelathattaparai, Thoothukudi.',
      language: 'en',
      district: 'Thoothukudi',
      taluk: 'Thoothukudi',
      village: 'Keelathattaparai',
      surveyNumber: '387',
      attachments: {},
      consentGiven: true
    };

    const event = {
      rawPath: '/api/orchestrate',
      httpMethod: 'POST',
      body: JSON.stringify(requestPayload),
      requestContext: { http: { method: 'POST', path: '/api/orchestrate' } }
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.status).toBe('COMPLETED');
    expect(body.finalResult.parcel.surveyNumber).toBe('387');
    expect(['VERIFIED', 'VERIFIED WITH WARNINGS']).toContain(body.finalResult.verification.overallStatus);
  });

  it('API Gateway returns 400 when invalid request payload is sent to /api/orchestrate', async () => {
    const invalidEvent = {
      rawPath: '/api/orchestrate',
      httpMethod: 'POST',
      body: JSON.stringify({ invalidField: true }), // missing required fields
      requestContext: { http: { method: 'POST', path: '/api/orchestrate' } }
    };

    const response = await handler(invalidEvent);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('ZodError');
  });
});
