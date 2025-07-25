// Shared types for Prompt Engineering Studio

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  creativity?: number;
  temperature?: number;
  max_tokens?: number;
  userId?: string;
  sessionId?: string;
  stream?: boolean;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Model {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

export interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}