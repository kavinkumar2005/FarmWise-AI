import { describe, it, expect } from 'vitest';
import {
  generateAdvisoryDigest,
  verifyAdvisoryDigest,
  generateQRCodeSVG,
  generateQRCodeDataURL,
  generateAdvisoryQRCodes,
  buildGovernmentReportHTML,
  FinalResult
} from '../packages/agent-core/src/index.js';
import { handler as reportLambdaHandler } from '../services/report-generator/src/index.js';
import { handler as apiGatewayHandler } from '../services/api-gateway-handler/src/index.js';

describe('Phase 6: Official Government-Format Bilingual Report Generator & QR Verification', () => {
  const sampleFinalResult: FinalResult = {
    runId: 'RUN-2026-E2E-991',
    timestamp: '2026-09-29T12:00:00Z',
    status: 'COMPLETED',
    farmerQuery: 'Diagnose crop health and provide official advisory for Survey 202/55 in Sanganaperi village.',
    parcel: {
      surveyNumber: '202/55',
      subdivision: '55',
      village: 'Sanganaperi',
      taluk: 'Sivagiri',
      district: 'Tenkasi',
      areaAcres: 2.10,
      centroid: { latitude: 9.255, longitude: 77.385 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.384, 9.254],
            [77.386, 9.254],
            [77.386, 9.256],
            [77.384, 9.256],
            [77.384, 9.254]
          ]
        ]
      },
      provenance: 'FarmwiseAI-provided'
    },
    landRecord: {
      recordId: 'PATTA-TENK-202-55',
      surveyNumber: '202/55',
      village: 'Sanganaperi',
      taluk: 'Sivagiri',
      district: 'Tenkasi',
      ownerNameMasked: 'R. K****',
      ownerNameFull: 'R. Krishnan',
      classification: 'Patta',
      wetOrDry: 'Nanjai',
      extentAcres: 2.10,
      pattaNumber: '1042',
      provenance: 'FarmwiseAI-provided'
    },
    cropAssessment: {
      cropName: 'Paddy',
      growthStage: 'Tillering',
      condition: 'Stem Borer Infestation',
      visualEvidence: 'Dead heart symptoms visible on central tillers with light chlorosis.',
      confidence: 0.92,
      provenance: 'AI-generated'
    },
    weather: {
      temperatureCelsius: 29.5,
      humidityPercent: 68,
      windSpeedKmph: 8.2,
      precipitationMm: 0.0,
      forecast7Day: [
        { date: '2026-09-30', tempMax: 32, tempMin: 24, precipitationProbability: 10, condition: 'Clear' },
        { date: '2026-10-01', tempMax: 31, tempMin: 23, precipitationProbability: 15, condition: 'Partly Cloudy' },
        { date: '2026-10-02', tempMax: 31, tempMin: 24, precipitationProbability: 20, condition: 'Clear' }
      ],
      agronomicAlerts: ['Mild afternoon heat stress, safe spray window active.'],
      provenance: 'Public source'
    },
    recommendations: [
      {
        category: 'pest_control',
        title: 'Stem Borer Management',
        description: 'Apply Chlorantraniliprole 18.5% SC @ 60 ml/acre in 200 liters of water during evening hours.',
        dosage: '60 ml/acre',
        timing: 'Evening foliar application within 48h',
        sourceCitation: {
          title: 'TNAU Crop Production Guide - Paddy Crop Protection',
          category: 'pest_control',
          provenance: 'Public source'
        }
      },
      {
        category: 'fertilizer',
        title: 'Top Dressing Nitrogen',
        description: 'Broadcast Urea 25 kg/acre along with Neem cake powder at active tillering stage.',
        dosage: '25 kg/acre',
        timing: 'Immediately after weeding',
        sourceCitation: {
          title: 'TNAU Agronomy Guidelines',
          category: 'fertilizer',
          provenance: 'Public source'
        }
      }
    ],
    verification: {
      overallStatus: 'VERIFIED',
      checks: [
        { name: 'Boundary Containment', passed: true, details: 'Coordinates inside parcel', severity: 'pass' },
        { name: 'Acreage Match', passed: true, details: '0% discrepancy between GIS and revenue', severity: 'pass' },
        { name: 'Spray Safety', passed: true, details: 'Wind < 15km/h and 0mm rain', severity: 'pass' },
        { name: 'Crop Consistency', passed: true, details: 'Paddy consistent with Nanjai soil', severity: 'pass' },
        { name: 'Soil Suitability', passed: true, details: 'Clay loam matches paddy requirements', severity: 'pass' },
        { name: 'Weather Window', passed: true, details: 'Clear skies for 48h', severity: 'pass' },
        { name: 'PII Protection', passed: true, details: 'Masked as R. K****', severity: 'pass' }
      ],
      escalatedToClaude: false
    },
    confidence: {
      overall: 0.94,
      breakdown: {
        cadastre: 0.98,
        landRecord: 0.95,
        image: 0.92,
        weather: 0.96,
        agronomy: 0.94
      }
    },
    costSummary: {
      totalCostUSD: 0.00315,
      baselineCostUSD: 0.01250,
      savingsPct: 74.8,
      modelCalls: [
        { modelId: 'ministral-8b', task: 'plan', costUSD: 0.0004 },
        { modelId: 'titan-multimodal-embed', task: 'vision-knn', costUSD: 0.0002 },
        { modelId: 'gemini-1.5-flash', task: 'diagnostic', costUSD: 0.0018 }
      ]
    },
    dataProvenance: {
      cadastreSource: 'FarmwiseAI-provided',
      landRecordSource: 'FarmwiseAI-provided',
      imageSource: 'User-uploaded',
      weatherSource: 'Public source',
      advisorySource: 'Public source'
    }
  };

  describe('1. Cryptographic Advisory Hasher & Verification Digest', () => {
    it('generates a deterministic 64-hex-char SHA-256 digest', () => {
      const digest1 = generateAdvisoryDigest(sampleFinalResult);
      const digest2 = generateAdvisoryDigest(sampleFinalResult);

      expect(digest1.sha256).toBe(digest2.sha256);
      expect(digest1.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(digest1.advisoryId).toMatch(/^FW-TN-2026-[A-Z0-9]+$/);
      expect(digest1.shortChecksum).toBe(digest1.sha256.substring(0, 12).toUpperCase());
      expect(digest1.verificationUrl).toContain('https://farmwise.tn.gov.in/verify');
      expect(digest1.verificationUrl).toContain('id=FW-TN-2026-');
    });

    it('verifies authenticity and catches tamper modifications', () => {
      const digest = generateAdvisoryDigest(sampleFinalResult);
      expect(verifyAdvisoryDigest(sampleFinalResult, digest.sha256)).toBe(true);

      // Modified result (e.g. tampered survey number)
      const tamperedResult = {
        ...sampleFinalResult,
        parcel: { ...sampleFinalResult.parcel, surveyNumber: '999/99' }
      };

      expect(verifyAdvisoryDigest(tamperedResult, digest.sha256)).toBe(false);
    });
  });

  describe('2. QR Code Generation (SVG & DataURL)', () => {
    it('generates valid SVG and base64 PNG DataURL representations', async () => {
      const digest = generateAdvisoryDigest(sampleFinalResult);
      const qrBundle = await generateAdvisoryQRCodes(digest);

      expect(qrBundle.verificationUrl).toBe(digest.verificationUrl);
      expect(qrBundle.svg).toContain('<svg');
      expect(qrBundle.svg).toContain('viewBox');
      expect(qrBundle.dataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('3. Government-Format Bilingual HTML Report Builder', () => {
    it('generates complete HTML document with Tamil Nadu Government headers and all 6 sections', async () => {
      const report = await buildGovernmentReportHTML(sampleFinalResult, {
        language: 'ta',
        persona: 'farmer'
      });

      expect(report.html).toContain('<!DOCTYPE html>');
      expect(report.html).toContain('Government of Tamil Nadu / தமிழ்நாடு அரசு');
      expect(report.html).toContain('Department of Agriculture & Farmers Welfare / வேளாண்மை மற்றும் உழவர் நலத்துறை');
      expect(report.html).toContain('1. Land Cadastre & Revenue Record (நில வருவாய் & புல விவரம்)');
      expect(report.html).toContain('2. Multimodal Crop Health & Diagnostic (பயிர் நலம் & நோய் ஆய்வு)');
      expect(report.html).toContain('3. Grounded Agronomic Prescriptions (வேளாண் வழிகாட்டல்)');
      expect(report.html).toContain('4. 48-Hour Micro-Climate & Spray Feasibility (வானிலை ஆய்வு)');
      expect(report.html).toContain('5. Data Provenance & Verification Audit (தரவு மூலம் & தணிக்கை)');
      expect(report.html).toContain('6. Sign-off, Cryptographic Checksum & QR');

      // Farmer persona masks PII
      expect(report.html).toContain('R. K****');
      expect(report.html).not.toContain('Officer Audit (Full PII)');

      // Data Provenance tags present
      expect(report.html).toContain('FarmwiseAI-provided');
      expect(report.html).toContain('TNAU Crop Production Guide');

      // Cryptographic seal and QR image
      expect(report.html).toContain(report.sha256);
      expect(report.html).toContain(report.qrDataUrl);

      // Embedded print stylesheet
      expect(report.html).toContain('@media print');
      expect(report.html).toContain('Noto Sans Tamil');
    });

    it('displays unmasked PII and officer audit mode for officer persona', async () => {
      const report = await buildGovernmentReportHTML(sampleFinalResult, {
        language: 'en',
        persona: 'officer'
      });

      expect(report.html).toContain('Officer Audit (Full PII)');
      expect(report.html).toContain('R. Krishnan');
    });
  });

  describe('4. Serverless Report-Generator Lambda Handler', () => {
    it('handles JSON generation request and returns 200 with report payload', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          result: sampleFinalResult,
          language: 'ta',
          persona: 'farmer'
        })
      };

      const response = await reportLambdaHandler(event);
      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.status).toBe('SUCCESS');
      expect(body.advisoryId).toMatch(/^FW-TN-2026-/);
      expect(body.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(body.html).toContain('Government of Tamil Nadu');
    });

    it('returns raw HTML when requested with format: "html"', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          result: sampleFinalResult,
          format: 'html'
        })
      };

      const response = await reportLambdaHandler(event);
      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('text/html; charset=utf-8');
      expect(response.body).toContain('<!DOCTYPE html>');
    });

    it('returns 400 when result is missing in request body', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({})
      };

      const response = await reportLambdaHandler(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('5. API Gateway /api/report Route Integration', () => {
    it('routes POST /api/report through API Gateway to report generator', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/report',
        body: JSON.stringify({
          result: sampleFinalResult,
          persona: 'officer'
        })
      };

      const response = await apiGatewayHandler(event);
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('SUCCESS');
      expect(body.advisoryId).toBeDefined();
      expect(body.html).toContain('R. Krishnan');
    });
  });
});
