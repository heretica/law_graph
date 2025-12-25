# Query Cache

**Feature**: 006-graph-optimization

Client-side cache for GraphRAG query results to avoid redundant MCP calls.

## Overview

The query cache implements a TTL-based (Time-To-Live) caching system with LRU (Least Recently Used) eviction policy. It caches query results to improve performance and reduce server load.

## Architecture

```
┌─────────────────────────────────────────┐
│         BorgesLibrary.tsx               │
│                                         │
│  handleSubmit()                         │
│      │                                  │
│      ├─> getCacheKey()                  │
│      ├─> getFromCache()                 │
│      │       ├─> Cache Hit → Return     │
│      │       └─> Cache Miss → Continue  │
│      │                                  │
│      ├─> lawGraphRAGService.query()     │
│      └─> setInCache()                   │
└─────────────────────────────────────────┘
```

## Usage

### Basic Usage

```typescript
import {
  getCacheKey,
  getFromCache,
  setInCache,
  clearCache,
  getCacheStats,
  type QueryCacheEntry,
  type ReconciliationData,
} from '@/lib/cache/query-cache'

// Generate cache key
const key = await getCacheKey(queryText, communes)

// Try to get from cache
const cached = getFromCache(key)
if (cached) {
  // Cache hit - use cached data
  return cached.response
}

// Cache miss - fetch from API
const response = await fetchFromAPI(queryText, communes)

// Store in cache
setInCache(key, {
  queryHash: key,
  queryText,
  communes,
  response,
  answer,
  debugInfo,
  timestamp: Date.now(),
  ttl: 300000, // 5 minutes
})
```

### Cache Statistics

```typescript
const stats = getCacheStats()
console.log(`Cache: ${stats.entries}/${stats.maxEntries} entries`)
console.log(`Size: ${stats.currentSize}/${stats.maxSize} bytes (${stats.sizePercentage.toFixed(1)}%)`)
```

### Clear Cache

```typescript
clearCache() // Removes all cached entries
```

## Configuration

Default configuration (module-level constants):

```typescript
const cache: QueryCache = {
  entries: new Map(),
  maxEntries: 50,           // Maximum 50 cached queries
  maxSize: 50 * 1024 * 1024, // 50MB total cache size
  currentSize: 0,
}
```

Default TTL for cache entries:

```typescript
const DEFAULT_TTL = 300000 // 5 minutes (300,000 milliseconds)
```

## Data Structures

### QueryCacheEntry

```typescript
interface QueryCacheEntry {
  queryHash: string        // SHA-256 of queryText + communes
  queryText: string        // Original query text
  communes: string[]       // List of commune IDs
  response: ReconciliationData  // Graph data
  answer: string           // LLM answer
  debugInfo: DebugInfo     // Debug metadata
  timestamp: number        // Unix timestamp (ms)
  ttl: number              // Time-to-live (ms)
  hitCount: number         // Number of cache hits
}
```

### ReconciliationData

```typescript
interface ReconciliationData {
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
```

## Features

### 1. TTL-based Expiration

Entries are automatically removed when accessed after their TTL expires:

```typescript
const age = Date.now() - entry.timestamp
if (age > entry.ttl) {
  // Entry expired, remove and return null
  cache.entries.delete(key)
  return null
}
```

### 2. LRU Eviction

When cache reaches capacity (entries or size), oldest entry is evicted:

```typescript
while (
  cache.entries.size >= cache.maxEntries ||
  cache.currentSize + entrySize > cache.maxSize
) {
  evictOldest()
}
```

### 3. Hit Counting

Track cache effectiveness by counting hits per entry:

```typescript
entry.hitCount++ // Incremented on each getFromCache() call
```

### 4. Size Estimation

Approximate memory usage using JSON serialization:

```typescript
const json = JSON.stringify(entry)
const bytes = json.length * 2 // UTF-16 = 2 bytes per char
```

### 5. Consistent Hashing

Communes are sorted before hashing for consistency:

```typescript
const sortedCommunes = [...communes].sort()
const cacheInput = `${query}|${sortedCommunes.join(',')}`
// → SHA-256 hash
```

## Performance Characteristics

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| getCacheKey | O(n log n) | O(n) |
| getFromCache | O(1) | O(1) |
| setInCache | O(n) worst case | O(m) |
| evictOldest | O(n) | O(1) |
| clearCache | O(1) | O(1) |

Where:
- n = number of communes
- m = size of entry

## Testing

Run unit tests:

```bash
npm test src/lib/cache/__tests__/query-cache.test.ts
```

Test coverage includes:
- ✅ Consistent key generation
- ✅ Commune sorting for cache key
- ✅ Cache hit/miss behavior
- ✅ TTL expiration
- ✅ Hit counting
- ✅ LRU eviction
- ✅ Cache statistics
- ✅ Clear cache

## Integration Points

### BorgesLibrary.tsx

```typescript
const handleSubmit = async (queryText: string, communes: string[]) => {
  // 1. Check cache
  const key = await getCacheKey(queryText, communes)
  const cached = getFromCache(key)

  if (cached) {
    setGraphData(cached.response)
    setAnswer(cached.answer)
    setDebugInfo(cached.debugInfo)
    return
  }

  // 2. Fetch from API
  const result = await lawGraphRAGService.query({ query: queryText })

  // 3. Store in cache
  setInCache(key, {
    queryHash: key,
    queryText,
    communes,
    response: result.graphrag_data,
    answer: result.answer,
    debugInfo: result.debug_info,
    timestamp: Date.now(),
    ttl: 300000,
  })
}
```

## Limitations

1. **Browser-only**: Uses `crypto.subtle` API (not available in Node.js)
2. **In-memory**: Cache is lost on page refresh
3. **Approximate sizing**: JSON serialization overhead estimation
4. **No persistence**: No localStorage/IndexedDB integration

## Future Enhancements

- [ ] Persist cache to localStorage
- [ ] Add compression for large entries
- [ ] Implement cache warming on page load
- [ ] Add cache hit rate metrics
- [ ] Support cache invalidation by commune
- [ ] Add configurable eviction strategies (LFU, FIFO)
