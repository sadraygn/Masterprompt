export { CacheService, CacheKeys } from './cache-service.js';
export type { CacheConfig, CacheOptions } from './cache-service.js';
export { default as cachePlugin, CachePermissions } from './cache-plugin.js';

// Re-export commonly used cache key builders
export { CacheKeys as Keys } from './cache-service.js';

// Export cache TTL presets
export const CacheTTL = {
  NONE: 0,
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;

// Export cache strategies
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
}

import type { CacheConfig } from './cache-service.js';

// Helper function to create cache config
export function createCacheConfig(overrides?: Partial<CacheConfig>): CacheConfig {
  return {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      keyPrefix: process.env.CACHE_KEY_PREFIX || 'ps',
      ...overrides?.redis,
    },
    ttl: {
      default: CacheTTL.MEDIUM,
      short: CacheTTL.SHORT,
      medium: CacheTTL.MEDIUM,
      long: CacheTTL.LONG,
      ...overrides?.ttl,
    },
    memory: {
      maxSize: 1000,
      maxAge: CacheTTL.SHORT * 1000, // Convert to milliseconds
      ...overrides?.memory,
    },
  };
}