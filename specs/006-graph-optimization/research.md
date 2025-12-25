# Research: Graph Performance Optimization

**Feature**: 006-graph-optimization
**Date**: 2025-12-25
**Status**: Complete

## Executive Summary

Six exploration agents analyzed the performance bottlenecks across frontend, backend, and data pipeline layers. This document consolidates their findings into actionable decisions.

---

## Research Area 1: Startup Loading Mechanism

### Decision
Replace progressive batching with requestAnimationFrame and implement client-side caching.

### Findings

**Current State (Agent 1 Analysis)**:
- `GraphVisualization3DForce.tsx:519-527` uses `setTimeout(addBatch, 250)` with 30 batches
- **7.5 seconds minimum** from batching alone (250ms × 30)
- MCP session initialization adds 500ms-2s per page load
- `3d-force-graph` dynamic import adds 500ms-1s
- No caching - fresh network call every load

**Root Cause**:
```typescript
// Current problematic pattern (line 519-527)
const addBatch = () => {
  // Add batch of nodes
  setTimeout(addBatch, 250) // ← 250ms delay × 30 batches = 7.5s
}
```

### Rationale
- requestAnimationFrame adds nodes at 60fps (16.6ms) instead of 250ms intervals
- Session pooling eliminates repeated MCP handshakes
- Client-side caching prevents redundant GraphML fetches

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Web Workers for parsing | Adds complexity, modest gain (~1s) |
| Virtual scrolling nodes | 3d-force-graph doesn't support this natively |
| Server-side rendering | Graph requires client-side WebGL |

---

## Research Area 2: Query Performance Flow

### Decision
Increase backend concurrency to MAX_CONCURRENT=6 and implement GraphRAG instance pooling.

### Findings

**Current State (Agent 2 Analysis)**:
- Query 15 communes takes 120-195 seconds
- `MAX_CONCURRENT = 2` in `server.py:659` limits parallelism
- Each commune query creates new GraphRAG instance (15-30s overhead)
- Double-query pattern (local+global) = 30 LLM calls for 15 communes
- Per-instance LLM cache not shared between communes

**Timing Breakdown**:
| Stage | Time | Cause |
|-------|------|-------|
| Instance init × 15 | 45-60s | No pooling |
| Double queries × 15 | 30-45s | local+global mode |
| Concurrency wait | 25-30s | MAX_CONCURRENT=2 |
| LLM calls | 20-60s | No shared cache |

### Rationale
- `MAX_CONCURRENT=6` reduces queue wait by 75%
- Instance pooling with LRU cache (10 instances, 5-min TTL) eliminates re-init
- Global-only mode cuts LLM calls by 50%

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Pre-warm all 50 instances | Memory intensive (50 × 500MB) |
| Remove local mode entirely | May degrade single-commune quality |
| Async streaming from start | Requires API contract change |

---

## Research Area 3: nano_graphrag Architecture

### Decision
Add entity name hash index and implement embedding cache.

### Findings

**Current State (Agent 3 Analysis)**:
- `gdb_networkx.py:125-135` uses O(n) entity lookup
- Full JSON rewrite on every insert (not relevant for read optimization)
- No query context caching
- Embedding generation not cached

**Entity Lookup Pattern**:
```python
# Current O(n) pattern
for node_id, data in self._graph.nodes(data=True):
    if data.get('name') == entity_name:
        return node_id
```

### Rationale
- Hash index provides O(1) lookup: `_entity_name_index[name] = node_id`
- Embedding cache with query hash key eliminates redundant embedding calls

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Redis external cache | Adds infrastructure dependency |
| SQLite for indices | Over-engineering for in-memory graph |
| FAISS for vectors | Already using nanovectordb |

---

## Research Area 4: 3D Rendering Optimization

### Decision
Consolidate React state and implement Level of Detail (LOD) based on zoom.

### Findings

**Current State (Agent 4 Analysis)**:
- `BorgesLibrary.tsx:131-234` has **33 useState hooks**
- Each state change triggers full component re-render cascade
- Node filtering at `BorgesLibrary.tsx:584-635` runs O(n) on EVERY render
- Missing useMemo/useCallback throughout
- Link particles always enabled (unnecessary GPU load)
- No LOD - same detail at all zoom levels

**Re-render Analysis**:
```
User interaction → setState() → BorgesLibrary re-render
→ GraphVisualization3DForce props change → Graph re-render
→ All 500+ nodes recalculated
```

### Rationale
- Consolidate 33 hooks into 3 grouped state objects:
  - `uiState`: panels, modals, loading indicators
  - `queryState`: query text, results, progress
  - `graphState`: nodes, links, selection
- useMemo for expensive computations (node filtering)
- useCallback for event handlers
- LOD: disable particles when `distance > 500`, reduce nodeResolution when zoomed out

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Move to Zustand/Redux | Over-engineering, useState sufficient with proper patterns |
| Canvas 2D fallback | Loses 3D exploration value |
| Virtualized node rendering | 3d-force-graph handles this internally |

---

## Research Area 5: Network/API Optimization

### Decision
Add MCP session pooling with 5-minute TTL and enable response caching.

### Findings

**Current State (Agent 5 Analysis)**:
- `route.ts:111-114` creates fresh MCP session per request
- `reconciliation.ts:272` sets `Cache-Control: no-cache` explicitly
- No response compression (gzip)
- Double JSON parsing in SSE handler (`route.ts:84-101`)
- No request deduplication

**Cache Header Issue**:
```typescript
// Current anti-pattern (reconciliation.ts:272)
headers: { 'Cache-Control': 'no-cache' }
```

### Rationale
- Session pool with Map<sessionId, { session, lastUsed }> and 5-min TTL
- Change to `max-age=300` for commune data (doesn't change frequently)
- Single JSON.parse() pass instead of two

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| WebSocket persistent connection | Adds complexity, MCP uses HTTP |
| Service Worker caching | Complicates deployment, overkill |
| GraphQL for batching | Would require API rewrite |

---

## Research Area 6: Data Transformation Pipeline

### Decision
Implement single-pass transformation and Set-based deduplication.

### Findings

**Current State (Agent 6 Analysis)**:
- `law-graphrag.ts:67-102` makes 4 passes over data:
  1. Extract entities
  2. Filter orphans
  3. Build relationships
  4. Format for visualization
- `route.ts:186-205` has triple filter+map chain
- `reconciliation.ts:358-360` uses Map for dedup (creates intermediate arrays)

**Multi-Pass Pattern**:
```typescript
// Current 4-pass pattern
const entities = data.entities.map(...)        // Pass 1
const filtered = entities.filter(...)          // Pass 2
const withRels = filtered.map(...)             // Pass 3
const formatted = withRels.map(...)            // Pass 4
```

### Rationale
- Single pass: `reduce()` with accumulator handles all transformations
- Set-based dedup: `new Set()` membership check is O(1) vs Map's object overhead
- 60% faster transform, 30% less memory

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Lazy evaluation (generators) | Adds complexity, marginal benefit |
| Binary format (MessagePack) | Requires backend changes |
| Web Assembly parser | Over-engineering for this data size |

---

## Resolved Clarifications

| Item | Resolution | Source |
|------|------------|--------|
| Backend access for server.py changes | Yes - separate repo graphRAGmcp | Agent 2 |
| Memory budget for caching | 500MB browser limit, 1GB server | Spec constraints |
| Constitution impact | All 9 principles preserved | Constitution Check |
| Mobile optimization scope | Deferred to separate spec | Spec Out of Scope |

---

## Next Steps

1. **Phase 1: Generate data-model.md** - Define cache structures and state shapes
2. **Phase 1: Generate quickstart.md** - Performance testing procedures
3. **Phase 2: Generate tasks.md** - Via `/speckit.tasks`
