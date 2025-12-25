/**
 * Query Cache Module
 * Feature: 006-graph-optimization
 *
 * Client-side caching for GraphRAG query results.
 * Implements TTL-based expiration and LRU eviction.
 */

export {
  getCacheKey,
  getFromCache,
  setInCache,
  evictOldest,
  clearCache,
  getCacheStats,
  type QueryCacheEntry,
  type ReconciliationData,
} from './query-cache'
