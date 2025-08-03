import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { CacheService, CacheConfig, CacheOptions, CacheKeys } from './cache-service.js';

// Cache-specific permissions
export const CachePermissions = {
  CACHE_INVALIDATE: 'cache:invalidate',
  CACHE_VIEW: 'cache:view',
} as const;

declare module 'fastify' {
  interface FastifyInstance {
    cache: CacheService;
    cacheMethod: <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      options?: {
        cacheKey?: (...args: Parameters<T>) => string;
        ttl?: number;
        tags?: string[];
      }
    ) => T;
    requirePermission: (permission: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    cacheWorkflow: (workflowId: string, fn: () => Promise<any>, ttl?: number) => Promise<any>;
    cacheCompletion: (model: string, prompt: string, fn: () => Promise<any>, ttl?: number) => Promise<any>;
  }

  interface FastifyReply {
    cache: (options?: CacheOptions) => FastifyReply;
    noCache: () => FastifyReply;
    cacheControl: (directive: string) => FastifyReply;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

interface CachePluginOptions extends CacheConfig {
  routes?: {
    enabled?: boolean;
    ttl?: number;
    exclude?: string[];
    include?: string[];
  };
}

const cachePlugin: FastifyPluginAsync<CachePluginOptions> = async (
  fastify,
  options
) => {
  // Initialize cache service
  const cacheService = new CacheService(options);
  
  // Decorate fastify instance
  fastify.decorate('cache', cacheService);
  fastify.decorate('cacheMethod', function(fn, options) {
    return cacheService.memoize(fn, options);
  });

  // Add cache control to reply
  fastify.decorateReply('cache', function(this: FastifyReply, cacheOptions?: CacheOptions) {
    const reply = this;
    
    // Set cache headers
    const ttl = cacheOptions?.ttl || options.ttl.default;
    reply.header('Cache-Control', `public, max-age=${ttl}`);
    reply.header('X-Cache-Tags', (cacheOptions?.tags || []).join(','));
    
    return reply;
  });

  fastify.decorateReply('noCache', function(this: FastifyReply) {
    return this.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  });

  fastify.decorateReply('cacheControl', function(this: FastifyReply, directive: string) {
    return this.header('Cache-Control', directive);
  });

  // Route caching hook
  if (options.routes?.enabled !== false) {
    fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip if method is not cacheable
      if (!['GET', 'HEAD'].includes(request.method)) {
        return;
      }

      // Check if route should be cached
      const { exclude = [], include = [] } = options.routes || {};
      const path = request.routerPath;
      
      // Check exclusions
      if (exclude.some(pattern => path.includes(pattern))) {
        return;
      }

      // Check inclusions (if specified)
      if (include.length > 0 && !include.some(pattern => path.includes(pattern))) {
        return;
      }

      // Generate cache key
      const cacheKey = cacheService.generateKey('route', {
        method: request.method,
        path: request.url,
        query: request.query,
        user: request.user?.id,
      });

      // Try to get from cache
      const cached = await cacheService.get<{
        statusCode: number;
        headers: Record<string, string>;
        payload: any;
      }>(cacheKey);

      if (cached) {
        // Set headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          reply.header(key, value);
        });
        reply.header('X-Cache', 'HIT');
        
        // Send cached response
        reply.code(cached.statusCode).send(cached.payload);
        return;
      }

      // Store original send function
      const originalSend = reply.send.bind(reply);
      
      // Override send to cache response
      reply.send = function(payload: any) {
        // Only cache successful responses
        const statusCode = reply.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
          // Get response headers
          const headers: Record<string, string> = {};
          const rawHeaders = reply.getHeaders();
          Object.entries(rawHeaders).forEach(([key, value]) => {
            headers[key] = String(value);
          });

          // Cache the response
          cacheService.set(cacheKey, {
            statusCode,
            headers,
            payload,
          }, {
            ttl: options.routes?.ttl || options.ttl.medium,
          }).catch((err) => {
            fastify.log.error(err, 'Failed to cache response');
          });
        }

        reply.header('X-Cache', 'MISS');
        return originalSend(payload);
      };
    });
  }

  // Cache invalidation endpoint
  fastify.post<{
    Body: {
      tags?: string[];
      keys?: string[];
      all?: boolean;
    };
  }>('/api/cache/invalidate', {
    preHandler: [fastify.requirePermission(CachePermissions.CACHE_INVALIDATE)],
  }, async (request, reply) => {
    const { tags, keys, all } = request.body;

    if (all) {
      await cacheService.clear();
      return reply.send({ message: 'All cache cleared' });
    }

    if (tags && tags.length > 0) {
      await cacheService.clearByTags(tags);
      return reply.send({ message: `Cache cleared for tags: ${tags.join(', ')}` });
    }

    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => cacheService.del(key)));
      return reply.send({ message: `Cache cleared for ${keys.length} keys` });
    }

    return reply.code(400).send({ error: 'No invalidation criteria provided' });
  });

  // Cache stats endpoint
  fastify.get('/api/cache/stats', {
    preHandler: [fastify.requirePermission(CachePermissions.CACHE_VIEW)],
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const stats = cacheService.getStats();
    return reply.send(stats);
  });

  // Workflow caching decorators
  fastify.decorate('cacheWorkflow', async function(
    workflowId: string,
    fn: () => Promise<any>,
    ttl?: number
  ) {
    return cacheService.wrap(
      CacheKeys.workflow(workflowId),
      fn,
      {
        ttl: ttl || options.ttl.long,
        tags: ['workflow', `workflow:${workflowId}`],
      }
    );
  });

  // LLM completion caching
  fastify.decorate('cacheCompletion', async function(
    model: string,
    prompt: string,
    fn: () => Promise<any>,
    ttl?: number
  ) {
    const hash = cacheService.generateKey('prompt', prompt);
    return cacheService.wrap(
      CacheKeys.completion(model, hash),
      fn,
      {
        ttl: ttl || options.ttl.long,
        tags: ['completion', `model:${model}`],
      }
    );
  });

  fastify.log.info('Cache plugin registered');
};

export default fp(cachePlugin, {
  name: '@prompt-studio/cache',
  dependencies: ['@prompt-studio/auth-rbac'],
});