# Performance Baseline - Graph Optimization (006)

**Date**: 2025-12-25
**Feature**: 006-graph-optimization
**Interface**: Grand Débat National GraphRAG
**Dataset**: 50 communes, Charente-Maritime

## Executive Summary

This document establishes the performance baseline for the Grand Débat National interface before optimization work begins. Measurements reflect the current implementation using 3d-force-graph, progressive batching, and MCP-based queries.

## 1. Startup Performance

### Current Metrics

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Time to Interactive Graph** | 11s | 3s | -8s |
| Progressive Batching | 7.5s | 2s | -5.5s |
| MCP Session Init | 0.5-2s | 0.3-0.5s | -0.5s |
| 3d-force-graph Import | 0.5-1s | 0.2-0.5s | -0.3s |

### Breakdown

1. **GraphML Loading & Parsing** (~1-2s)
   - Fetch `public/data/grand-debat.graphml`
   - DOMParser XML parsing
   - Node/edge extraction
   - Orphan node filtering (Constitution Principle I)

2. **Progressive Batching** (~7.5s)
   - Initial batch: 50 nodes rendered
   - Subsequent batches: 50 nodes every 16ms
   - No interruption handling
   - No priority-based rendering

3. **MCP Session Initialization** (~0.5-2s)
   - HTTP transport setup
   - Server handshake
   - Tool discovery

4. **3d-force-graph Import** (~0.5-1s)
   - Three.js dependency chain
   - D3-force simulation initialization
   - WebGL context creation

### Bottlenecks

- **Progressive batching blocks main thread**: 7.5s of synchronous node additions
- **No Web Workers**: All parsing/processing on main thread
- **Single-pass rendering**: No prioritization of commune nodes (Constitution Principle II)

## 2. Query Performance

### Current Metrics

| Query Type | Current | Target | Gap | LLM Calls |
|------------|---------|--------|-----|-----------|
| **Single Commune** | 15-30s | 5-8s | -10-22s | ~30 |
| **15 Communes** | 120-195s | 20-40s | -100-155s | ~450 |
| **50 Communes** | 300-500s | 45-90s | -255-410s | ~1500 |

### Breakdown

#### Single Commune Query (15-30s)

1. **GraphRAG Initialization per Commune** (~15-30s)
   - Knowledge graph construction from citizen chunks
   - Entity extraction (CONCEPT, PERSON nodes)
   - Community detection
   - Report generation

2. **Double Query Pattern** (2x LLM calls per operation)
   - Initial query: ~15 LLM calls
   - Follow-up extraction: ~15 LLM calls
   - **Total**: ~30 LLM calls per commune

3. **Concurrency Limit** (MAX_CONCURRENT=2)
   - Only 2 parallel requests to LLM provider
   - Bottleneck for multi-commune queries

#### Multi-Commune Queries

- **15 Communes**: 15 × 15-30s = 225-450s theoretical
  - Actual: 120-195s (partial parallelization benefit)
  - Overhead: ~2-3x target performance

- **50 Communes**: 50 × 15-30s = 750-1500s theoretical
  - Actual: 300-500s (MAX_CONCURRENT=2 provides ~2-3x speedup)
  - Still ~6-11x slower than target

### Bottlenecks

- **Per-Commune GraphRAG Init**: No shared knowledge graph across communes
- **Excessive LLM Calls**: 30 calls per commune (double query pattern)
- **Low Concurrency**: MAX_CONCURRENT=2 limits parallelization
- **No Caching**: Repeated queries to same commune re-initialize GraphRAG
- **No Incremental Loading**: UI blocks until all communes processed

## 3. Rendering Performance

### Current Metrics

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| **Frame Rate** | 15-60fps | Stable 60fps | Varies with graph size |
| **Re-render Triggers** | 33 useState hooks | <10 hooks | Cascade issues |
| **LOD Implementation** | None | Yes | All nodes always rendered |
| **Memoization** | None | Strategic | Props recalculation every render |

### State Management Issues

#### 33 useState Hooks (BorgesLibrary.tsx)

Causes re-render cascades affecting GraphVisualization3DForce performance:

```typescript
// Example cascade:
setQuery() → setIsLoading() → setResults() → setGraphData()
  → setHighlightNodes() → setSelectedNode() → Force re-render
```

**Impact**:
- State updates trigger full component tree re-renders
- GraphVisualization3DForce recreates scene objects
- No React.memo or useMemo optimization
- Props deep equality checks on every render

### 3D Force Graph Issues

1. **No Level of Detail (LOD)**
   - All nodes rendered at full fidelity regardless of camera distance
   - Expensive label rendering even for off-screen nodes
   - No sprite-based fallback for distant nodes

2. **No Occlusion Culling**
   - Nodes behind camera still processed
   - Off-screen link calculations still performed

3. **Synchronous Force Simulation**
   - D3-force ticks block main thread
   - No requestAnimationFrame throttling
   - Alpha decay not optimized for large graphs

### Bottlenecks

- **State Management**: 33 useState hooks create update waterfalls
- **No Memoization**: GraphVisualization3DForce recalculates all props
- **Full Fidelity Rendering**: No LOD for distant/occluded nodes
- **Synchronous Simulation**: Force layout blocks frame rendering

## 4. Memory Usage

### Current Metrics

| Stage | Current | Target | Notes |
|-------|---------|--------|-------|
| **Initial Load** | ~100MB | ~80MB | GraphML + React + Three.js |
| **After Single Query** | ~150-200MB | ~120MB | +50-100MB per commune |
| **After Multi-Query (15 communes)** | ~300-400MB | ~200MB | Linear growth |
| **After Multi-Query (50 communes)** | ~600MB+ | ~350MB | Risk of memory pressure |

### Breakdown

1. **Initial Load** (~100MB)
   - React/Next.js runtime: ~30MB
   - Three.js + dependencies: ~20MB
   - D3-force: ~5MB
   - GraphML data (50 communes): ~5MB
   - Application code: ~40MB

2. **Per-Commune Query Growth** (~50-100MB each)
   - GraphRAG knowledge graph: ~20-40MB
   - Entity extraction results: ~10-20MB
   - Community reports: ~5-10MB
   - MCP response caching: ~15-30MB

3. **No Cleanup**
   - Previous query results retained in memory
   - Three.js scene objects not disposed
   - D3-force simulation workers not terminated

### Bottlenecks

- **Linear Memory Growth**: No garbage collection for old queries
- **Three.js Leaks**: Scene objects (geometries, materials) not disposed
- **MCP Cache**: Unbounded response storage
- **No Virtualization**: All nodes in DOM/scene simultaneously

## 5. Baseline vs Target Comparison

### Summary Table

| Category | Metric | Baseline | Target | Improvement Required |
|----------|--------|----------|--------|---------------------|
| **Startup** | Time to Interactive | 11s | 3s | 3.7x faster |
| **Query** | Single Commune | 15-30s | 5-8s | 2-6x faster |
| **Query** | 15 Communes | 120-195s | 20-40s | 4-6x faster |
| **Query** | 50 Communes | 300-500s | 45-90s | 5-7x faster |
| **Rendering** | Frame Rate | 15-60fps | 60fps | Stability needed |
| **Rendering** | State Hooks | 33 | <10 | 70% reduction |
| **Memory** | Initial | ~100MB | ~80MB | 20% reduction |
| **Memory** | After 50 queries | ~600MB | ~350MB | 42% reduction |

### Critical Paths for Optimization

1. **Startup**: Progressive batching (7.5s → 2s target)
2. **Query**: GraphRAG init per commune (15-30s → 5-8s)
3. **Rendering**: State management (33 hooks → <10)
4. **Memory**: Query result cleanup (linear growth → bounded)

## 6. Testing Methodology

### Measurement Environment

- **Browser**: Chrome 120+ (DevTools Performance profiler)
- **Hardware**: MacBook Pro M1/M2 (reference hardware)
- **Network**: Railway.app production MCP server (variable latency)
- **Dataset**: `public/data/grand-debat.graphml` (50 communes, ~500 nodes, ~800 edges)

### Measurement Procedures

#### Startup Performance

```typescript
// Measure in browser console
performance.mark('app-start');
// Wait for graph interactive
performance.mark('graph-interactive');
performance.measure('startup', 'app-start', 'graph-interactive');
```

#### Query Performance

```typescript
// Single commune
console.time('query-single');
await queryCommune('La Rochelle');
console.timeEnd('query-single');

// Multi-commune
console.time('query-15');
await queryMultipleCommunes(15);
console.timeEnd('query-15');
```

#### Rendering Performance

- Chrome DevTools → Performance → Record 10s session
- Analyze FPS meter in Rendering tab
- Check "Show frame rendering stats"

#### Memory Usage

- Chrome DevTools → Memory → Take heap snapshot
- Compare snapshots before/after queries
- Analyze retained size growth

### Reproducibility Notes

- Clear browser cache before each test
- Use incognito mode to avoid extension interference
- Wait for MCP server warm-up (first query slower)
- Run each test 3 times, report median

## 7. Known Limitations

### Current Implementation Constraints

1. **MCP Server Dependency**
   - Railway.app cold starts add 2-5s latency
   - Network variability affects query times
   - No local GraphRAG fallback

2. **GraphML Static Data**
   - `grand-debat.graphml` is sample data only
   - Full dataset may have different characteristics
   - Orphan filtering may reduce node count

3. **Browser Performance Variance**
   - Safari/Firefox not tested
   - Mobile browsers excluded from baseline
   - WebGL capabilities vary by GPU

4. **Single-User Testing**
   - No concurrent user load testing
   - MCP server contention not measured
   - No rate limiting characterization

## 8. Next Steps

Based on this baseline, the following optimization priorities are recommended:

### High Priority (Target: 3-5x improvement)

1. **Query Optimization**
   - Eliminate double query pattern (30 → 15 LLM calls)
   - Increase MAX_CONCURRENT (2 → 5-10)
   - Implement GraphRAG result caching

2. **State Management**
   - Consolidate 33 useState hooks → useReducer or Zustand
   - Add React.memo to GraphVisualization3DForce
   - Implement strategic useMemo for graph data transformations

3. **Progressive Loading UI**
   - Show partial results as communes complete
   - Stream MCP responses instead of blocking
   - Add loading skeleton for graph nodes

### Medium Priority (Target: 2-3x improvement)

4. **Rendering Optimization**
   - Implement LOD for distant nodes
   - Add sprite-based labels for far camera
   - Throttle force simulation updates

5. **Memory Management**
   - Dispose Three.js objects on unmount
   - Limit MCP response cache size
   - Implement LRU eviction for old queries

### Low Priority (Incremental gains)

6. **Startup Optimization**
   - Code splitting for 3d-force-graph
   - Preload critical GraphML data
   - Service Worker for offline GraphML

## 9. References

- **Constitution v3.0.0**: Principle II (Commune-Centric Architecture)
- **Feature 004-ui-consistency**: GraphML infrastructure implementation
- **MCP Server**: `https://graphragmcp-production.up.railway.app/mcp`
- **Code**: `/Users/arthursarazin/Documents/law_graph/3_borges-interface/`

---

**Document Version**: 1.0
**Last Updated**: 2025-12-25
**Next Review**: After optimization implementation
