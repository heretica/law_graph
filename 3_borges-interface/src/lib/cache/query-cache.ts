/**
 * Client-Side Query Cache
 * Feature: 006-graph-optimization
 *
 * Caches GraphRAG query results to avoid redundant MCP calls.
 * Implements TTL-based expiration and LRU eviction policy.
 */

import type { DebugInfo } from '@/lib/services/reconciliation'

/**
 * Graph data structure matching ReconciliationData
 * Used in GraphVisualization3DForce and other components
 */
export interface ReconciliationData {
  nodes: Array<{
    id: string
    labels: string[]
    properties: Record<string, any>
    degree: number
    centrality_score: number
  }>
  relationships: Array<{
    id: string
    type: string
    source: string
    target: string
    properties: Record<string, any>
  }>
}

/**
 * Cache entry for a query result
 */
export interface QueryCacheEntry {
  // Cache key components
  queryHash: string        // SHA-256 of queryText + communes
  queryText: string
  communes: string[]

  // Cached response
  response: ReconciliationData
  answer: string
  debugInfo: DebugInfo

  // Metadata
  timestamp: number
  ttl: number              // Default: 300000 (5 minutes)
  hitCount: number
}

/**
 * Query cache configuration
 */
interface QueryCache {
  entries: Map<string, QueryCacheEntry>
  maxEntries: number       // Default: 50
  maxSize: number          // Default: 50MB in bytes
  currentSize: number
}

// Module-level singleton cache
const cache: QueryCache = {
  entries: new Map(),
  maxEntries: 50,
  maxSize: 50 * 1024 * 1024, // 50MB
  currentSize: 0,
}

/**
 * Generate cache key from query text and communes
 * Uses SHA-256 hash for deterministic key generation
 *
 * @param query - The query text
 * @param communes - Array of commune IDs/names
 * @returns SHA-256 hash as hex string
 */
export async function getCacheKey(query: string, communes: string[]): Promise<string> {
  // Sort communes for consistent hashing
  const sortedCommunes = [...communes].sort()
  const cacheInput = `${query}|${sortedCommunes.join(',')}`

  // Use SubtleCrypto API for SHA-256 (browser-native)
  const encoder = new TextEncoder()
  const data = encoder.encode(cacheInput)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Get entry from cache with TTL validation
 *
 * @param key - Cache key (SHA-256 hash)
 * @returns Cache entry if valid, null if expired or missing
 */
export function getFromCache(key: string): QueryCacheEntry | null {
  const entry = cache.entries.get(key)

  if (!entry) {
    return null
  }

  // Check TTL expiration
  const now = Date.now()
  const age = now - entry.timestamp
  if (age > entry.ttl) {
    // Entry expired, remove it
    cache.entries.delete(key)
    cache.currentSize -= estimateEntrySize(entry)
    console.log(`🗑️ Cache entry expired: ${key.substring(0, 8)}... (age: ${Math.round(age / 1000)}s)`)
    return null
  }

  // Increment hit count
  entry.hitCount++
  console.log(`✅ Cache hit: ${key.substring(0, 8)}... (hits: ${entry.hitCount})`)

  return entry
}

/**
 * Set entry in cache with automatic eviction
 *
 * @param key - Cache key (SHA-256 hash)
 * @param entry - Cache entry (without hitCount, will be set to 0)
 */
export function setInCache(
  key: string,
  entry: Omit<QueryCacheEntry, 'hitCount'>
): void {
  const fullEntry: QueryCacheEntry = {
    ...entry,
    hitCount: 0,
  }

  const entrySize = estimateEntrySize(fullEntry)

  // Check if we need to evict entries
  while (
    cache.entries.size >= cache.maxEntries ||
    cache.currentSize + entrySize > cache.maxSize
  ) {
    evictOldest()
  }

  // Set the new entry
  cache.entries.set(key, fullEntry)
  cache.currentSize += entrySize

  console.log(
    `💾 Cache set: ${key.substring(0, 8)}... (entries: ${cache.entries.size}/${cache.maxEntries}, size: ${formatBytes(cache.currentSize)}/${formatBytes(cache.maxSize)})`
  )
}

/**
 * Evict the oldest entry from cache (LRU policy)
 */
export function evictOldest(): void {
  if (cache.entries.size === 0) {
    return
  }

  // Find oldest entry by timestamp
  let oldestKey: string | null = null
  let oldestTimestamp = Infinity

  for (const [key, entry] of Array.from(cache.entries.entries())) {
    if (entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp
      oldestKey = key
    }
  }

  if (oldestKey) {
    const entry = cache.entries.get(oldestKey)!
    cache.entries.delete(oldestKey)
    cache.currentSize -= estimateEntrySize(entry)
    console.log(`🗑️ Cache evicted: ${oldestKey.substring(0, 8)}... (age: ${Math.round((Date.now() - entry.timestamp) / 1000)}s)`)
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  const entriesCleared = cache.entries.size
  cache.entries.clear()
  cache.currentSize = 0
  console.log(`🗑️ Cache cleared: ${entriesCleared} entries removed`)
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number
  maxEntries: number
  currentSize: number
  maxSize: number
  sizePercentage: number
  oldestEntry: number | null
  newestEntry: number | null
} {
  let oldestTimestamp: number | null = null
  let newestTimestamp: number | null = null

  for (const entry of Array.from(cache.entries.values())) {
    if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp
    }
    if (newestTimestamp === null || entry.timestamp > newestTimestamp) {
      newestTimestamp = entry.timestamp
    }
  }

  return {
    entries: cache.entries.size,
    maxEntries: cache.maxEntries,
    currentSize: cache.currentSize,
    maxSize: cache.maxSize,
    sizePercentage: (cache.currentSize / cache.maxSize) * 100,
    oldestEntry: oldestTimestamp,
    newestEntry: newestTimestamp,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Estimate memory size of a cache entry in bytes
 * Uses JSON stringification as approximation
 */
function estimateEntrySize(entry: QueryCacheEntry): number {
  try {
    // Approximate size using JSON serialization
    const json = JSON.stringify(entry)
    // Each character in JavaScript string is 2 bytes (UTF-16)
    return json.length * 2
  } catch (error) {
    // Fallback to conservative estimate
    console.warn('Failed to estimate entry size, using fallback', error)
    return 10 * 1024 // 10KB default
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
