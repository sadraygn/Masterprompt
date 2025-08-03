import { EventEmitter } from 'eventemitter3';
import { WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import {
  WSClient,
  WSRoom,
  WSPresence,
  WSMessage,
  WSMessageType,
  WSEventTopic,
  WSSubscribeMessage,
  WSUnsubscribeMessage,
  WSEventMessage,
  WSErrorMessage,
  WSRequestMessage,
  WSResponseMessage,
  WSSubscribeMessageSchema,
  WSUnsubscribeMessageSchema,
  WSRequestMessageSchema,
} from './types.js';

export interface WebSocketManagerOptions {
  heartbeatInterval?: number;
  clientTimeout?: number;
  maxSubscriptionsPerClient?: number;
  maxClientsPerRoom?: number;
}

export class WebSocketManager extends EventEmitter {
  private clients: Map<string, WSClient> = new Map();
  private rooms: Map<string, WSRoom> = new Map();
  private presence: Map<string, WSPresence> = new Map();
  private requestHandlers: Map<string, (params: any, client: WSClient) => Promise<any>> = new Map();
  private options: Required<WebSocketManagerOptions>;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(options: WebSocketManagerOptions = {}) {
    super();
    this.options = {
      heartbeatInterval: options.heartbeatInterval || 30000,
      clientTimeout: options.clientTimeout || 60000,
      maxSubscriptionsPerClient: options.maxSubscriptionsPerClient || 100,
      maxClientsPerRoom: options.maxClientsPerRoom || 1000,
    };
    
    this.startHeartbeat();
  }

  /**
   * Add a new WebSocket client
   */
  addClient(ws: WebSocket, userId?: string, metadata: Record<string, any> = {}): string {
    const clientId = nanoid();
    const client: WSClient = {
      id: clientId,
      userId,
      subscriptions: new Set(),
      metadata,
      lastActivity: new Date(),
      connection: ws,
    };

    this.clients.set(clientId, client);

    // Set up message handler
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        await this.handleMessage(clientId, message);
      } catch (error) {
        this.sendError(clientId, 'PARSE_ERROR', 'Invalid message format');
      }
    });

    // Clean up on disconnect
    ws.on('close', () => {
      this.removeClient(clientId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });

    // Send welcome message
    this.send(clientId, {
      id: nanoid(),
      type: WSMessageType.EVENT,
      topic: 'connection.established',
      timestamp: Date.now(),
      data: { clientId },
    });

    this.emit('client.connected', { clientId, userId });
    return clientId;
  }

  /**
   * Remove a client
   */
  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all rooms
    for (const room of this.rooms.values()) {
      room.clients.delete(clientId);
    }

    // Remove presence
    this.presence.delete(clientId);

    // Close connection if still open
    if (client.connection.readyState === WebSocket.OPEN) {
      client.connection.close();
    }

    this.clients.delete(clientId);
    this.emit('client.disconnected', { clientId, userId: client.userId });
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(clientId: string, message: WSMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    switch (message.type) {
      case WSMessageType.SUBSCRIBE:
        await this.handleSubscribe(clientId, message as WSSubscribeMessage);
        break;
      
      case WSMessageType.UNSUBSCRIBE:
        await this.handleUnsubscribe(clientId, message as WSUnsubscribeMessage);
        break;
      
      case WSMessageType.REQUEST:
        await this.handleRequest(clientId, message as WSRequestMessage);
        break;
      
      case WSMessageType.PING:
        this.send(clientId, {
          id: nanoid(),
          type: WSMessageType.PONG,
          timestamp: Date.now(),
        });
        break;
      
      default:
        this.sendError(clientId, 'UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle subscription requests
   */
  private async handleSubscribe(clientId: string, message: WSSubscribeMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const validation = WSSubscribeMessageSchema.safeParse(message);
    if (!validation.success) {
      this.sendError(clientId, 'INVALID_SUBSCRIBE', 'Invalid subscription message');
      return;
    }

    for (const topic of message.topics) {
      if (client.subscriptions.size >= this.options.maxSubscriptionsPerClient) {
        this.sendError(clientId, 'MAX_SUBSCRIPTIONS', 'Maximum subscriptions reached');
        break;
      }
      
      client.subscriptions.add(topic);
      
      // Add to room if it's a room subscription
      if (topic.startsWith('room:')) {
        const roomName = topic.substring(5);
        this.joinRoom(clientId, roomName);
      }
    }

    this.emit('client.subscribed', { clientId, topics: message.topics });
  }

  /**
   * Handle unsubscription requests
   */
  private async handleUnsubscribe(clientId: string, message: WSUnsubscribeMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const validation = WSUnsubscribeMessageSchema.safeParse(message);
    if (!validation.success) {
      this.sendError(clientId, 'INVALID_UNSUBSCRIBE', 'Invalid unsubscribe message');
      return;
    }

    for (const topic of message.topics) {
      client.subscriptions.delete(topic);
      
      // Leave room if it's a room subscription
      if (topic.startsWith('room:')) {
        const roomName = topic.substring(5);
        this.leaveRoom(clientId, roomName);
      }
    }

    this.emit('client.unsubscribed', { clientId, topics: message.topics });
  }

  /**
   * Handle RPC-style requests
   */
  private async handleRequest(clientId: string, message: WSRequestMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const validation = WSRequestMessageSchema.safeParse(message);
    if (!validation.success) {
      this.sendError(clientId, 'INVALID_REQUEST', 'Invalid request message');
      return;
    }

    const handler = this.requestHandlers.get(message.method);
    if (!handler) {
      this.send(clientId, {
        id: nanoid(),
        type: WSMessageType.RESPONSE,
        timestamp: Date.now(),
        requestId: message.id,
        error: {
          code: 'METHOD_NOT_FOUND',
          message: `Method ${message.method} not found`,
        },
      } as WSResponseMessage);
      return;
    }

    try {
      const result = await handler(message.params, client);
      this.send(clientId, {
        id: nanoid(),
        type: WSMessageType.RESPONSE,
        timestamp: Date.now(),
        requestId: message.id,
        result,
      } as WSResponseMessage);
    } catch (error) {
      this.send(clientId, {
        id: nanoid(),
        type: WSMessageType.RESPONSE,
        timestamp: Date.now(),
        requestId: message.id,
        error: {
          code: 'REQUEST_ERROR',
          message: error instanceof Error ? error.message : 'Request failed',
          details: error,
        },
      } as WSResponseMessage);
    }
  }

  /**
   * Send a message to a specific client
   */
  send(clientId: string, message: WSMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.connection.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.connection.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      return false;
    }
  }

  /**
   * Send an error message to a client
   */
  private sendError(clientId: string, code: string, message: string, details?: any): void {
    this.send(clientId, {
      id: nanoid(),
      type: WSMessageType.ERROR,
      timestamp: Date.now(),
      error: { code, message, details },
    } as WSErrorMessage);
  }

  /**
   * Broadcast an event to subscribed clients
   */
  broadcast(topic: string, data: any, filter?: (client: WSClient) => boolean): number {
    const message: WSEventMessage = {
      id: nanoid(),
      type: WSMessageType.EVENT,
      topic,
      timestamp: Date.now(),
      data,
    };

    let sent = 0;
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(topic) || client.subscriptions.has('*')) {
        if (!filter || filter(client)) {
          if (this.send(client.id, message)) {
            sent++;
          }
        }
      }
    }

    return sent;
  }

  /**
   * Broadcast to all clients in a room
   */
  broadcastToRoom(roomName: string, topic: string, data: any): number {
    const room = this.rooms.get(roomName);
    if (!room) return 0;

    const message: WSEventMessage = {
      id: nanoid(),
      type: WSMessageType.EVENT,
      topic,
      timestamp: Date.now(),
      data,
    };

    let sent = 0;
    for (const clientId of room.clients) {
      if (this.send(clientId, message)) {
        sent++;
      }
    }

    return sent;
  }

  /**
   * Join a room
   */
  joinRoom(clientId: string, roomName: string): boolean {
    let room = this.rooms.get(roomName);
    if (!room) {
      room = {
        name: roomName,
        clients: new Set(),
        metadata: {},
      };
      this.rooms.set(roomName, room);
    }

    if (room.clients.size >= this.options.maxClientsPerRoom) {
      return false;
    }

    room.clients.add(clientId);
    this.emit('room.joined', { clientId, roomName });
    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(clientId: string, roomName: string): void {
    const room = this.rooms.get(roomName);
    if (!room) return;

    room.clients.delete(clientId);
    
    // Remove empty rooms
    if (room.clients.size === 0) {
      this.rooms.delete(roomName);
    }

    this.emit('room.left', { clientId, roomName });
  }

  /**
   * Update presence information
   */
  updatePresence(clientId: string, presence: Omit<WSPresence, 'clientId' | 'lastSeen'>): void {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) return;

    const fullPresence: WSPresence = {
      ...presence,
      clientId,
      lastSeen: new Date(),
    };

    this.presence.set(clientId, fullPresence);

    // Broadcast presence update to others in the same location
    this.broadcast(
      WSEventTopic.PRESENCE_UPDATED,
      fullPresence,
      (other) => other.id !== clientId && other.subscriptions.has(`presence:${presence.location}`)
    );
  }

  /**
   * Get presence information for a location
   */
  getPresence(location: string): WSPresence[] {
    const result: WSPresence[] = [];
    for (const presence of this.presence.values()) {
      if (presence.location === location) {
        result.push(presence);
      }
    }
    return result;
  }

  /**
   * Register a request handler
   */
  registerHandler(method: string, handler: (params: any, client: WSClient) => Promise<any>): void {
    this.requestHandlers.set(method, handler);
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeout = this.options.clientTimeout;
      
      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastActivity.getTime() > timeout) {
          console.log(`Client ${clientId} timed out`);
          this.removeClient(clientId);
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop the WebSocket manager
   */
  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all connections
    for (const client of this.clients.values()) {
      if (client.connection.readyState === WebSocket.OPEN) {
        client.connection.close();
      }
    }

    this.clients.clear();
    this.rooms.clear();
    this.presence.clear();
    this.requestHandlers.clear();
    this.removeAllListeners();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      clients: this.clients.size,
      rooms: this.rooms.size,
      presence: this.presence.size,
      handlers: this.requestHandlers.size,
      subscriptions: Array.from(this.clients.values()).reduce(
        (sum, client) => sum + client.subscriptions.size,
        0
      ),
    };
  }
}