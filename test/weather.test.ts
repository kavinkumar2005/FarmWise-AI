import { describe, it, expect } from 'vitest';
import { WeatherAgent, SharedState, ModelRouter, PlanStep } from '../packages/agent-core/src/index.js';

describe('Phase 3: Weather Agent & Open-Meteo Integration', () => {
  it('retrieves forecast, derives agronomic alerts, and caches weather', async () => {
    const agent = new WeatherAgent();
    const router = new ModelRouter();
    const request = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      rawQuery: 'Weather for Sanganaperi',
      language: 'en' as const,
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      consentGiven: true,
      attachments: {}
    };
    const state = new SharedState('RUN-WEATHER-01', request);

    const step: PlanStep = {
      id: 'step-4',
      name: 'Fetch Localized Weather & Agronomic Risk Window',
      agent: 'weather',
      inputs: {},
      dependsOn: [],
      criticality: 'normal',
      requiredOutputs: ['forecast7Day', 'agronomicAlerts'],
      candidateModels: ['ministral-8b']
    };

    const result = await agent.run(state, step, router);
    expect(result.status).toBe('success');
    expect(result.data.forecast7Day.length).toBeGreaterThanOrEqual(3);
    expect(result.data.agronomicAlerts.length).toBeGreaterThan(0);
    expect(result.data.currentTempC).toBeGreaterThan(15);
    expect(result.data.currentTempC).toBeLessThan(50);
  });
});