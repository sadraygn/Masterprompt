import { z } from 'zod';
import type { WebSocket } from 'ws';

// WebSocket message types
export enum WSMessageType {
  // Client -> Server
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PING = 'ping',
  
  // Server -> Client
  EVENT = 'event',
  ERROR = 'error',
  PONG = 'pong',
  
  // Bidirectional
  REQUEST = 'request',
  RESPONSE = 'response',
}

// Event topics
export enum WSEventTopic {
  // Workflow events
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',
  WORKFLOW_PROGRESS = 'workflow.progress',
  
  // LLM streaming
  LLM_STREAM_START = 'llm.stream.start',
  LLM_STREAM_TOKEN = 'llm.stream.token',
  LLM_STREAM_END = 'llm.stream.end',
  
  // System events
  CACHE_INVALIDATED = 'cache.invalidated',
  USER_UPDATED = 'user.updated',
  NOTIFICATION = 'notification',
  
  // Collaboration
  PROMPT_UPDATED = 'prompt.updated',
  WORKFLOW_UPDATED = 'workflow.updated',
  PRESENCE_UPDATED = 'presence.updated',
}

// Base message schema
export const WSMessageSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(WSMessageType),
  timestamp: z.number(),
});

// Ping/Pong messages
export const WSPingMessageSchema = WSMessageSchema.extend({
  type: z.literal(WSMessageType.PING),
});

export type WSPingMessage = z.infer<typeof WSPingMessageSchema>;

export const WSPongMessageSchema = WSMessageSchema.extend({
  type: z.literal(WSMessageType.PONG),
});

export type WSPongMessage = z.infer<typeof WSPongMessageSchema>;

// Subscribe message
export const WSSubscribeMessageSchema = WSMessageSchema.extend({
  type: z.literal(WSMessageType.SUBSCRIBE),
  topics: z.array(z.string()),
});

export type WSSubscribeMessage = z.infer<typeof WSSubscribeMessageSchema>;

// Unsubscribe message
export const WSUnsubscribeMessageSchema = WSMessageSchema.extend({
  type: z.literal(WSMessageType.UNSUBSCRIBE),
  topics: z.array(z.string()),
});

export type WSUnsubscribeMessage = z.infer<typeof WSUnsubscribeMessageSchema>;

// Event message
export const WSEventMessageSchema = WSMessageSchema.extend({
  type: z.literal(WSMessageType.EVENT),
  topic: z.string(),
  data: z.any(),
});

export type WSEventMessage = z.infer<typeof WSEventMessageSchema>;

// Error message
export const WSErrorMessageSchema = WSMessageSchema.extend({
  type: z.literal(WSMessageType.ERROR),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export type WSErrorMessage = z.infer<typeof WSErrorMessageSchema>;

// Request/Response messages for RPC-style communication
export const WSRequestMessageSchema = WSMessageSchema.extend({
  type: z.literal(WSMessageType.REQUEST),
  method: z.string(),
  params: z.any().optional(),
});

export type WSRequestMessage = z.infer<typeof WSRequestMessageSchema>;

export const WSResponseMessageSchema = WSMessageSchema.extend({
  type: z.literal(WSMessageType.RESPONSE),
  requestId: z.string(),
  result: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
});

export type WSResponseMessage = z.infer<typeof WSResponseMessageSchema>;

// Union type for all messages
export type WSMessage = 
  | WSSubscribeMessage 
  | WSUnsubscribeMessage 
  | WSEventMessage 
  | WSErrorMessage 
  | WSRequestMessage
  | WSResponseMessage
  | WSPingMessage
  | WSPongMessage;

// Client connection metadata
export interface WSClient {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  metadata: Record<string, any>;
  lastActivity: Date;
  connection: WebSocket;
}

// Room/channel concept for broadcasting
export interface WSRoom {
  name: string;
  clients: Set<string>;
  metadata: Record<string, any>;
}

// Presence data for collaboration
export interface WSPresence {
  userId: string;
  clientId: string;
  location: string; // e.g., "workflow/123", "prompt/456"
  cursor?: {
    x: number;
    y: number;
  };
  selection?: {
    start: number;
    end: number;
  };
  metadata: Record<string, any>;
  lastSeen: Date;
}