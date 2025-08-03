import { OpenAI } from 'openai';
import { env } from '../config/env.js';

export interface CompletionParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export class LiteLLMService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.LITELLM_MASTER_KEY,
      baseURL: `${env.LITELLM_BASE_URL}/v1`,
    });
  }

  async completion(params: CompletionParams) {
    try {
      const response = await this.client.chat.completions.create({
        model: params.model,
        messages: params.messages as any,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        stream: params.stream,
      });

      return response;
    } catch (error) {
      // LiteLLM returns detailed error messages
      if (error instanceof OpenAI.APIError) {
        throw new Error(`LLM Error: ${error.message}`);
      }
      throw error;
    }
  }

  async listModels() {
    try {
      const response = await this.client.models.list();
      return response.data;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`Failed to list models: ${error.message}`);
      }
      throw error;
    }
  }
}