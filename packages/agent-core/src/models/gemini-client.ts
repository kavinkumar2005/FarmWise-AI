import { IModelClient, ModelPromptParams, ModelResponse } from './interfaces.js';
import costsConfig from '../../../../config/costs.config.json';

export class GeminiClient implements IModelClient {
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  async invoke(params: ModelPromptParams): Promise<ModelResponse> {
    const start = Date.now();
    const modelId = params.modelId || 'gemini-1.5-flash';

    const inputTokens = Math.max(20, Math.ceil((params.prompt.length + (params.systemPrompt?.length || 0)) / 4));
    let outputTokens = 120;
    const imageCount = params.images?.length || 0;

    let responseText = '';
    let parsedJson: any = undefined;

    if (params.images && params.images.length > 0) {
      // Vision analysis response
      parsedJson = {
        crop: 'Paddy',
        growthStage: 'tillering',
        condition: 'Healthy',
        confidence: 0.92,
        visualEvidence: 'Dark green leaves with 6-8 vigorous tillers per hill, no yellowing or leaf fold lesions detected.',
        alternatives: [{ cropName: 'Finger Millet', confidence: 0.05 }],
        needsHumanReview: false
      };
      responseText = JSON.stringify(parsedJson);
    } else if (params.audio) {
      // Audio transcription response
      parsedJson = {
        transcript: 'இருநூற்று இரண்டு ஐம்பத்தைந்து நெல் பயிர் வளர்ச்சி நிலை என்ன?',
        normalizedSurvey: '202/55',
        cropMention: 'நெல் (Paddy)',
        language: 'ta',
        confidence: 0.95
      };
      responseText = JSON.stringify(parsedJson);
    } else {
      responseText = `[Gemini ${modelId}] Processed multimodal reasoning for agricultural advisory.`;
      if (params.responseFormat === 'json') {
        parsedJson = { status: 'success', model: modelId };
        responseText = JSON.stringify(parsedJson);
      }
    }

    const latencyMs = Math.max(15, Date.now() - start);

    // Compute cost using configured rates
    const rates = (costsConfig.rates as any)[modelId] || { inputPer1k: 0.000075, outputPer1k: 0.0003, perImage: 0.00002 };
    const cost =
      (inputTokens / 1000) * rates.inputPer1k +
      (outputTokens / 1000) * rates.outputPer1k +
      imageCount * (rates.perImage || 0.00002);

    return {
      text: responseText,
      parsedJson,
      tokenUsage: {
        input: inputTokens,
        output: outputTokens
      },
      latencyMs,
      modelId,
      estimatedCostUSD: Number(cost.toFixed(6))
    };
  }
}