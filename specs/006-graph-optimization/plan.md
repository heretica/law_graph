# Implementation Plan: Graph Performance Optimization

**Branch**: `006-graph-optimization` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-graph-optimization/spec.md`

## Summary

Optimize Grand Débat National interface performance to achieve:
- **Startup**: 11s → <3s (73% reduction) via batching elimination, session pooling, memoization
- **Query**: 120s → <30s for 15 communes (75% reduction) via concurrency increase, caching, single query mode
- **Rendering**: Consistent >30fps via state consolidation, LOD implementation, reduced re-renders

## Technical Context

**Language/Version**: TypeScript 5.2.2 (Frontend), Python 3.11 (Backend)
**Primary Dependencies**:
- Frontend: React 19.2.0, Next.js 16, 3d-force-graph 1.79.0, Three.js 0.181.0
- Backend: FastAPI, nano_graphrag, asyncio, LiteLLM
**Storage**: N/A (no new persistence - leverages existing in-memory caches)
**Testing**: Manual performance benchmarking (time-to-interactive, query latency, fps)
**Target Platform**: Web browser (Chrome 90+, Firefox 88+, Safari 14+) with WebGL
**Project Type**: Web application (Next.js frontend + Python MCP backend)
**Performance Goals**:
- Startup: <3s time-to-interactive
- Query: <30s for 15 communes, <10s for single commune
- Rendering: >30fps with 500+ nodes
**Constraints**:
- Memory: <500MB browser heap
- No breaking changes to MCP API
- Constitution principles must be preserved
**Scale/Scope**: 50 communes, ~8,000 entities, single concurrent user (current)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Impact Assessment |
|-----------|--------|-------------------|
| I. End-to-End Interpretability | ✅ PASS | Provenance chains preserved in all caches |
| II. Civic Provenance Chain | ✅ PASS | commune_id included in cached responses |
| III. No Orphan Nodes | ✅ PASS | Filtering logic unchanged, only memoized |
| IV. Commune-Centric Architecture | ✅ PASS | Commune attribution maintained in pooled instances |
| V. Cross-Commune Civic Analysis | ✅ PASS | Multi-commune queries enhanced by optimizations |
| VI. Single-Source Civic Data | ✅ PASS | No additional data sources introduced |
| VII. Functional Civic Interface | ✅ PASS | UI simplification aligns with minimalism |
| VIII. Mobile-First Responsiveness | ⚠ OUT OF SCOPE | Mobile optimizations deferred to separate spec |
| IX. RAG Observability | ✅ PASS | Performance metrics enhance observability |

**User Experience Standards**:
- Current: >2s queries (FAILING) → Target: <30s for 15 communes (WILL PASS)
- Current: Variable fps → Target: ≥30fps (WILL PASS per constitution)
- API latency: Will improve (caching, pooling)

**GATE RESULT**: ✅ PASSED - No violations, all principles maintained

## Project Structure

### Documentation (this feature)

```text
specs/006-graph-optimization/
├── plan.md              # This file
├── research.md          # Phase 0: Performance analysis findings
├── data-model.md        # Phase 1: Cache/state structures
├── quickstart.md        # Phase 1: Performance testing guide
├── contracts/           # Phase 1: No new API contracts (optimization only)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Frontend (Next.js)
3_borges-interface/
├── src/
│   ├── components/
│   │   ├── BorgesLibrary.tsx          # State consolidation (33 hooks → 3)
│   │   └── GraphVisualization3DForce.tsx  # Batching, LOD, particles
│   ├── lib/
│   │   ├── services/
│   │   │   ├── reconciliation.ts      # Cache headers, dedup
│   │   │   └── law-graphrag.ts        # Single-pass transform
│   │   └── cache/
│   │       └── query-cache.ts         # NEW: Client-side query cache
│   ├── hooks/
│   │   └── useQueryAnimation.ts       # Memoization
│   └── app/
│       └── api/
│           └── law-graphrag/
│               └── route.ts           # Session pooling, JSON parsing
└── tests/
    └── performance/
        └── benchmarks.md              # Manual benchmark documentation

# Backend (Python MCP Server - separate repo: graphRAGmcp)
# Reference only - changes documented but not in this repo
server.py                              # Concurrency (MAX_CONCURRENT)
graphrag.py                            # Shared LLM cache
gdb_networkx.py                        # Entity hash index
vdb_nanovectordb.py                    # Embedding cache
```

**Structure Decision**: Existing web application structure preserved. New files limited to:
- `3_borges-interface/src/lib/cache/query-cache.ts` (client-side caching)
- `specs/006-graph-optimization/tests/performance/benchmarks.md` (performance documentation)

## Implementation Phases

### Phase 1: Quick Wins (P0)

**Target**: Startup 11s → 3s, Query 120s → 90s

| Change | File | Lines | Impact |
|--------|------|-------|--------|
| Replace setTimeout batching with requestAnimationFrame | GraphVisualization3DForce.tsx | 519-527 | -7.5s startup |
| MCP session pooling (5-min TTL) | route.ts | 111-114 | -0.5-2s per request |
| Increase MAX_CONCURRENT 2→6 | server.py | 659 | -25-30s query |
| Cache headers max-age=300 | reconciliation.ts | 272 | Eliminate redundant requests |
| useMemo node filtering | BorgesLibrary.tsx | 584-635 | O(n)→O(1) per render |

### Phase 2: React & Rendering (P1)

**Target**: Startup 3s → 2s, Smooth 30fps

| Change | File | Lines | Impact |
|--------|------|-------|--------|
| Consolidate 33 hooks → 3 state objects | BorgesLibrary.tsx | 131-234 | 50% fewer re-renders |
| useCallback all handlers | BorgesLibrary.tsx | 493+ | Prevent child re-renders |
| LOD: disable particles when zoomed out | GraphVisualization3DForce.tsx | 300-306 | 40-60% fewer draw calls |
| Fix double JSON parsing | route.ts | 84-101 | 30-40% faster deser |

### Phase 3: Backend Optimizations (P1)

**Target**: Query 90s → 25s

| Change | File | Lines | Impact |
|--------|------|-------|--------|
| GraphRAG instance LRU cache (10, 5-min TTL) | server.py | 676-680 | -15-30s per query |
| Single query mode (global only) | server.py | 683-694 | -50% LLM calls |
| Shared LLM response cache singleton | graphrag.py | 181-187 | -5-20s overlapping queries |
| Entity name hash index | gdb_networkx.py | 125-135 | O(1) entity lookup |

### Phase 4: Data Pipeline (P2)

**Target**: Query 25s → 20s

| Change | File | Impact |
|--------|------|--------|
| Single-pass transformation (4→1 pass) | law-graphrag.ts:67-102 | 60% faster transform |
| Set-based dedup (Map→Set) | reconciliation.ts:358-360 | 75% faster dedup |
| Embedding cache (hash-based) | vdb_nanovectordb.py:54-65 | -7.5-15s |

### Phase 5: Architecture (P3 - Strategic)

**Target**: Perceived latency 20s → 5s

| Change | Impact |
|--------|--------|
| Response gzip compression | 60-75% payload reduction |
| Streaming partial results | Perceived latency drops to 5-10s |
| Component splitting (BorgesLibrary 1350 lines → 4 components) | Isolated re-renders |

## Critical Files Summary

| File | Priority | Changes |
|------|----------|---------|
| `GraphVisualization3DForce.tsx` | P0 | Batching, LOD, particles |
| `BorgesLibrary.tsx` | P0-P1 | Memoization, state consolidation |
| `route.ts` | P0-P1 | Session pooling, JSON parsing |
| `reconciliation.ts` | P0-P2 | Cache headers, dedup |
| `law-graphrag.ts` | P2 | Single-pass transform |
| `server.py` (backend) | P0-P1 | Concurrency, pooling |
| `graphrag.py` (backend) | P1 | Shared LLM cache |
| `gdb_networkx.py` (backend) | P1 | Hash index |
| `vdb_nanovectordb.py` (backend) | P2 | Embedding cache |

## Expected Results

| Phase | Startup | Query (15 communes) |
|-------|---------|---------------------|
| Baseline | 11s | 120-195s |
| Phase 1 (Quick Wins) | 3s | 90s |
| Phase 2 (React) | 2s | 90s |
| Phase 3 (Backend) | 2s | 25s |
| Phase 4 (Pipeline) | 1.5s | 20s |
| Phase 5 (Architecture) | 1s | Perceived: 5s |

## Complexity Tracking

> No violations requiring justification - all changes are optimizations within existing architecture.

| Consideration | Decision | Rationale |
|---------------|----------|-----------|
| State consolidation | 33→3 hooks | React best practice, measurable improvement |
| Backend caching | LRU with TTL | Standard pattern, no new dependencies |
| LOD implementation | Zoom-based | 3d-force-graph native capability |
