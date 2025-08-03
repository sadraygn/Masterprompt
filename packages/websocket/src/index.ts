export * from './types.js';
export { WebSocketManager } from './websocket-manager.js';
export { default as websocketPlugin } from './websocket-plugin.js';

// Re-export commonly used types
export type {
  WSClient,
  WSRoom,
  WSPresence,
  WSMessage,
  WSSubscribeMessage,
  WSUnsubscribeMessage,
  WSEventMessage,
  WSErrorMessage,
  WSRequestMessage,
  WSResponseMessage,
} from './types.js';

// Re-export enums for convenience
export { WSMessageType, WSEventTopic } from './types.js';