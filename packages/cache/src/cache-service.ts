import { caching, Cache } from 'cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import Redis from 'ioredis';
import QuickLRU from 'quick-lru';
import pMemoize from 'p-memoize';
import * as crypto from 'crypto';

export interface CacheConfig {
  redis: {
    url: string;
    keyPrefix?: string;
  };
  ttl: {
    default: number;
    short: number;
    medium: number;
    long: number;
  };
  memory: {
    maxSize: number;
    maxAge: number;
  };
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  key?: string;
}

export class CacheService {
  private redisCache!: Cache;
  private memoryCache: QuickLRU<string, any>;
  private config: CacheConfig;
  private tagStore: Map<string, Set<string>>;

  constructor(config: CacheConfig) {
    this.config = config;
    this.tagStore = new Map();
    
    // Initialize memory cache
    this.memoryCache = new QuickLRU({
      maxSize: config.memory.maxSize,
      maxAge: config.memory.maxAge,
    });

    // Initialize Redis cache
    this.initializeRedisCache();
  }

  private async initializeRedisCache() {
    const redisClient = new Redis(this.config.redis.url);
    
    this.redisCache = await caching(
      redisStore,
      {
        client: redisClient,
        ttl: this.config.ttl.default,
      }
    );
  }

  /**
   * Generate cache key
   */
  generateKey(prefix: string, params: any): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(params))
      .digest('hex')
      .substring(0, 16);
    
    return `${this.config.redis.keyPrefix}:${prefix}:${hash}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }

    // Check Redis cache
    const value = await this.redisCache.get<T>(key);
    
    if (value !== undefined) {
      // Store in memory cache for faster subsequent access
      this.memoryCache.set(key, value);
    }

    return value;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || this.config.ttl.default;
    
    // Set in both caches
    this.memoryCache.set(key, value);
    await this.redisCache.set(key, value, ttl);

    // Handle tags
    if (options?.tags) {
      for (const tag of options.tags) {
        if (!this.tagStore.has(tag)) {
          this.tagStore.set(tag, new Set());
        }
        this.tagStore.get(tag)!.add(key);
      }
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redisCache.del(key);
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(tags: string[]): Promise<void> {
    const keysToDelete = new Set<string>();
    
    for (const tag of tags) {
      const keys = this.tagStore.get(tag);
      if (keys) {
        keys.forEach(key => keysToDelete.add(key));
        this.tagStore.delete(tag);
      }
    }

    // Delete all keys
    for (const key of keysToDelete) {
      await this.del(key);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.redisCache.reset();
    this.tagStore.clear();
  }

  /**
   * Create a memoized function with caching
   */
  memoize<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: {
      cacheKey?: (...args: Parameters<T>) => string;
      ttl?: number;
      tags?: string[];
    }
  ): T {
    const cacheKeyFn = options?.cacheKey || ((...args) => {
      return this.generateKey(fn.name || 'memoized', args);
    });

    return pMemoize(fn, {
      cache: {
        get: (key: string) => this.get(key),
        set: (key: string, value: any) => this.set(key, value, {
          ttl: options?.ttl,
          tags: options?.tags,
        }),
        has: async (key: string) => {
          const value = await this.get(key);
          return value !== undefined;
        },
        delete: (key: string) => this.del(key),
      },
      cacheKey: cacheKeyFn as any,
    }) as T;
  }

  /**
   * Wrap a function with cache-aside pattern
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, options);
    
    return result;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.config.memory.maxSize,
      },
      tags: {
        count: this.tagStore.size,
        keys: Array.from(this.tagStore.entries()).map(([tag, keys]) => ({
          tag,
          count: keys.size,
        })),
      },
    };
  }
}

// Cache key builders for common patterns
export const CacheKeys = {
  workflow: (id: string) => `workflow:${id}`,
  workflowList: (userId?: string) => userId ? `workflows:user:${userId}` : 'workflows:all',
  completion: (model: string, hash: string) => `completion:${model}:${hash}`,
  user: (id: string) => `user:${id}`,
  session: (id: string) => `session:${id}`,
  apiKey: (key: string) => `apikey:${key}`,
  evaluation: (workflowId: string, version: string) => `eval:${workflowId}:${version}`,
  flowise: (chatflowId: string) => `flowise:${chatflowId}`,
  vectorSearch: (query: string, limit: number) => `vector:${crypto.createHash('md5').update(query).digest('hex')}:${limit}`,
};