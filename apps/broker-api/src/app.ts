import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import bearerAuth from '@fastify/bearer-auth';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';

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
    errorResponse: (err) => {
      return { error: 'Unauthorized' };
    },
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

  return fastify;
}