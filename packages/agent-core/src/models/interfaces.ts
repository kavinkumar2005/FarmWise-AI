export interface ModelPromptParams {
  modelId: string;
  systemPrompt?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  images?: string[]; // base64 or URL
  audio?: string; // base64
}

export interface ModelResponse {
  text: string;
  parsedJson?: any;
  tokenUsage: {
    input: number;
    output: number;
  };
  latencyMs: number;
  modelId: string;
  estimatedCostUSD: number;
}

export interface IModelClient {
  invoke(params: ModelPromptParams): Promise<ModelResponse>;
  embedText?(text: string): Promise<number[]>;
  embedImage?(imageBytes: string): Promise<number[]>;
}