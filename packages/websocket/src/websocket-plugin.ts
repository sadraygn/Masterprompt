import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocketManager } from './websocket-manager.js';
import { WSEventTopic } from './types.js';
interface User {
  id: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    ws: WebSocketManager;
    broadcastWorkflowEvent: (workflowId: string, event: string, data: any) => void;
    broadcastCacheInvalidation: (tags: string[]) => void;
    broadcastNotification: (userId: string, notification: any) => void;
    requirePermission: (permission: string) => (request: FastifyRequest, reply: any) => Promise<void>;
  }
  
  interface FastifyRequest {
    user?: User;
  }
}

interface WebSocketPluginOptions {
  path?: string;
  heartbeatInterval?: number;
  clientTimeout?: number;
  maxSubscriptionsPerClient?: number;
  maxClientsPerRoom?: number;
  authRequired?: boolean;
}

const websocketPlugin: FastifyPluginAsync<WebSocketPluginOptions> = async (
  fastify,
  options
) => {
  const wsPath = options.path || '/ws';
  const authRequired = options.authRequired !== false;

  // Register fastify-websocket plugin
  await fastify.register(fastifyWebsocket);

  // Create WebSocket manager
  const wsManager = new WebSocketManager({
    heartbeatInterval: options.heartbeatInterval,
    clientTimeout: options.clientTimeout,
    maxSubscriptionsPerClient: options.maxSubscriptionsPerClient,
    maxClientsPerRoom: options.maxClientsPerRoom,
  });

  // Decorate fastify instance
  fastify.decorate('ws', wsManager);

  // Add helper methods
  fastify.decorate('broadcastWorkflowEvent', function(workflowId: string, event: string, data: any) {
    wsManager.broadcast(`workflow:${workflowId}:${event}`, data);
    
    // Also broadcast to general workflow topic
    wsManager.broadcast(WSEventTopic.WORKFLOW_PROGRESS, {
      workflowId,
      event,
      ...data,
    });
  });

  fastify.decorate('broadcastCacheInvalidation', function(tags: string[]) {
    wsManager.broadcast(WSEventTopic.CACHE_INVALIDATED, { tags });
  });

  fastify.decorate('broadcastNotification', function(userId: string, notification: any) {
    wsManager.broadcast(
      WSEventTopic.NOTIFICATION,
      notification,
      (client) => client.userId === userId
    );
  });

  // Register WebSocket route
  fastify.get(wsPath, { websocket: true }, (connection, request: FastifyRequest) => {
    const { socket } = connection;
    let user: User | undefined;
    let clientId: string;

    // Extract user from request if auth is required
    if (authRequired && request.user) {
      user = request.user as User;
    } else if (authRequired) {
      socket.close(1008, 'Authentication required');
      return;
    }

    // Add client to manager
    clientId = wsManager.addClient(socket, user?.id, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    fastify.log.info(`WebSocket client connected: ${clientId}`);

    // Handle connection close
    socket.on('close', () => {
      fastify.log.info(`WebSocket client disconnected: ${clientId}`);
    });
  });

  // Register request handlers
  wsManager.registerHandler('updatePresence', async (params, client) => {
    if (!client.userId) {
      throw new Error('Authentication required for presence updates');
    }

    wsManager.updatePresence(client.id, {
      userId: client.userId,
      location: params.location,
      cursor: params.cursor,
      selection: params.selection,
      metadata: params.metadata || {},
    });

    return { success: true };
  });

  wsManager.registerHandler('getPresence', async (params) => {
    const presence = wsManager.getPresence(params.location);
    return { presence };
  });

  wsManager.registerHandler('joinRoom', async (params, client) => {
    const success = wsManager.joinRoom(client.id, params.room);
    return { success };
  });

  wsManager.registerHandler('leaveRoom', async (params, client) => {
    wsManager.leaveRoom(client.id, params.room);
    return { success: true };
  });

  // Stats endpoint
  fastify.get('/api/ws/stats', {
    preHandler: [fastify.requirePermission('admin:system')],
  }, async (_request, reply) => {
    const stats = wsManager.getStats();
    return reply.send(stats);
  });

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    wsManager.stop();
  });

  fastify.log.info('WebSocket plugin registered');
};

export default fp(websocketPlugin, {
  name: '@prompt-studio/websocket',
  dependencies: ['@prompt-studio/auth-rbac'],
});