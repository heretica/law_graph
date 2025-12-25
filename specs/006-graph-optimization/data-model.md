# Data Model: Graph Performance Optimization

**Feature**: 006-graph-optimization
**Date**: 2025-12-25

## Overview

This document defines the data structures for caching, state management, and pooling introduced by the performance optimization. No new persistent entities are created - all structures are in-memory runtime optimizations.

---

## Frontend State Consolidation

### Current State (33 useState hooks)

```typescript
// BEFORE: BorgesLibrary.tsx:131-234
// 33 individual useState calls causing re-render cascades
const [isLoading, setIsLoading] = useState(false)
const [query, setQuery] = useState('')
const [results, setResults] = useState(null)
// ... 30 more hooks
```

### Consolidated State Objects

#### UIState
```typescript
interface UIState {
  // Panel visibility
  isEntityPanelOpen: boolean
  isCommunePanelOpen: boolean
  isAnswerPanelOpen: boolean
  isDebugPanelOpen: boolean

  // Modal state
  selectedEntityId: string | null
  selectedCommuneId: string | null

  // Loading indicators
  isLoading: boolean
  loadingMessage: string

  // View mode
  viewMode: 'graph' | 'list' | 'map'
}

const defaultUIState: UIState = {
  isEntityPanelOpen: false,
  isCommunePanelOpen: false,
  isAnswerPanelOpen: false,
  isDebugPanelOpen: false,
  selectedEntityId: null,
  selectedCommuneId: null,
  isLoading: false,
  loadingMessage: '',
  viewMode: 'graph'
}
```

#### QueryState
```typescript
interface QueryState {
  // Input
  queryText: string
  selectedCommunes: string[]
  queryMode: 'single' | 'all'

  // Progress
  progress: number // 0-100
  currentPhase: 'idle' | 'querying' | 'processing' | 'rendering'
  processedCommunes: string[]
  failedCommunes: string[]

  // Results
  answer: string | null
  debugInfo: DebugInfo | null
  lastQueryTime: number | null
}

const defaultQueryState: QueryState = {
  queryText: '',
  selectedCommunes: [],
  queryMode: 'all',
  progress: 0,
  currentPhase: 'idle',
  processedCommunes: [],
  failedCommunes: [],
  answer: null,
  debugInfo: null,
  lastQueryTime: null
}
```

#### GraphState
```typescript
interface GraphState {
  // Data
  nodes: GraphNode[]
  links: GraphLink[]

  // Selection
  selectedNodeIds: Set<string>
  hoveredNodeId: string | null
  focusedNodeId: string | null

  // Camera
  cameraPosition: { x: number; y: number; z: number }
  zoomLevel: number

  // Animation
  animationPhase: 'explosion' | 'filtering' | 'synthesis' | 'crystallization' | 'idle'
  animationProgress: number
}

const defaultGraphState: GraphState = {
  nodes: [],
  links: [],
  selectedNodeIds: new Set(),
  hoveredNodeId: null,
  focusedNodeId: null,
  cameraPosition: { x: 0, y: 0, z: 500 },
  zoomLevel: 1,
  animationPhase: 'idle',
  animationProgress: 0
}
```

---

## Client-Side Query Cache

### QueryCacheEntry
```typescript
interface QueryCacheEntry {
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
```

### QueryCache
```typescript
interface QueryCache {
  entries: Map<string, QueryCacheEntry>
  maxEntries: number       // Default: 50
  maxSize: number          // Default: 50MB
  currentSize: number
}

// Cache operations
function getCacheKey(query: string, communes: string[]): string
function getFromCache(key: string): QueryCacheEntry | null
function setInCache(key: string, entry: QueryCacheEntry): void
function evictOldest(): void
function clearCache(): void
```

---

## MCP Session Pool

### PooledSession
```typescript
interface PooledSession {
  sessionId: string
  client: MCPClient
  lastUsed: number         // Unix timestamp
  requestCount: number
  status: 'active' | 'idle' | 'expired'
}
```

### SessionPool
```typescript
interface SessionPool {
  sessions: Map<string, PooledSession>
  maxSessions: number      // Default: 3
  sessionTTL: number       // Default: 300000 (5 minutes)
  cleanupInterval: number  // Default: 60000 (1 minute)
}

// Pool operations
function getSession(): Promise<PooledSession>
function releaseSession(sessionId: string): void
function cleanupExpiredSessions(): void
```

---

## Backend Cache Structures

### GraphRAGInstanceCache (Python)
```python
from functools import lru_cache
from dataclasses import dataclass
from datetime import datetime

@dataclass
class CachedGraphRAG:
    instance: GraphRAG
    commune_id: str
    created_at: datetime
    last_accessed: datetime
    query_count: int

# LRU cache with maxsize=10
graphrag_cache: Dict[str, CachedGraphRAG] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes
MAX_CACHED_INSTANCES = 10
```

### LLMResponseCache (Python)
```python
@dataclass
class LLMCacheEntry:
    prompt_hash: str
    response: str
    model: str
    timestamp: datetime
    token_count: int

# Global singleton cache
llm_cache: Dict[str, LLMCacheEntry] = {}
LLM_CACHE_TTL_SECONDS = 3600  # 1 hour
MAX_LLM_CACHE_ENTRIES = 1000
```

### EntityNameIndex (Python)
```python
# Hash index for O(1) entity lookup
# Added to gdb_networkx.py

class NetworkXStorage:
    def __init__(self):
        self._graph = nx.Graph()
        self._entity_name_index: Dict[str, str] = {}  # NEW

    def upsert_node(self, node_id: str, node_data: dict):
        self._graph.add_node(node_id, **node_data)
        if 'name' in node_data:
            self._entity_name_index[node_data['name']] = node_id

    def get_node_by_name(self, name: str) -> Optional[str]:
        return self._entity_name_index.get(name)  # O(1) vs O(n)
```

### EmbeddingCache (Python)
```python
@dataclass
class EmbeddingCacheEntry:
    text_hash: str
    embedding: List[float]
    model: str
    timestamp: datetime

# Added to vdb_nanovectordb.py
embedding_cache: Dict[str, EmbeddingCacheEntry] = {}
EMBEDDING_CACHE_TTL_SECONDS = 86400  # 24 hours
```

---

## Level of Detail (LOD) Configuration

### LODConfig
```typescript
interface LODConfig {
  // Distance thresholds
  highDetailDistance: number    // Default: 200
  mediumDetailDistance: number  // Default: 500
  lowDetailDistance: number     // Default: 1000

  // High detail (distance < 200)
  highDetail: {
    nodeResolution: number      // Default: 16
    linkParticles: boolean      // Default: true
    linkParticleSpeed: number   // Default: 0.01
    nodeOpacity: number         // Default: 1.0
  }

  // Medium detail (200 < distance < 500)
  mediumDetail: {
    nodeResolution: number      // Default: 8
    linkParticles: boolean      // Default: false
    linkParticleSpeed: number   // Default: 0
    nodeOpacity: number         // Default: 0.9
  }

  // Low detail (distance > 500)
  lowDetail: {
    nodeResolution: number      // Default: 4
    linkParticles: boolean      // Default: false
    linkParticleSpeed: number   // Default: 0
    nodeOpacity: number         // Default: 0.7
  }
}
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     BorgesLibrary                           │
│                                                             │
│  ┌─────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │ UIState │   │ QueryState  │   │ GraphState  │           │
│  └────┬────┘   └──────┬──────┘   └──────┬──────┘           │
│       │               │                  │                  │
│       └───────────────┼──────────────────┘                  │
│                       │                                     │
│                       ▼                                     │
│              ┌────────────────┐                             │
│              │  QueryCache    │                             │
│              └────────┬───────┘                             │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  SessionPool    │
              └────────┬────────┘
                       │
                       ▼ (HTTP/MCP)
        ┌──────────────────────────────┐
        │       MCP Server             │
        │                              │
        │  ┌──────────────────────┐    │
        │  │ GraphRAGInstanceCache│    │
        │  └──────────┬───────────┘    │
        │             │                │
        │  ┌──────────▼───────────┐    │
        │  │   LLMResponseCache   │    │
        │  └──────────────────────┘    │
        │                              │
        │  ┌──────────────────────┐    │
        │  │  EntityNameIndex     │    │
        │  └──────────────────────┘    │
        │                              │
        │  ┌──────────────────────┐    │
        │  │   EmbeddingCache     │    │
        │  └──────────────────────┘    │
        └──────────────────────────────┘
```

---

## Validation Rules

### Cache Entry Validation
- `queryHash` must be SHA-256 format (64 hex characters)
- `ttl` must be positive integer
- `timestamp` must be valid Unix timestamp
- `communes` array must not be empty

### State Validation
- `zoomLevel` must be between 0.1 and 10
- `animationProgress` must be between 0 and 1
- `progress` must be between 0 and 100
- `nodes` and `links` must maintain referential integrity

### Pool Validation
- `maxSessions` must be >= 1
- `sessionTTL` must be >= 60000 (1 minute)
- Active sessions must not exceed `maxSessions`

---

## Migration Notes

No database migrations required. All structures are:
1. In-memory runtime caches
2. Initialized empty on application start
3. Automatically populated during usage
4. Lost on application restart (acceptable for cache data)
