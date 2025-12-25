/**
 * Example Usage: Query Cache Integration
 * Feature: 006-graph-optimization
 *
 * This example demonstrates how to integrate the query cache
 * into BorgesLibrary.tsx for optimal performance.
 */

import {
  getCacheKey,
  getFromCache,
  setInCache,
  clearCache,
  getCacheStats,
  type QueryCacheEntry,
} from './query-cache'
import { lawGraphRAGService } from '@/lib/services/law-graphrag'
import type { DebugInfo } from '@/lib/services/reconciliation'

/**
 * Example 1: Basic cache integration in query handler
 */
export async function handleQueryWithCache(
  queryText: string,
  communes: string[],
  ttl: number = 300000 // 5 minutes default
) {
  console.log('🔍 Query:', queryText)

  // Step 1: Generate cache key
  const cacheKey = await getCacheKey(queryText, communes)
  console.log('🔑 Cache key:', cacheKey.substring(0, 16) + '...')

  // Step 2: Try to get from cache
  const cachedResult = getFromCache(cacheKey)
  if (cachedResult) {
    console.log('✅ Cache hit! Returning cached result')
    return {
      response: cachedResult.response,
      answer: cachedResult.answer,
      debugInfo: cachedResult.debugInfo,
      fromCache: true,
      hitCount: cachedResult.hitCount,
    }
  }

  console.log('❌ Cache miss, querying API...')

  // Step 3: Query the API
  const result = await lawGraphRAGService.query({
    query: queryText,
    mode: 'global',
  })

  if (!result.success) {
    throw new Error(result.error || 'Query failed')
  }

  // Step 4: Transform and cache the result
  const graphData = lawGraphRAGService.transformToGraphData(result)
  if (graphData) {
    setInCache(cacheKey, {
      queryHash: cacheKey,
      queryText,
      communes,
      response: graphData,
      answer: result.answer,
      debugInfo: result.context as unknown as DebugInfo, // Type assertion for compatibility
      timestamp: Date.now(),
      ttl,
    })
  }

  return {
    response: graphData,
    answer: result.answer,
    debugInfo: result.context,
    fromCache: false,
    hitCount: 0,
  }
}

/**
 * Example 2: Cache with statistics tracking
 */
export async function queryWithStats(queryText: string, communes: string[]) {
  const statsBefore = getCacheStats()
  console.log(
    `📊 Cache before: ${statsBefore.entries}/${statsBefore.maxEntries} entries, ${(statsBefore.sizePercentage).toFixed(1)}% full`
  )

  const result = await handleQueryWithCache(queryText, communes)

  const statsAfter = getCacheStats()
  console.log(
    `📊 Cache after: ${statsAfter.entries}/${statsAfter.maxEntries} entries, ${(statsAfter.sizePercentage).toFixed(1)}% full`
  )

  return result
}

/**
 * Example 3: Batch queries with cache
 */
export async function batchQueriesWithCache(
  queries: Array<{ text: string; communes: string[] }>
) {
  console.log(`🔄 Processing ${queries.length} queries...`)

  const results = await Promise.all(
    queries.map(async ({ text, communes }) => {
      try {
        return await handleQueryWithCache(text, communes)
      } catch (error) {
        console.error(`Error processing query "${text}":`, error)
        return null
      }
    })
  )

  const cacheHits = results.filter((r) => r?.fromCache).length
  const cacheMisses = results.filter((r) => r && !r.fromCache).length

  console.log(`✅ Cache performance: ${cacheHits} hits, ${cacheMisses} misses`)
  console.log(`📈 Hit rate: ${((cacheHits / queries.length) * 100).toFixed(1)}%`)

  return results
}

/**
 * Example 4: Cache warming on initialization
 */
export async function warmCache(
  popularQueries: Array<{ text: string; communes: string[] }>
) {
  console.log(`🔥 Warming cache with ${popularQueries.length} popular queries...`)

  const startTime = Date.now()

  await batchQueriesWithCache(popularQueries)

  const duration = Date.now() - startTime
  const stats = getCacheStats()

  console.log(`✅ Cache warmed in ${duration}ms`)
  console.log(`📊 Cache size: ${stats.entries} entries, ${(stats.sizePercentage).toFixed(1)}% full`)
}

/**
 * Example 5: Periodic cache cleanup
 */
export function startCacheCleanup(intervalMs: number = 60000) {
  return setInterval(() => {
    const statsBefore = getCacheStats()

    // Note: Expired entries are cleaned up automatically on access
    // This just logs the current state
    console.log(
      `🧹 Cache status: ${statsBefore.entries} entries, ${(statsBefore.sizePercentage).toFixed(1)}% full`
    )

    // Optional: Force clear if cache is nearly full
    if (statsBefore.sizePercentage > 90) {
      console.log('⚠️ Cache nearly full, clearing...')
      clearCache()
    }
  }, intervalMs)
}

/**
 * Example 6: React hook integration
 */
export function useCachedQuery() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<any>(null)

  const query = async (queryText: string, communes: string[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await handleQueryWithCache(queryText, communes)
      setResult(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { query, isLoading, error, result }
}

// Prevent import errors in examples
import React from 'react'
