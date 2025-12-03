/**
 * Cache Service
 * Provides in-memory caching with TTL support for WHOIS results
 */

import NodeCache from 'node-cache';
import { log } from './logger';
import type { WhoisResult } from './types';

// Default cache configuration
const DEFAULT_TTL = 3600; // 1 hour in seconds
const DEFAULT_CHECK_PERIOD = 120; // Check for expired keys every 2 minutes
const DEFAULT_MAX_KEYS = 1000;

class CacheService {
  private cache: NodeCache;
  private maxKeys: number;
  private enabled: boolean;

  constructor(options?: { ttl?: number; checkPeriod?: number; maxKeys?: number; enabled?: boolean }) {
    this.enabled = options?.enabled ?? true;
    this.maxKeys = options?.maxKeys ?? DEFAULT_MAX_KEYS;
    
    this.cache = new NodeCache({
      stdTTL: options?.ttl ?? DEFAULT_TTL,
      checkperiod: options?.checkPeriod ?? DEFAULT_CHECK_PERIOD,
      useClones: true, // Return clones to prevent external modifications
      deleteOnExpire: true,
    });

    // Log cache events
    this.cache.on('expired', (key) => {
      log.debug('Cache key expired', { key });
    });

    this.cache.on('del', (key) => {
      log.debug('Cache key deleted', { key });
    });

    log.info('Cache service initialized', {
      enabled: this.enabled,
      ttl: options?.ttl ?? DEFAULT_TTL,
      maxKeys: this.maxKeys,
    });
  }

  /**
   * Generate cache key for a domain
   */
  private generateKey(domain: string): string {
    return `whois:${domain.toLowerCase().trim()}`;
  }

  /**
   * Get cached WHOIS result for a domain
   */
  get(domain: string): WhoisResult | null {
    if (!this.enabled) return null;

    const key = this.generateKey(domain);
    const result = this.cache.get<WhoisResult>(key);

    if (result) {
      log.debug('Cache hit', { domain, key });
      return { ...result, cached: true };
    }

    log.debug('Cache miss', { domain, key });
    return null;
  }

  /**
   * Store WHOIS result in cache
   */
  set(domain: string, result: WhoisResult, ttl?: number): boolean {
    if (!this.enabled) return false;

    // Check if we need to evict old entries
    if (this.cache.keys().length >= this.maxKeys) {
      this.evictOldest();
    }

    const key = this.generateKey(domain);
    const success = ttl 
      ? this.cache.set(key, result, ttl)
      : this.cache.set(key, result);

    if (success) {
      log.debug('Cache set', { domain, key, ttl });
    } else {
      log.warn('Failed to set cache', { domain, key });
    }

    return success;
  }

  /**
   * Delete cached result for a domain
   */
  delete(domain: string): boolean {
    const key = this.generateKey(domain);
    const deleted = this.cache.del(key);
    log.debug('Cache delete', { domain, key, deleted: deleted > 0 });
    return deleted > 0;
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.flushAll();
    log.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { keys: number; hits: number; misses: number; hitRate: string } {
    const stats = this.cache.getStats();
    const total = stats.hits + stats.misses;
    const hitRate = total > 0 ? ((stats.hits / total) * 100).toFixed(2) + '%' : '0%';

    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate,
    };
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const keys = this.cache.keys();
    if (keys.length > 0) {
      // Delete first 10% of keys
      const toDelete = Math.max(1, Math.floor(keys.length * 0.1));
      for (let i = 0; i < toDelete; i++) {
        this.cache.del(keys[i]);
      }
      log.debug('Evicted old cache entries', { count: toDelete });
    }
  }

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    log.info('Cache enabled status changed', { enabled });
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

export function getCache(options?: { ttl?: number; maxKeys?: number; enabled?: boolean }): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService(options);
  }
  return cacheInstance;
}

export default CacheService;
