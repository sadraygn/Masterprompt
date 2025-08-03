import { env } from '../config/env.js';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
}

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string = 'llama3:8b';

  constructor() {
    this.baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  /**
   * List available models
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [];
    }
  }

  /**
   * Pull a model if not available
   */
  async pullModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model ${modelName}: ${response.statusText}`);
    }

    // Stream the response to track progress
    const reader = response.body?.getReader();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = new TextDecoder().decode(value);
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.status) {
            console.log(`Pulling ${modelName}: ${data.status}`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  /**
   * Generate completion
   */
  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        stream: false, // For simplicity, disable streaming for now
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate completion with streaming
   */
  async *generateStream(request: OllamaGenerateRequest): AsyncGenerator<OllamaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            yield data;
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
        }
      }
    }
  }

  /**
   * Paraphrase text using local LLM
   */
  async paraphrase(text: string, style?: 'formal' | 'casual' | 'technical' | 'simple'): Promise<string> {
    const styleInstructions = {
      formal: 'Use formal, professional language',
      casual: 'Use casual, conversational language',
      technical: 'Use technical, precise language',
      simple: 'Use simple, easy-to-understand language',
    };

    const prompt = `Please paraphrase the following text${style ? ' in a ' + style + ' style' : ''}:

"${text}"

${style ? styleInstructions[style] + '.' : ''} Maintain the original meaning while using different words and sentence structure. Provide only the paraphrased text without any additional explanation.`;

    try {
      // Ensure model is available
      const models = await this.listModels();
      const modelExists = models.some(m => m.name === this.defaultModel);
      
      if (!modelExists) {
        console.log(`Model ${this.defaultModel} not found, pulling...`);
        await this.pullModel(this.defaultModel);
      }

      const startTime = Date.now();
      
      const response = await this.generate({
        model: this.defaultModel,
        prompt,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 500,
        },
      });

      const latency = Date.now() - startTime;
      console.log(`Paraphrase generated in ${latency}ms`);

      return response.response.trim();
    } catch (error) {
      console.error('Error paraphrasing with Ollama:', error);
      throw new Error('Failed to paraphrase text');
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get model info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if Ollama is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}