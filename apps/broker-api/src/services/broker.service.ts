import { LiteLLMService, CompletionParams } from './litellm.service.js';
import { getLangfuse } from '../config/langfuse.js';
import { mapCreativityToTemperature } from '../utils/temperature-mapper.js';
import type { ChatCompletion } from 'openai/resources/index.js';

export interface BrokerRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  creativity?: number; // 0-10 scale
  temperature?: number; // Direct temperature if provided
  max_tokens?: number;
  userId?: string;
  sessionId?: string;
  stream?: boolean;
}

export class BrokerService {
  private litellm: LiteLLMService;

  constructor() {
    this.litellm = new LiteLLMService();
  }

  async executePrompt(params: BrokerRequest): Promise<ChatCompletion> {
    const langfuse = getLangfuse();
    const trace = langfuse?.trace({
      name: 'prompt-execution',
      userId: params.userId,
      sessionId: params.sessionId,
      metadata: { 
        model: params.model,
        creativity: params.creativity,
      },
    });

    const generation = trace?.generation({
      name: 'llm-completion',
      model: params.model,
      modelParameters: {
        temperature: params.temperature ?? mapCreativityToTemperature(params.creativity),
        max_tokens: params.max_tokens,
      },
      input: params.messages,
    });

    const startTime = Date.now();

    try {
      // Calculate temperature from creativity if not provided directly
      const temperature = params.temperature ?? mapCreativityToTemperature(params.creativity);

      const response = await this.litellm.completion({
        model: params.model,
        messages: params.messages,
        temperature,
        max_tokens: params.max_tokens,
        stream: params.stream,
      });

      const endTime = Date.now();
      const latencyMs = endTime - startTime;

      // Update generation with output
      generation?.end({
        output: response.choices[0]?.message,
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
        metadata: {
          latencyMs,
          finishReason: response.choices[0]?.finish_reason,
        },
      });

      return response;
    } catch (error) {
      generation?.end({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async listModels() {
    return this.litellm.listModels();
  }
}