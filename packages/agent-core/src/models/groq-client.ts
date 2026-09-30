import Groq from "groq-sdk";
import { IModelClient, ModelPromptParams, ModelResponse } from './interfaces.js';
import costsConfig from '../../../../config/costs.config.json';

function loadEnv(): Record<string, string> {
  try {
    if (typeof window !== 'undefined') return {};
    if (typeof process === 'undefined' || !(process as any)?.versions?.node) return {};
    const nodeFs = typeof require !== 'undefined' ? require('fs') : null;
    if (!nodeFs?.readFileSync) return {};
    const raw = nodeFs.readFileSync('.env.deploy', 'utf-8');
    return Object.fromEntries(
      raw.split('\n').map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith('#') && l.includes('='))
        .map((l: string) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}

const envCache = loadEnv();
function getEnv(key: string): string | undefined {
  return (typeof process !== 'undefined' && process.env?.[key]) || envCache[key];
}

export class GroqClient implements IModelClient {
  private readonly apiKey?: string;
  private groq?: Groq;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || getEnv('GROQ_API_KEY');
    if (this.apiKey) {
      try {
        this.groq = new Groq({ apiKey: this.apiKey });
      } catch (err: any) {
        console.warn(`[GroqClient] Initialization error: ${err.message}`);
      }
    }
  }

  async invoke(params: ModelPromptParams): Promise<ModelResponse> {
    const start = Date.now();
    const modelId = params.modelId || 'qwen/qwen3.8-27b';
    const inputTokens = Math.max(15, Math.ceil((params.prompt.length + (params.systemPrompt?.length || 0)) / 4));
    const rates = (costsConfig.rates as any)[modelId] || { inputPer1k: 0.00005, outputPer1k: 0.00008 };

    if (!this.groq) {
      console.log(`[GroqClient] No GROQ_API_KEY — running simulation mode`);
      return this.simulatedResponse(params, modelId, inputTokens, rates, start);
    }

    try {
      const messages: any[] = [];
      if (params.systemPrompt) {
        messages.push({ role: 'system', content: params.systemPrompt });
      }
      messages.push({ role: 'user', content: params.prompt });

      const completion = await this.groq.chat.completions.create({
        model: modelId,
        messages,
        temperature: params.temperature ?? 0.3,
        max_tokens: params.maxTokens || 1024,
        ...(params.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {})
      });

      const responseText = completion.choices?.[0]?.message?.content || '';
      const outputTokens = completion.usage?.completion_tokens || Math.ceil(responseText.length / 4);
      const cost = (inputTokens / 1000) * rates.inputPer1k + (outputTokens / 1000) * rates.outputPer1k;

      let parsedJson: any;
      if (params.responseFormat === 'json') {
        try { parsedJson = JSON.parse(responseText.trim()); } catch { parsedJson = undefined; }
      }

      console.log(`[GroqClient] LIVE call: ${modelId} | ${outputTokens} out-tokens | ${Date.now() - start}ms | $${cost.toFixed(6)}`);
      return {
        text: responseText,
        parsedJson,
        tokenUsage: { input: inputTokens, output: outputTokens },
        latencyMs: Date.now() - start,
        modelId,
        estimatedCostUSD: Number(cost.toFixed(6))
      };
    } catch (err: any) {
      console.warn(`[GroqClient] Live call failed (${err.name}): ${err.message} — falling back to simulation`);
      return this.simulatedResponse(params, modelId, inputTokens, rates, start);
    }
  }

  private simulatedResponse(
    params: ModelPromptParams,
    modelId: string,
    inputTokens: number,
    rates: any,
    start: number
  ): ModelResponse {
    let responseText = '';
    let parsedJson: any;
    const outputTokens = 100;

    if (params.responseFormat === 'json') {
      parsedJson = { status: 'success', provider: 'groq', model: modelId, accelerated: true };
      responseText = JSON.stringify(parsedJson);
    } else {
      responseText = `[Groq-SIM ${modelId}] Ultra-low latency LPU response for query.`;
    }

    const cost = (inputTokens / 1000) * rates.inputPer1k + (outputTokens / 1000) * rates.outputPer1k;
    return {
      text: responseText,
      parsedJson,
      tokenUsage: { input: inputTokens, output: outputTokens },
      latencyMs: Math.max(10, Date.now() - start),
      modelId,
      estimatedCostUSD: Number(cost.toFixed(6))
    };
  }
}
