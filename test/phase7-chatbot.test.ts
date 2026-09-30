import { describe, it, expect } from 'vitest';
import {
  HybridRAGRetriever,
  HallucinationVerifier,
  AgriChatbot,
  EvaluationHarness,
  AGRONOMIC_KNOWLEDGE_CORPUS
} from '../packages/agent-core/src/index.js';
import { handler as chatbotLambdaHandler } from '../services/chatbot/src/index.js';
import { handler as apiGatewayHandler } from '../services/api-gateway-handler/src/index.js';

describe('Phase 7: Hallucination-Safe Bilingual Agricultural Chatbot & Evaluation Harness', () => {
  const retriever = new HybridRAGRetriever();
  const chatbot = new AgriChatbot(retriever);
  const harness = new EvaluationHarness(chatbot);

  describe('1. Hybrid Semantic RAG Retrieval', () => {
    it('retrieves relevant top chunks for paddy nutrient management', async () => {
      const results = await retriever.retrieve({
        text: 'How much urea should I apply for active tillering in rice?',
        filter: { crop: 'Paddy', limit: 2 }
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chunk.crop).toBe('Paddy');
      expect(results[0].chunk.chunkId).toBe('TNAU-PAD-NUT-001');
      expect(results[0].score).toBeGreaterThan(0.4);
    });

    it('retrieves relevant chunks for Tamil spoken terms', async () => {
      const results = await retriever.retrieve({
        text: 'தண்டுத்துளைப்பான் புழு தாக்குதலுக்கு மருந்து',
        filter: { crop: 'Paddy', limit: 2 }
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chunk.titleTa).toContain('தண்டுத்துளைப்பான்');
    });

    it('retrieves groundnut gypsum requirements', async () => {
      const results = await retriever.retrieve({
        text: 'gypsum pegging stage groundnut calcium',
        filter: { crop: 'Groundnut', limit: 2 }
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chunk.chunkId).toBe('TNAU-GND-NUT-005');
      expect(results[0].chunk.contentEn).toContain('160-200 kg/acre');
    });
  });

  describe('2. Hallucination Verifier & Agrochemical Safety Guardrail', () => {
    const mockPaddyChunks = AGRONOMIC_KNOWLEDGE_CORPUS.filter(c => c.crop === 'Paddy');

    it('intercepts banned/prohibited agrochemical claims', () => {
      const hazardousResponse = 'You should spray Monocrotophos 500ml or Endosulfan to quickly kill all insects in your paddy field.';
      const report = HallucinationVerifier.verify(hazardousResponse, mockPaddyChunks, 'en');

      expect(report.isSafe).toBe(false);
      expect(report.score).toBeLessThan(0.5);
      expect(report.flaggedIssues.some(f => f.includes('BANNED_SUBSTANCE'))).toBe(true);
      expect(report.sanitizedResponse).toContain('CAUTION: Prohibited or hazardous chemicals cannot be recommended');
    });

    it('intercepts Tamil queries advocating banned substances', () => {
      const hazardousTa = 'உங்கள் வயலில் மோனோகுரோட்டோபாஸ் மருந்தை தெளிக்கலாம்.';
      const report = HallucinationVerifier.verify(hazardousTa, mockPaddyChunks, 'ta');

      expect(report.isSafe).toBe(false);
      expect(report.sanitizedResponse).toContain('தடைசெய்யப்பட்ட அல்லது அதிக நச்சுத்தன்மை');
    });

    it('verifies safe, grounded recommendations without obstruction', () => {
      const safeResponse = 'Apply Neem Coated Urea at 30 kg/acre along with MOP 10 kg/acre at active tillering.';
      const report = HallucinationVerifier.verify(safeResponse, mockPaddyChunks, 'en');

      expect(report.isSafe).toBe(true);
      expect(report.score).toBeGreaterThanOrEqual(0.9);
      expect(report.flaggedIssues.length).toBe(0);
    });

    it('detects and flags abnormal single-application dosages', () => {
      const excessiveDosage = 'Apply Urea 500 kg/acre in single broadcast.';
      const report = HallucinationVerifier.verify(excessiveDosage, mockPaddyChunks, 'en');

      expect(report.flaggedIssues).toContain('EXCESSIVE_DOSAGE_WARNING');
    });
  });

  describe('3. AgriChatbot Engine & Conversational Intelligence', () => {
    it('answers English agronomy questions with TNAU citations and proper model attribution', async () => {
      const response = await chatbot.chat({
        message: 'What is the recommended fertilizer schedule for active tillering?',
        language: 'en'
      });

      expect(response.reply).toContain('Neem Coated Urea');
      expect(response.reply).toContain('30 kg/acre');
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations[0].sourceId).toContain('TNAU');
      expect(response.verified).toBe(true);
      expect(response.modelUsed).toBe('ministral-8b');
      expect(response.intent).toBe('fertilizer_inquiry');
    });

    it('answers Tamil spoken/written queries in natural Tamil with verified guidance', async () => {
      const response = await chatbot.chat({
        message: 'நெல் பயிரில் தண்டுத்துளைப்பான் புழுவிற்கு என்ன மருந்து?',
        language: 'ta'
      });

      expect(response.language).toBe('ta');
      expect(response.reply).toContain('குளோரான்ட்ரானிலிப்ரோல்');
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.verified).toBe(true);
    });

    it('injects active parcel context seamlessly into responses', async () => {
      const response = await chatbot.chat({
        message: 'How should I irrigate my field?',
        language: 'en',
        parcelContext: {
          surveyNumber: '202/55',
          village: 'Sanganaperi',
          cropName: 'Paddy',
          growthStage: 'Tillering',
          weatherAlerts: ['No rain expected for 48h.']
        }
      });

      expect(response.reply).toContain('Survey No: 202/55');
      expect(response.reply).toContain('Paddy');
      expect(response.reply).toContain('Alternate Wetting and Drying');
    });

    it('remembers previous chat turn and translates previous advisory to Tamil when asked "In tamil"', async () => {
      const turn1Response = await chatbot.chat({
        message: 'How can I plant paddy',
        language: 'en'
      });

      expect(turn1Response.reply).toContain('Neem Coated Urea');

      // User follows up with "In tamil"
      const turn2Response = await chatbot.chat({
        message: 'In tamil',
        history: [
          { role: 'user', content: 'How can I plant paddy' },
          { role: 'assistant', content: turn1Response.reply }
        ]
      });

      expect(turn2Response.language).toBe('ta');
      expect(turn2Response.reply).toContain('செயலில் உள்ள தூர்கட்டும் பருவத்தில் தழைச்சத்து மேலாண்மை');
      expect(turn2Response.reply).toContain('வேப்பம்பூசப்பட்ட யூரியா');
      expect(turn2Response.verified).toBe(true);
      expect(turn2Response.citations.length).toBeGreaterThan(0);
      expect(turn2Response.intent).toBe('language_translation');
    });

    it('contextually answers multi-turn follow-ups such as "Why drain water?" using conversation history', async () => {
      const response = await chatbot.chat({
        message: 'Why drain standing water?',
        history: [
          { role: 'user', content: 'How can I plant paddy' },
          { role: 'assistant', content: 'Apply Neem Coated Urea at 30 kg/acre at active tillering...' }
        ]
      });

      expect(response.verified).toBe(true);
      expect(response.reply).toContain('leaching');
      expect(response.citations.length).toBeGreaterThan(0);
    });

    it('safely blocks off-topic queries even when prior agricultural conversation history exists', async () => {
      const response = await chatbot.chat({
        message: 'இன்னைக்கு கிரிக்கெட் மேட்ச் என்ன ஆச்சு',
        history: [
          { role: 'user', content: 'How can I plant paddy' },
          { role: 'assistant', content: 'Apply Neem Coated Urea at 30 kg/acre at active tillering...' }
        ]
      });

      expect(response.intent).toBe('off_topic');
      expect(response.reply).toContain('வேளாண்மை');
    });
  });

  describe('4. Serverless Chatbot Lambda Handler', () => {
    it('processes POST /chat event and returns 200 with structured response', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          message: 'What subsidy is available for drip irrigation in Tamil Nadu?',
          language: 'en'
        })
      };

      const response = await chatbotLambdaHandler(event);
      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.reply).toContain('100%');
      expect(body.citations.length).toBeGreaterThan(0);
      expect(body.verified).toBe(true);
      expect(body.costUSD).toBeLessThan(0.005);
    });

    it('returns 400 when message is empty', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({})
      };

      const response = await chatbotLambdaHandler(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('5. API Gateway /api/chat Routing', () => {
    it('routes POST /api/chat through gateway router cleanly', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/chat',
        body: JSON.stringify({
          message: 'Tell me about adult palm coconut fertilizer',
          language: 'en'
        })
      };

      const response = await apiGatewayHandler(event);
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.reply).toContain('Urea 1.3 kg');
      expect(body.citations[0].sourceId).toContain('ICAR-CPCRI');
    });
  });

  describe('6. Task 1 Evaluation Benchmark Harness', () => {
    it('executes full benchmark and verifies groundedness, safety, and >70% cost savings', async () => {
      const report = await harness.runBenchmark();

      expect(report.totalTests).toBeGreaterThanOrEqual(7);
      expect(report.passedTests).toBe(report.totalTests);
      expect(report.groundednessScorePct).toBeGreaterThanOrEqual(90);
      expect(report.hallucinationPreventionPct).toBe(100);
      expect(report.costSavingsPct).toBeGreaterThanOrEqual(70);
      expect(report.averageLatencyMs).toBeLessThan(100); // In-memory/mock routing is extremely fast
    });
  });
});
