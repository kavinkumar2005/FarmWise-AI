import { IModelClient } from './interfaces.js';
import { BedrockClient } from './bedrock-client.js';
import { GeminiClient } from './gemini-client.js';
import { ClaudeClient } from './claude-client.js';
import modelsConfig from '../../../../config/models.config.json';

export class ModelFactory {
  private static bedrockClient = new BedrockClient();
  private static geminiClient = new GeminiClient();
  private static claudeClient = new ClaudeClient();

  static getClientForModel(modelKeyOrId: string): { client: IModelClient; modelId: string } {
    const config = (modelsConfig.models as Record<string, any>)[modelKeyOrId];
    const provider = config?.provider || 'bedrock';
    const modelId = config?.id || modelKeyOrId;

    if (provider === 'google' || modelKeyOrId.includes('gemini')) {
      return { client: this.geminiClient, modelId };
    }
    if (provider === 'anthropic' || modelKeyOrId.includes('claude')) {
      return { client: this.claudeClient, modelId };
    }
    return { client: this.bedrockClient, modelId };
  }
}