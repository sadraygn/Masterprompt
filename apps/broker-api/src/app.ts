import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import bearerAuth from '@fastify/bearer-auth';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';
import { createCacheConfig, cachePlugin } from '@prompt-studio/cache';
import { websocketPlugin } from '@prompt-studio/websocket';
import { AuditService } from '@prompt-studio/auth';
import { samlPlugin, rbacPlugin } from '@prompt-studio/auth';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  await fastify.register(bearerAuth, {
    keys: new Set([env.API_BEARER_TOKEN]),
    errorResponse: (_err) => {
      return { error: 'Unauthorized' };
    },
  });

  // Register security plugin (rate limiting + injection detection)
  await fastify.register(import('./plugins/security.js'));

  // Initialize audit service
  const auditService = new AuditService({
    storage: 'database', // or 'redis' depending on your setup
    retention: 90, // days
  });

  // Register authentication plugins
  if (env.SAML_ENABLED) {
    await fastify.register(samlPlugin, {
      providers: {
        default: {
          entryPoint: env.SAML_ENTRY_POINT,
          issuer: env.SAML_ISSUER,
          cert: env.SAML_CERT,
        },
      },
    });
  }

  // Register RBAC plugin
  await fastify.register(rbacPlugin, {
    auditService,
  });

  // Register caching plugin
  await fastify.register(cachePlugin, createCacheConfig({
    redis: {
      url: env.REDIS_URL || 'redis://localhost:6379',
    },
  }));

  // Register WebSocket plugin
  await fastify.register(websocketPlugin, {
    path: '/ws',
    authRequired: true,
  });

  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Prompt Engineering Studio - Broker API',
        description: 'Central broker for LLM requests with observability',
        version: '0.1.0',
      },
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Register routes
  await fastify.register(import('./routes/health/index.js'));
  await fastify.register(import('./routes/completions/index.js'), { prefix: '/v1' });
  await fastify.register(import('./routes/models/index.js'), { prefix: '/v1' });
  await fastify.register(import('./routes/workflows/index.js'), { prefix: '/v1/workflows' });
  await fastify.register(import('./routes/paraphrase/index.js'), { prefix: '/v1/paraphrase' });

  // Add workflow event broadcasting
  fastify.addHook('onResponse', async (request, reply) => {
    // Broadcast workflow events if applicable
    if (request.url.includes('/workflows') && reply.statusCode < 300) {
      const workflowId = (request.params as any)?.id as string;
      if (workflowId && request.method === 'POST' && request.url.includes('/execute')) {
        fastify.broadcastWorkflowEvent(workflowId, 'started', {
          timestamp: new Date(),
        });
      }
    }
  });

  return fastify;
}