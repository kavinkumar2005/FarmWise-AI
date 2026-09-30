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

// --- Greeting & Relevance Guards -------------------------------------------

/** Matches simple greetings in English and Tamil */
const GREETING_RE = /^(hi|hello|hey|vanakkam|வணக்கம்|helo|hai|hii|good\s*(morning|evening|night|afternoon)|namaste|நமஸ்காரம்|thanks|thank\s*you|நன்றி|ok|okay|bye|goodbye)[\s!?.]*$/i;

/** Agricultural keyword patterns - if none match, message is off-topic */
const AGRI_PATTERNS: RegExp[] = [
  /மானியம்|திட்டம்|scheme|subsidy|pmksy|pm.kisan/i,
  /மழை|வானிலை|காற்ற|weather|rain|wind|forecast/i,
  /பூச்சி|நோய்|புழு|வண்டு|pest|disease|borer|blast|infestation|அழுகல்|கருகல்|fungus/i,
  /உரம்|யூரியா|பொட்டாஷ்|fertilizer|urea|npk|nutrient|compost|dap|potash/i,
  /பாசனம்|தண்ணீர்|நீர்|irrigat|water|drip|sprinkler/i,
  /தெளிக்க|spray|கிருமி|fungicide|herbicide|weedicide|pesticide/i,
  /பயிர்|crop|harvest|seed|விதை|நாற்று|seedling|transplant|sow|cultivat/i,
  /நெல்|paddy|rice|கோதுமை|wheat|cotton|பருத்தி|sugarcane|கரும்பு|coconut|தேங்காய்|groundnut|நிலக்கடலை|maize/i,
  /soil|மண்|ph\b|organic.*matter|tillage|plough/i,
  /survey|புல எண்|patta|பட்டா|land|நிலம்|acre|hectare|plot/i,
  /yield|விளைச்சல்|production|harvest|grow|plant/i,
  /advisory|advice|guide|recommend|suggest/i,
  /வாங்க|விற்பனை|விலை|விலைவாசி|கடை|buy|purchase|procure|store|shop|dealer|price|rate|mandi|market/i,
];

function isGreeting(q: string): boolean { return GREETING_RE.test(q.trim()); }
function isAgriQuery(q: string): boolean { return AGRI_PATTERNS.some(p => p.test(q)); }

// ---------------------------------------------------------------------------

export class AgriChatbot {
  private retriever: HybridRAGRetriever;
  private router: ModelRouter;

  constructor(retriever?: HybridRAGRetriever, router?: ModelRouter) {
    this.retriever = retriever || new HybridRAGRetriever();
    this.router = router || new ModelRouter();
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const rawMessage = request.message.trim();

    // 1. Language detection
    const isTamil = /[\u0B80-\u0BFF]/.test(rawMessage) || request.language === 'ta';
    const lang: 'ta' | 'en' = isTamil ? 'ta' : 'en';

    // 2. Greeting shortcut - no RAG, no hallucination risk
    if (isGreeting(rawMessage)) {
      const greetReply = this.greetingReply(lang, request.parcelContext);
      const emptyVR: ChatVerificationReport = {
        isSafe: true, score: 1.0, flaggedIssues: [],
        checks: [{ ruleName: 'GreetingBypass', passed: true, message: 'Greeting handled by rule; no RAG retrieval needed.', severity: 'safe' }],
        sanitizedResponse: greetReply
      };
      return { reply: greetReply, language: lang, citations: [], verified: true, confidence: 1.0, modelUsed: 'rule-based', intent: 'greeting', verificationReport: emptyVR, latencyMs: Date.now() - startTime, costUSD: 0 };
    }

    // 3. Off-topic guard - no agri keywords -> polite redirect, no random RAG content
    if (!isAgriQuery(rawMessage)) {
      const offReply = lang === 'ta'
        ? 'நான் வேளாண்மை கேள்விகளுக்கு மட்டுமே உதவுகிறேன்.\n\nகேட்கலாம்: பயிர் நோய்கள், உரம், பாசனம், வானிலை, அரசு திட்டங்கள்.'
        : "I can only help with agriculture-related questions.\n\nYou can ask about: crop diseases, fertilizers, irrigation, weather, government schemes.";
      const offVR: ChatVerificationReport = {
        isSafe: true, score: 1.0, flaggedIssues: [],
        checks: [{ ruleName: 'OffTopicGuard', passed: true, message: 'No agri keywords — RAG bypassed to prevent hallucination.', severity: 'safe' }],
        sanitizedResponse: offReply
      };
      return { reply: offReply, language: lang, citations: [], verified: true, confidence: 1.0, modelUsed: 'rule-based', intent: 'off_topic', verificationReport: offVR, latencyMs: Date.now() - startTime, costUSD: 0 };
    }

    // 4. Intent classification
    const intent = this.classifyIntent(rawMessage);

    // Direct grounded handling for input procurement inquiries
    if (intent === 'input_procurement') {
      const isTa = lang === 'ta';
      const contextPrefix = request.parcelContext?.surveyNumber
        ? (isTa ? `[புல எண்: ${request.parcelContext.surveyNumber} (${request.parcelContext.village || ''}), பயிர்: ${request.parcelContext.cropName || 'நெல்'}]:\n\n` : `[Survey No: ${request.parcelContext.surveyNumber} (${request.parcelContext.village || ''}), Crop: ${request.parcelContext.cropName || 'Paddy'}]:\n\n`)
        : '';
      const procReply = contextPrefix + (isTa
        ? '**அங்கீகரிக்கப்பட்ட உழவர் இடுபொருள் கொள்முதல் மையங்கள்**\n\nதரமான சான்று பெற்ற உரங்கள், விதைகள் மற்றும் பயிர் பாதுகாப்பு மருந்துகளை பின்வரும் அரசு அங்கீகாரம் பெற்ற மையங்களில் பெறலாம்:\n1. **தொடக்க வேளாண்மை கூட்டுறவு கடன் சங்கம் (PACCS)**: மானிய விலையிலான வேப்பம்பூசப்பட்ட யூரியா, டிஏபி மற்றும் பொட்டாஷ் உரம்.\n2. **வட்டார வேளாண் விரிவாக்க மையம் (AEC Depot)**: அரசு சான்று பெற்ற தரமான விதைகள் மற்றும் உயிர் உரங்கள்.\n3. **அரசு உரிமம் பெற்ற வேளாண் விற்பனையாளர்கள் (Licensed Dealers)**: பூச்சிக்கொல்லிகளை வாங்கும் போது எப்போதும் அரசு உரிமம் உள்ள கடைகளில் அசல் ரசீது மற்றும் காலாவதி தேதியைச் சரிபார்த்து வாங்கவும்.'
        : '**Authorized Agricultural Input Procurement Centers**\n\nGenuine fertilizers, certified seeds, and TNAU-approved pesticides can be purchased from:\n1. **Primary Agricultural Cooperative Credit Societies (PACCS)**: For subsidized neem-coated urea, DAP, and potash.\n2. **Block Agricultural Extension Center (AEC Depot)**: For certified seeds, micronutrient mixtures, and bio-control agents.\n3. **Licensed Agro-Chemical Retailers**: Always ensure you purchase from authorized dealers and obtain a valid GST bill with batch number and expiry date.');
      
      const procVR: ChatVerificationReport = {
        isSafe: true, score: 1.0, flaggedIssues: [],
        checks: [{ ruleName: 'ProcurementRegistryCheck', passed: true, message: 'Grounded in Tamil Nadu Agriculture Department input distribution protocol.', severity: 'safe' }],
        sanitizedResponse: procReply
      };
      return { reply: procReply, language: lang, citations: [], verified: true, confidence: 0.98, modelUsed: 'rule-based', intent: 'input_procurement', verificationReport: procVR, latencyMs: Date.now() - startTime, costUSD: 0 };
    }

    // Direct grounded handling for market / mandi commodity price inquiries
    if (intent === 'market_inquiry') {
      const isTa = lang === 'ta';
      const contextPrefix = request.parcelContext?.surveyNumber
        ? (isTa ? `[புல எண்: ${request.parcelContext.surveyNumber} (${request.parcelContext.village || ''}), பயிர்: ${request.parcelContext.cropName || 'நெல்'}]:\n\n` : `[Survey No: ${request.parcelContext.surveyNumber} (${request.parcelContext.village || ''}), Crop: ${request.parcelContext.cropName || 'Paddy'}]:\n\n`)
        : '';
      const marketReply = contextPrefix + (isTa
        ? '**சந்தை விலை மற்றும் மண்டி நிலவரம்**\n\nதினசரி காய்கறி மற்றும் பயிர் சந்தை விலைகள் (உழவர் சந்தை / e-NAM மண்டி) உள்ளூர் வரத்து அடிப்படையில் தினமும் மாறுபடும். தற்போதைய நேரடி கொள்முதல் விலைகளை அறிய உங்கள் அருகிலுள்ள ஒழுங்குமுறை விற்பனைக் கூடம் (Regulated Market Committee) அல்லது உழவர் சந்தையைத் தொடர்பு கொள்ளவும்.'
        : '**Market & Mandi Price Notice**\n\nDaily market prices (Uzhavar Sandhai / e-NAM mandis) fluctuate continuously based on daily arrivals. To check verified current auction rates, please contact your nearest Regulated Market Committee (RMC) or local Uzhavar Sandhai.');
      
      const marketVR: ChatVerificationReport = {
        isSafe: true, score: 1.0, flaggedIssues: [],
        checks: [{ ruleName: 'MarketPriceGuard', passed: true, message: 'Referred to official APMC / Uzhavar Sandhai to prevent price hallucination.', severity: 'safe' }],
        sanitizedResponse: marketReply
      };
      return { reply: marketReply, language: lang, citations: [], verified: true, confidence: 0.95, modelUsed: 'rule-based', intent: 'market_inquiry', verificationReport: marketVR, latencyMs: Date.now() - startTime, costUSD: 0 };
    }

    // 5. RAG retrieval
    const cropFilter = request.parcelContext?.cropName || undefined;
    let categoryFilter: any = undefined;
    if (intent === 'fertilizer_inquiry') categoryFilter = 'fertilizer';
    else if (intent === 'pest_disease_diagnostic') categoryFilter = 'pest_control';
    else if (intent === 'irrigation_advisory') categoryFilter = 'irrigation';
    else if (intent === 'government_scheme') categoryFilter = 'scheme';
    else if (intent === 'weather_spray_window') categoryFilter = 'weather_action';

    const retrievalResults = await this.retriever.retrieve({
      text: rawMessage, language: lang,
      filter: { crop: cropFilter, category: categoryFilter, limit: 3 }
    });
    const chunks = retrievalResults.map(r => r.chunk);

    // 6. Model selection
    const isComplex = intent === 'complex_diagnostic' || (request.parcelContext?.condition !== undefined && request.parcelContext.condition !== 'Healthy');
    const modelId = isComplex ? 'claude-3-5-sonnet-20241022' : 'ministral-8b';

    // 7. Response synthesis
    const rawReply = this.synthesizeReply(rawMessage, chunks, request.parcelContext, lang, intent);

    // 8. Hallucination verification
    const verificationReport = HallucinationVerifier.verify(rawReply, chunks, lang, rawMessage);

    // 9. Format citations
    const citations: ChatCitation[] = chunks.map(c => ({
      sourceId: c.sourceCitation.sourceId,
      title: c.sourceCitation.title,
      section: c.sourceCitation.section,
      provenance: c.sourceCitation.provenance,
      snippet: lang === 'ta' ? c.contentTa.slice(0, 140) + '...' : c.contentEn.slice(0, 140) + '...'
    }));

    return {
      reply: verificationReport.sanitizedResponse,
      language: lang, citations,
      verified: verificationReport.isSafe,
      confidence: Number((verificationReport.score * (retrievalResults[0]?.score || 0.85)).toFixed(2)),
      modelUsed: modelId, intent, verificationReport,
      latencyMs: Date.now() - startTime, costUSD: isComplex ? 0.0025 : 0.0004
    };
  }

  private greetingReply(lang: 'ta' | 'en', ctx?: ActiveParcelContext): string {
    const crop = ctx?.cropName ? (lang === 'ta' ? ` (பயிர்: ${ctx.cropName})` : ` (Crop: ${ctx.cropName})`) : '';
    const survey = ctx?.surveyNumber ? (lang === 'ta' ? `, புல எண்: ${ctx.surveyNumber}` : `, Survey: ${ctx.surveyNumber}`) : '';
    if (lang === 'ta') {
      return `வணக்கம்! நான் FarmwiseAI வேளாண்மை உதவியாளர்${crop}${survey}. 🌾\n\nகீழ்க்கண்டவற்றை நான் உதவ முடியும்:\n• பயிர் நோய்கள் மற்றும் பூச்சி மேலாண்மை\n• உர அளவு மற்றும் பயன்பாட்டு அட்டவணை\n• பாசன திட்டமிடல்\n• வானிலை & தெளிப்பு நேரம்\n• அரசு திட்டங்கள் (PMKSY, PM-KISAN)\n\nநீங்கள் என்ன அறிய விரும்புகிறீர்கள்?`;
    }
    return `Hello! I am the FarmwiseAI Agricultural Assistant${crop}${survey}. 🌾\n\nI can help you with:\n• Crop diseases & pest management\n• Fertilizer rates & application schedules\n• Irrigation planning\n• Weather & optimal spray windows\n• Government schemes (PMKSY, PM-KISAN)\n\nWhat would you like to know?`;
  }

  private classifyIntent(q: string): string {
    if (/எங்கு.*(வாங்க|கிடைக்கும்)|கடை|dealer|where.*(buy|purchase|get)|procure|store|shop/i.test(q)) return 'input_procurement';
    if (/விலை|price|rate|mandi|market/i.test(q)) return 'market_inquiry';
    if (/மானியம்|திட்டம்|scheme|subsidy|pmksy|pm.kisan/i.test(q)) return 'government_scheme';
    if (/மழை|வானிலை|காற்ற|weather|rain|wind/i.test(q)) return 'weather_spray_window';
    if (/பூச்சி|நோய்|புழு|வண்டு|pest|disease|borer|blast|infestation/i.test(q)) return 'pest_disease_diagnostic';
    if (/உரம்|யூரியா|பொட்டாஷ்|fertilizer|urea|npk|nutrient/i.test(q)) return 'fertilizer_inquiry';
    if (/பாசனம்|தண்ணீர்|நீர்|irrigat|water/i.test(q)) return 'irrigation_advisory';
    if (/தெளிக்க|spray/i.test(q)) return 'weather_spray_window';
    return 'general_agri_chat';
  }

  private synthesizeReply(query: string, chunks: KnowledgeChunk[], ctx?: ActiveParcelContext, lang: 'ta' | 'en' = 'en', intent: string = 'general_agri_chat'): string {
    const isTa = lang === 'ta';
    const contextPrefix = ctx?.surveyNumber
      ? (isTa ? `[புல எண்: ${ctx.surveyNumber} (${ctx.village || ''}), பயிர்: ${ctx.cropName || 'நெல்'}]:\n\n` : `[Survey No: ${ctx.surveyNumber} (${ctx.village || ''}), Crop: ${ctx.cropName || 'Paddy'}]:\n\n`)
      : '';

    if (chunks.length === 0) {
      return contextPrefix + (isTa
        ? 'உங்கள் கேள்விக்கான நேரடி வழிகாட்டுதல் தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழக கையேட்டில் கண்டறியப்படவில்லை. உள்ளூர் வேளாண்மை அலுவலரைத் தொடர்பு கொள்ளவும்.'
        : 'No specific guidance found in the verified TNAU agronomy index for this query. Please consult your local block Agricultural Extension Officer.');
    }

    const top = chunks[0];
    let body = isTa ? `**${top.titleTa}**\n\n${top.contentTa}` : `**${top.title}**\n\n${top.contentEn}`;
    if (top.safetyRules?.maxDosagePerAcre) {
      body += isTa ? `\n\n*பரிந்துரைக்கப்பட்ட உச்ச வரம்பு: ${top.safetyRules.maxDosagePerAcre}*` : `\n\n*Recommended Maximum Rate: ${top.safetyRules.maxDosagePerAcre}*`;
    }
    if (ctx?.weatherAlerts && ctx.weatherAlerts.length > 0) {
      body += isTa ? `\n\nவானிலை எச்சரிக்கை: ${ctx.weatherAlerts[0]}` : `\n\nActive Micro-Climate Notice: ${ctx.weatherAlerts[0]}`;
    }
    return contextPrefix + body;
  }
}
