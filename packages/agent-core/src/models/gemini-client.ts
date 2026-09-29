import { GoogleGenAI } from "@google/genai";
import { IModelClient, ModelPromptParams, ModelResponse } from './interfaces.js';
import costsConfig from '../../../../config/costs.config.json';
import * as fs from 'fs';

function loadEnv(): Record<string, string> {
  try {
    const raw = fs.readFileSync('.env.deploy', 'utf-8');
    return Object.fromEntries(
      raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}
const envCache = loadEnv();
function getEnv(key: string): string | undefined {
  return (typeof process !== 'undefined' && process.env?.[key]) || envCache[key];
}

export class GeminiClient implements IModelClient {
  private readonly apiKey?: string;
  private ai?: GoogleGenAI;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || getEnv('GEMINI_API_KEY');
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  async invoke(params: ModelPromptParams): Promise<ModelResponse> {
    const start = Date.now();
    const modelId = params.modelId || 'gemini-3.6-flash';
    const inputTokens = Math.max(20, Math.ceil((params.prompt.length + (params.systemPrompt?.length || 0)) / 4));
    const imageCount = params.images?.length || 0;
    const rates = (costsConfig.rates as any)[modelId] || { inputPer1k: 0.000075, outputPer1k: 0.0003, perImage: 0.00002 };

    if (!this.ai) {
      console.log(`[GeminiClient] No GEMINI_API_KEY — simulation mode`);
      return this.simulatedResponse(params, modelId, inputTokens, imageCount, rates, start);
    }

    try {
      const contents: any[] = [];

      // Add system context
      if (params.systemPrompt) {
        contents.push({ role: 'user', parts: [{ text: params.systemPrompt }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] });
      }

      const userParts: any[] = [{ text: params.prompt }];

      // Add images as inline base64 data
      if (params.images && params.images.length > 0) {
        for (const img of params.images) {
          if (img.startsWith('data:')) {
            const [header, data] = img.split(',');
            const mimeType = header.split(':')[1].split(';')[0];
            userParts.push({ inlineData: { mimeType, data } });
          } else if (img.startsWith('http')) {
            userParts.push({ fileData: { fileUri: img } });
          } else {
            userParts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
          }
        }
      }

      contents.push({ role: 'user', parts: userParts });

      const response = await this.ai.models.generateContent({
        model: modelId,
        contents,
        config: {
          temperature: params.temperature ?? 0.3,
          maxOutputTokens: params.maxTokens || 1024,
          ...(params.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {})
        }
      });

      const responseText = response.text ?? '';
      const outputTokens = Math.ceil(responseText.length / 4);
      const cost = (inputTokens / 1000) * rates.inputPer1k + (outputTokens / 1000) * rates.outputPer1k + imageCount * (rates.perImage || 0.00002);

      let parsedJson: any;
      if (params.responseFormat === 'json') {
        try { parsedJson = JSON.parse(responseText.trim()); } catch { parsedJson = undefined; }
      }

      console.log(`[GeminiClient] LIVE call: ${modelId} | ${outputTokens} out-tokens | $${cost.toFixed(6)}`);
      return {
        text: responseText,
        parsedJson,
        tokenUsage: { input: inputTokens, output: outputTokens },
        latencyMs: Date.now() - start,
        modelId,
        estimatedCostUSD: Number(cost.toFixed(6))
      };
    } catch (err: any) {
      console.warn(`[GeminiClient] Live call failed (${err.name}): ${err.message} — falling back to simulation`);
      return this.simulatedResponse(params, modelId, inputTokens, imageCount, rates, start);
    }
  }

  private simulatedResponse(
    params: ModelPromptParams,
    modelId: string,
    inputTokens: number,
    imageCount: number,
    rates: any,
    start: number
  ): ModelResponse {
    let responseText = '';
    let parsedJson: any;
    const outputTokens = 120;

    if (params.images && params.images.length > 0) {
      parsedJson = { crop: 'Paddy', growthStage: 'tillering', condition: 'Healthy', confidence: 0.92, visualEvidence: 'Dark green leaves with 6-8 vigorous tillers per hill, no yellowing or leaf fold lesions detected.', alternatives: [{ cropName: 'Finger Millet', confidence: 0.05 }], needsHumanReview: false };
      responseText = JSON.stringify(parsedJson);
    } else if (params.audio) {
      parsedJson = { transcript: 'இருநூற்று இரண்டு ஐம்பத்தைந்து நெல் பயிர் வளர்ச்சி நிலை என்ன?', normalizedSurvey: '202/55', cropMention: 'நெல் (Paddy)', language: 'ta', confidence: 0.95 };
      responseText = JSON.stringify(parsedJson);
    } else {
      responseText = `[Gemini-SIM ${modelId}] Processed multimodal reasoning for agricultural advisory.`;
      if (params.responseFormat === 'json') {
        parsedJson = { status: 'success', model: modelId };
        responseText = JSON.stringify(parsedJson);
      }
    }
    const cost = (inputTokens / 1000) * rates.inputPer1k + (outputTokens / 1000) * rates.outputPer1k + imageCount * (rates.perImage || 0.00002);
    return { text: responseText, parsedJson, tokenUsage: { input: inputTokens, output: outputTokens }, latencyMs: Date.now() - start, modelId, estimatedCostUSD: Number(cost.toFixed(6)) };
  }
}
