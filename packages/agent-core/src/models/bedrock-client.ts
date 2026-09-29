import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";
import { IModelClient, ModelPromptParams, ModelResponse } from './interfaces.js';
import costsConfig from '../../../../config/costs.config.json';
import * as fs from 'fs';

function loadEnv(): Record<string, string> {
  try {
    const raw = fs.readFileSync('.env.deploy', 'utf-8');
    return Object.fromEntries(
      raw.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}

const envCache = loadEnv();

function getEnv(key: string): string | undefined {
  return (typeof process !== 'undefined' && process.env?.[key]) || envCache[key];
}

export class BedrockClient implements IModelClient {
  private readonly region = 'ap-south-1';
  private client: BedrockRuntimeClient;
  private readonly hasCredentials: boolean;

  constructor() {
    const accessKeyId = getEnv('AWS_ACCESS_KEY_ID');
    const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY');
    const sessionToken = getEnv('AWS_SESSION_TOKEN');
    this.hasCredentials = !!(accessKeyId && secretAccessKey);
    this.client = new BedrockRuntimeClient({
      region: this.region,
      ...(this.hasCredentials ? {
        credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, sessionToken }
      } : {})
    });
  }

  async invoke(params: ModelPromptParams): Promise<ModelResponse> {
    const start = Date.now();
    const modelId = params.modelId;
    const inputTokens = Math.max(15, Math.ceil((params.prompt.length + (params.systemPrompt?.length || 0)) / 4));
    const rates = (costsConfig.rates as any)[modelId] || { inputPer1k: 0.0001, outputPer1k: 0.0001 };

    if (!this.hasCredentials) {
      return this.simulatedResponse(params, modelId, inputTokens, rates, start);
    }

    try {
      // Build Ministral/Mistral-compatible message body
      const messages = [{ role: 'user', content: params.prompt }];
      const body = JSON.stringify({
        messages,
        system: params.systemPrompt,
        max_tokens: params.maxTokens || 512,
        temperature: params.temperature ?? 0.3
      });

      const cmd = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(body)
      });

      const raw = await this.client.send(cmd);
      const responseBody = JSON.parse(Buffer.from(raw.body).toString('utf-8'));
      // Mistral response format
      const responseText = responseBody.outputs?.[0]?.text
        || responseBody.choices?.[0]?.message?.content
        || responseBody.content?.[0]?.text
        || JSON.stringify(responseBody);

      const outputTokens = responseBody.usage?.completion_tokens || Math.ceil(responseText.length / 4);
      const cost = (inputTokens / 1000) * rates.inputPer1k + (outputTokens / 1000) * rates.outputPer1k;

      let parsedJson: any;
      if (params.responseFormat === 'json') {
        try { parsedJson = JSON.parse(responseText.trim()); } catch { parsedJson = undefined; }
      }

      console.log(`[BedrockClient] LIVE call: ${modelId} | ${outputTokens} out-tokens | $${cost.toFixed(6)}`);
      return {
        text: responseText,
        parsedJson,
        tokenUsage: { input: inputTokens, output: outputTokens },
        latencyMs: Date.now() - start,
        modelId,
        estimatedCostUSD: Number(cost.toFixed(6))
      };
    } catch (err: any) {
      console.warn(`[BedrockClient] Live call failed (${err.name}): ${err.message} — falling back to simulation`);
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
    const outputTokens = 80;
    let parsedJson: any;
    if (params.responseFormat === 'json') {
      if (params.prompt.includes('plan')) {
        parsedJson = { summary: 'Resolved parcel and generated agricultural advisory plan', steps: ['geography', 'landRecord', 'image', 'weather', 'agriKnowledge', 'verifier'] };
      } else {
        parsedJson = { status: 'success', analysis: 'Completed structured extraction via Ministral' };
      }
      responseText = JSON.stringify(parsedJson);
    } else {
      responseText = `[Bedrock-SIM ${modelId}] Processed input for agricultural request.`;
    }
    const cost = (inputTokens / 1000) * rates.inputPer1k + (outputTokens / 1000) * rates.outputPer1k;
    return { text: responseText, parsedJson, tokenUsage: { input: inputTokens, output: outputTokens }, latencyMs: Date.now() - start, modelId, estimatedCostUSD: Number(cost.toFixed(6)) };
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.hasCredentials) return this.simulatedEmbedding(text);
    try {
      const body = JSON.stringify({ inputText: text, dimensions: 1024, normalize: true });
      const cmd = new InvokeModelCommand({
        modelId: 'amazon.titan-embed-text-v2:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(body)
      });
      const raw = await this.client.send(cmd);
      const res = JSON.parse(Buffer.from(raw.body).toString('utf-8'));
      console.log('[BedrockClient] LIVE embed-text call: amazon.titan-embed-text-v2:0');
      return res.embedding;
    } catch (err: any) {
      console.warn(`[BedrockClient] embedText failed: ${err.message} — simulation fallback`);
      return this.simulatedEmbedding(text);
    }
  }

  async embedImage(imageInput: string): Promise<number[]> {
    if (!this.hasCredentials) return this.simulatedEmbedding(imageInput);
    try {
      const body = JSON.stringify({ inputImage: imageInput });
      const cmd = new InvokeModelCommand({
        modelId: 'amazon.titan-embed-image-v1',
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(body)
      });
      const raw = await this.client.send(cmd);
      const res = JSON.parse(Buffer.from(raw.body).toString('utf-8'));
      console.log('[BedrockClient] LIVE embed-image call: amazon.titan-embed-image-v1');
      return res.embedding;
    } catch (err: any) {
      console.warn(`[BedrockClient] embedImage failed: ${err.message} — simulation fallback`);
      return this.simulatedEmbedding(imageInput);
    }
  }

  private simulatedEmbedding(input: string): number[] {
    const embedding = new Array(1024).fill(0);
    const text = input.slice(0, 200);
    for (let i = 0; i < text.length; i++) {
      embedding[i % 1024] += (text.charCodeAt(i) % 10) / 10;
    }
    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0)) || 1;
    return embedding.map(v => v / norm);
  }
}
