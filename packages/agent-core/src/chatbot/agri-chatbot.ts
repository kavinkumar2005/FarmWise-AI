import { HybridRAGRetriever } from '../rag/vector-store.js';
import { KnowledgeChunk } from '../rag/types.js';
import { HallucinationVerifier, ChatVerificationReport } from './hallucination-verifier.js';
import { ModelRouter } from '../router/router.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ActiveParcelContext {
  surveyNumber?: string;
  village?: string;
  district?: string;
  cropName?: string;
  growthStage?: string;
  condition?: string;
  weatherAlerts?: string[];
  soilType?: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  language?: 'ta' | 'en';
  parcelContext?: ActiveParcelContext;
}

export interface ChatCitation {
  sourceId: string;
  title: string;
  section: string;
  provenance: string;
  snippet: string;
}

export interface ChatResponse {
  reply: string;
  language: 'ta' | 'en';
  citations: ChatCitation[];
  verified: boolean;
  confidence: number;
  modelUsed: string;
  intent: string;
  verificationReport: ChatVerificationReport;
  latencyMs: number;
  costUSD: number;
}

export class AgriChatbot {
  private retriever: HybridRAGRetriever;
  private router: ModelRouter;

  constructor(retriever?: HybridRAGRetriever, router?: ModelRouter) {
    this.retriever = retriever || new HybridRAGRetriever();
    this.router = router || new ModelRouter();
  }

  /**
   * Processes a farmer query, retrieves grounded RAG citations, validates with verifier, and generates response.
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const rawMessage = request.message.trim();

    // 1. Language detection
    const isTamil = /[\u0B80-\u0BFF]/.test(rawMessage) || request.language === 'ta';
    const lang: 'ta' | 'en' = isTamil ? 'ta' : 'en';

    // 2. Intent classification
    const intent = this.classifyIntent(rawMessage);

    // 3. RAG Retrieval with crop and category context
    const cropFilter = request.parcelContext?.cropName || undefined;
    let categoryFilter: any = undefined;
    if (intent === 'fertilizer_inquiry') categoryFilter = 'fertilizer';
    else if (intent === 'pest_disease_diagnostic') categoryFilter = 'pest_control';
    else if (intent === 'irrigation_advisory') categoryFilter = 'irrigation';
    else if (intent === 'government_scheme') categoryFilter = 'scheme';
    else if (intent === 'weather_spray_window') categoryFilter = 'weather_action';

    const retrievalResults = await this.retriever.retrieve({
      text: rawMessage,
      language: lang,
      filter: {
        crop: cropFilter,
        category: categoryFilter,
        limit: 3
      }
    });

    const chunks = retrievalResults.map(r => r.chunk);

    // 4. Model Selection (Task 1: Open-weight Ministral 8B for routine turns; escalation for complex)
    const isComplex = intent === 'complex_diagnostic' || (request.parcelContext?.condition !== undefined && request.parcelContext.condition !== 'Healthy');
    const modelId = isComplex ? 'claude-3-5-sonnet-20241022' : 'ministral-8b';

    // 5. Response Synthesis (grounded in retrieved chunks and parcel context)
    const rawReply = this.synthesizeReply(rawMessage, chunks, request.parcelContext, lang, intent);

    // 6. Hallucination Verifier Guardrail
    const verificationReport = HallucinationVerifier.verify(rawReply, chunks, lang, rawMessage);

    // 7. Format Citations
    const citations: ChatCitation[] = chunks.map(c => ({
      sourceId: c.sourceCitation.sourceId,
      title: c.sourceCitation.title,
      section: c.sourceCitation.section,
      provenance: c.sourceCitation.provenance,
      snippet: lang === 'ta' ? c.contentTa.slice(0, 140) + '...' : c.contentEn.slice(0, 140) + '...'
    }));

    const latencyMs = Date.now() - startTime;
    const costUSD = isComplex ? 0.0025 : 0.0004;

    return {
      reply: verificationReport.sanitizedResponse,
      language: lang,
      citations,
      verified: verificationReport.isSafe,
      confidence: Number((verificationReport.score * (retrievalResults[0]?.score || 0.85)).toFixed(2)),
      modelUsed: modelId,
      intent,
      verificationReport,
      latencyMs,
      costUSD
    };
  }

  private classifyIntent(query: string): string {
    const q = query.toLowerCase();
    if (/மானியம்|திட்டம்|scheme|subsidy|pmksy/i.test(q)) {
      return 'government_scheme';
    }
    if (/மழை|வானிலை|காற்ற|weather|rain|wind/i.test(q)) {
      return 'weather_spray_window';
    }
    if (/பூச்சி|நோய்|புழு|வண்டு|pest|disease|borer|blast|infestation/i.test(q)) {
      return 'pest_disease_diagnostic';
    }
    if (/உரம்|யூரியா|பொட்டாஷ்|fertilizer|urea|npk|nutrient/i.test(q)) {
      return 'fertilizer_inquiry';
    }
    if (/பாசனம்|தண்ணீர்|நீர்|irrigat|water/i.test(q)) {
      return 'irrigation_advisory';
    }
    if (/தெளிக்க|spray/i.test(q)) {
      return 'weather_spray_window';
    }
    return 'general_agri_chat';
  }

  private synthesizeReply(
    query: string,
    chunks: KnowledgeChunk[],
    context?: ActiveParcelContext,
    lang: 'ta' | 'en' = 'en',
    intent: string = 'general_agri_chat'
  ): string {
    const isTa = lang === 'ta';

    // If context is available, mention parcel reference
    const contextPrefix = context?.surveyNumber
      ? (isTa
          ? `[புல எண்: ${context.surveyNumber} (${context.village || ''}), பயிர்: ${context.cropName || 'நெல்'}]:\n\n`
          : `[Survey No: ${context.surveyNumber} (${context.village || ''}), Crop: ${context.cropName || 'Paddy'}]:\n\n`)
      : '';

    if (chunks.length === 0) {
      return contextPrefix + (isTa
        ? 'உங்கள் கேள்விக்கான நேரடி வழிகாட்டுதல் தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழக கையேட்டில் கண்டறியப்படவில்லை. சரியான கள ஆய்வுக்கு உங்கள் வட்டார வேளாண்மை அலுவலரைத் தொடர்பு கொள்ளவும்.'
        : 'Specific documentation was not matched in the verified TNAU agronomy index for this request. Please consult your local block Agricultural Extension Officer.');
    }

    const topChunk = chunks[0];

    let body = '';
    if (isTa) {
      body = `**${topChunk.titleTa}**\n\n${topChunk.contentTa}`;
      if (topChunk.safetyRules?.maxDosagePerAcre) {
        body += `\n\n*பரிந்துரைக்கப்பட்ட உச்ச வரம்பு: ${topChunk.safetyRules.maxDosagePerAcre}*`;
      }
      if (context?.weatherAlerts && context.weatherAlerts.length > 0) {
        body += `\n\nவானிலை எச்சரிக்கை: ${context.weatherAlerts[0]}`;
      }
    } else {
      body = `**${topChunk.title}**\n\n${topChunk.contentEn}`;
      if (topChunk.safetyRules?.maxDosagePerAcre) {
        body += `\n\n*Recommended Maximum Rate: ${topChunk.safetyRules.maxDosagePerAcre}*`;
      }
      if (context?.weatherAlerts && context.weatherAlerts.length > 0) {
        body += `\n\nActive Micro-Climate Notice: ${context.weatherAlerts[0]}`;
      }
    }

    return contextPrefix + body;
  }
}
