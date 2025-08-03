import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { checkInjection } from '../middleware/injection-check.js';

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  // Register rate limiting
  await fastify.register(rateLimit, {
    max: 100, // Maximum 100 requests
    timeWindow: '1 minute', // Per minute
    cache: 10000, // Cache up to 10000 rate limit objects
    allowList: [], // Add trusted IPs if needed
    redis: undefined, // Use in-memory store for now, can add Redis later
    skipOnError: true, // Don't apply rate limit if store is down
    keyGenerator: (request) => {
      // Use API key if present, otherwise IP
      const apiKey = request.headers.authorization?.replace('Bearer ', '');
      return apiKey || request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        error: {
          message: `Rate limit exceeded. Maximum ${context.max} requests per ${context.after}.`,
          type: 'rate_limit_exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retry_after: context.after
        }
      };
    }
  });

  // Add injection check to completion routes
  fastify.addHook('preHandler', async (request, reply) => {
    // Only check on completion endpoints
    if (request.url === '/v1/completions' || request.url === '/v1/chat/completions') {
      await checkInjection(request as any, reply);
    }
  });

  // Add security headers
  fastify.addHook('onSend', async (request, reply) => {
    reply.headers({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    });
  });

  fastify.log.info('Security plugin registered with rate limiting and injection detection');
};

export default fp(securityPlugin, {
  name: 'security',
  dependencies: ['cors', 'bearer-auth']
});