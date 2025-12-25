/**
 * Unit tests for Query Cache
 * Feature: 006-graph-optimization
 */

import {
  getCacheKey,
  getFromCache,
  setInCache,
  clearCache,
  getCacheStats,
  type QueryCacheEntry,
  type ReconciliationData,
} from '../query-cache'

describe('Query Cache', () => {
  beforeEach(() => {
    clearCache()
  })

  describe('getCacheKey', () => {
    it('should generate consistent SHA-256 hash for same input', async () => {
      const key1 = await getCacheKey('test query', ['commune1', 'commune2'])
      const key2 = await getCacheKey('test query', ['commune1', 'commune2'])
      expect(key1).toBe(key2)
      expect(key1).toHaveLength(64) // SHA-256 = 64 hex chars
    })

    it('should sort communes for consistent hashing', async () => {
      const key1 = await getCacheKey('test', ['b', 'a', 'c'])
      const key2 = await getCacheKey('test', ['a', 'b', 'c'])
      expect(key1).toBe(key2)
    })

    it('should generate different hashes for different queries', async () => {
      const key1 = await getCacheKey('query1', ['commune1'])
      const key2 = await getCacheKey('query2', ['commune1'])
      expect(key1).not.toBe(key2)
    })
  })

  describe('setInCache and getFromCache', () => {
    it('should store and retrieve cache entries', async () => {
      const key = await getCacheKey('test', ['commune1'])
      const entry: Omit<QueryCacheEntry, 'hitCount'> = {
        queryHash: key,
        queryText: 'test',
        communes: ['commune1'],
        response: { nodes: [], relationships: [] },
        answer: 'test answer',
        debugInfo: {
          processing_phases: {
            entity_selection: { entities: [], duration_ms: 0, phase: 'entity_selection' },
            community_analysis: { communities: [], duration_ms: 0, phase: 'community_analysis' },
            relationship_mapping: { relationships: [], duration_ms: 0, phase: 'relationship_mapping' },
            text_synthesis: { sources: [], duration_ms: 0, phase: 'text_synthesis' },
          },
          context_stats: { total_time_ms: 0, mode: 'local', prompt_length: 0 },
          animation_timeline: [],
        },
        timestamp: Date.now(),
        ttl: 300000,
      }

      setInCache(key, entry)
      const retrieved = getFromCache(key)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.queryText).toBe('test')
      expect(retrieved?.hitCount).toBe(1)
    })

    it('should return null for non-existent keys', () => {
      const result = getFromCache('nonexistent')
      expect(result).toBeNull()
    })

    it('should increment hit count on repeated access', async () => {
      const key = await getCacheKey('test', ['commune1'])
      const entry: Omit<QueryCacheEntry, 'hitCount'> = {
        queryHash: key,
        queryText: 'test',
        communes: ['commune1'],
        response: { nodes: [], relationships: [] },
        answer: 'test answer',
        debugInfo: {
          processing_phases: {
            entity_selection: { entities: [], duration_ms: 0, phase: 'entity_selection' },
            community_analysis: { communities: [], duration_ms: 0, phase: 'community_analysis' },
            relationship_mapping: { relationships: [], duration_ms: 0, phase: 'relationship_mapping' },
            text_synthesis: { sources: [], duration_ms: 0, phase: 'text_synthesis' },
          },
          context_stats: { total_time_ms: 0, mode: 'local', prompt_length: 0 },
          animation_timeline: [],
        },
        timestamp: Date.now(),
        ttl: 300000,
      }

      setInCache(key, entry)
      getFromCache(key)
      getFromCache(key)
      const result = getFromCache(key)

      expect(result?.hitCount).toBe(3)
    })
  })

  describe('TTL expiration', () => {
    it('should remove expired entries', async () => {
      const key = await getCacheKey('test', ['commune1'])
      const entry: Omit<QueryCacheEntry, 'hitCount'> = {
        queryHash: key,
        queryText: 'test',
        communes: ['commune1'],
        response: { nodes: [], relationships: [] },
        answer: 'test answer',
        debugInfo: {
          processing_phases: {
            entity_selection: { entities: [], duration_ms: 0, phase: 'entity_selection' },
            community_analysis: { communities: [], duration_ms: 0, phase: 'community_analysis' },
            relationship_mapping: { relationships: [], duration_ms: 0, phase: 'relationship_mapping' },
            text_synthesis: { sources: [], duration_ms: 0, phase: 'text_synthesis' },
          },
          context_stats: { total_time_ms: 0, mode: 'local', prompt_length: 0 },
          animation_timeline: [],
        },
        timestamp: Date.now() - 400000, // 400 seconds ago
        ttl: 300000, // 5 minutes = 300 seconds
      }

      setInCache(key, entry)
      const result = getFromCache(key)

      expect(result).toBeNull() // Should be expired
    })
  })

  describe('getCacheStats', () => {
    it('should return accurate statistics', async () => {
      clearCache()
      const stats1 = getCacheStats()
      expect(stats1.entries).toBe(0)

      const key = await getCacheKey('test', ['commune1'])
      const entry: Omit<QueryCacheEntry, 'hitCount'> = {
        queryHash: key,
        queryText: 'test',
        communes: ['commune1'],
        response: { nodes: [], relationships: [] },
        answer: 'test answer',
        debugInfo: {
          processing_phases: {
            entity_selection: { entities: [], duration_ms: 0, phase: 'entity_selection' },
            community_analysis: { communities: [], duration_ms: 0, phase: 'community_analysis' },
            relationship_mapping: { relationships: [], duration_ms: 0, phase: 'relationship_mapping' },
            text_synthesis: { sources: [], duration_ms: 0, phase: 'text_synthesis' },
          },
          context_stats: { total_time_ms: 0, mode: 'local', prompt_length: 0 },
          animation_timeline: [],
        },
        timestamp: Date.now(),
        ttl: 300000,
      }

      setInCache(key, entry)
      const stats2 = getCacheStats()

      expect(stats2.entries).toBe(1)
      expect(stats2.currentSize).toBeGreaterThan(0)
    })
  })

  describe('clearCache', () => {
    it('should remove all entries', async () => {
      const key1 = await getCacheKey('test1', ['commune1'])
      const key2 = await getCacheKey('test2', ['commune2'])
      const entry: Omit<QueryCacheEntry, 'hitCount'> = {
        queryHash: key1,
        queryText: 'test',
        communes: ['commune1'],
        response: { nodes: [], relationships: [] },
        answer: 'test answer',
        debugInfo: {
          processing_phases: {
            entity_selection: { entities: [], duration_ms: 0, phase: 'entity_selection' },
            community_analysis: { communities: [], duration_ms: 0, phase: 'community_analysis' },
            relationship_mapping: { relationships: [], duration_ms: 0, phase: 'relationship_mapping' },
            text_synthesis: { sources: [], duration_ms: 0, phase: 'text_synthesis' },
          },
          context_stats: { total_time_ms: 0, mode: 'local', prompt_length: 0 },
          animation_timeline: [],
        },
        timestamp: Date.now(),
        ttl: 300000,
      }

      setInCache(key1, entry)
      setInCache(key2, { ...entry, queryHash: key2 })

      clearCache()
      const stats = getCacheStats()

      expect(stats.entries).toBe(0)
      expect(stats.currentSize).toBe(0)
    })
  })
})
