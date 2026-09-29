import { IModelClient, ModelPromptParams, ModelResponse } from './interfaces.js';
import costsConfig from '../../../../config/costs.config.json';

export class BedrockClient implements IModelClient {
  private readonly region: string = 'ap-south-1';

  async invoke(params: ModelPromptParams): Promise<ModelResponse> {
    const start = Date.now();
    const modelId = params.modelId;

    // Estimate realistic token usage for input
    const inputTokens = Math.max(15, Math.ceil((params.prompt.length + (params.systemPrompt?.length || 0)) / 4));
    
    // In local / offline simulation mode, return structured output matching request
    let responseText = '';
    let outputTokens = 80;

    if (params.responseFormat === 'json') {
      if (params.prompt.includes('plan')) {
        responseText = JSON.stringify({
          summary: 'Resolved parcel and generated agricultural advisory plan',
          steps: ['geography', 'landRecord', 'image', 'weather', 'agriKnowledge', 'verifier']
        });
      } else {
        responseText = JSON.stringify({
          status: 'success',
          analysis: 'Completed structured extraction via Ministral'
        });
      }
    } else {
      responseText = `[Bedrock ${modelId}] Processed input for agricultural request.`;
    }

    const latencyMs = Math.max(10, Date.now() - start);

    // Compute cost
    const rates = (costsConfig.rates as any)[modelId] || { inputPer1k: 0.0001, outputPer1k: 0.0001 };
    const cost = (inputTokens / 1000) * rates.inputPer1k + (outputTokens / 1000) * rates.outputPer1k;

    let parsedJson: any = undefined;
    if (params.responseFormat === 'json') {
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        // ignore
      }
    }

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

  async embedText(text: string): Promise<number[]> {
    // Generates 1024-dimensional normalized vector (matching Titan Text Embeddings V2)
    const embedding = new Array(1024).fill(0);
    for (let i = 0; i < text.length; i++) {
      embedding[i % 1024] += (text.charCodeAt(i) % 10) / 10;
    }
    // Normalize vector
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) || 1;
    return embedding.map(v => v / norm);
  }

  async embedImage(imageInput: string): Promise<number[]> {
    // Generates 1024-dimensional normalized vector (matching Titan Multimodal Embeddings)
    const embedding = new Array(1024).fill(0);
    const hash = imageInput.slice(0, 100);
    for (let i = 0; i < hash.length; i++) {
      embedding[i % 1024] += (hash.charCodeAt(i) % 10) / 10;
    }
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) || 1;
    return embedding.map(v => v / norm);
  }
}