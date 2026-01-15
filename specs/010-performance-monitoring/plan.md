# Implementation Plan: Performance Monitoring & SLA Dashboard

**Branch**: `010-performance-monitoring` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)

## Summary

Add client-side performance monitoring dashboard tracking query response times, graph rendering FPS, SLA compliance (90% queries <10s, 90% interactions >30fps), slow query detection (>15s threshold), and metrics export to enable production operations and regression detection per Constitution Principle XI (Performance Optimization Architecture).

**Primary Requirements**:
- FR-001: Track query response time (milliseconds) for all queries
- FR-002: Track graph rendering FPS during camera movement
- FR-003: Calculate SLA compliance: query <10s (pass/fail), graph >30fps (pass/fail)
- FR-004: Display SLA compliance percentage over last 20 queries/interactions
- FR-005: Alert when query exceeds 15s (slow query threshold)
- FR-006: Log slow queries with: timestamp, queryText, duration, entityCount, complexityMetrics
- FR-007: Distinguish network latency from backend processing time

**Technical Approach**:
- **Query Timing**: Performance API (`performance.now()`) around MCP calls
- **FPS Tracking**: `requestAnimationFrame` callback with rolling average (last 60 frames)
- **SLA Calculation**: Sliding window of last 20 metrics with pass/fail counting
- **Metrics Storage**: Browser session storage (100 entries, FIFO eviction per Constitution)
- **Dashboard UI**: Floating FAB on mobile, side panel on desktop, real-time updates

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 19.2.1, Next.js 16.0.7
**Primary Dependencies**: Existing (uses browser Performance API, requestAnimationFrame)
**Storage**: Browser session storage (performance metrics), CSV export capability
**Testing**: Jest + RTL for unit tests, Playwright for E2E performance tracking scenarios
**Target Platform**: Web (mobile-first responsive, minimized FAB on mobile)
**Project Type**: Web application (existing frontend codebase)
**Performance Goals**: Metrics collection overhead <5ms, dashboard render <100ms, live FPS updates every 500ms
**Constraints**: Must not degrade existing performance, align with Constitution SLA targets (<10s query, >30fps graph)
**Scale/Scope**: Tracks up to 100 queries and 200 interactions per session (FIFO eviction)

## Constitution Check

### ✅ Principle XI: Performance Optimization Architecture
**Status**: PASS - Feature IMPLEMENTS performance tracking per Constitution targets (<10s query, >30fps graph).

### ✅ Principle IX: RAG Observability
**Status**: PASS - Provides visibility into GraphRAG operations (query latency, complexity metrics).

### ✅ Principle VIII: Mobile-First Responsiveness
**Status**: PASS - Dashboard minimized to floating FAB on mobile, full panel on desktop.

**Overall Gate Result**: ✅ **PASS**

## Project Structure

### Source Code

```text
3_borges-interface/
├── src/
│   ├── components/
│   │   ├── PerformanceDashboard.tsx         # NEW: Main dashboard container
│   │   ├── MetricCard.tsx                   # NEW: Individual metric display (query time, FPS)
│   │   ├── SLAComplianceGauge.tsx          # NEW: 90% SLA compliance visualization
│   │   ├── SlowQueryAlert.tsx              # NEW: >15s query alert banner
│   │   └── PerformanceFAB.tsx              # NEW: Mobile floating action button
│   ├── hooks/
│   │   ├── useQueryPerformance.ts          # NEW: Query timing measurement
│   │   ├── useFPSMonitor.ts                # NEW: Graph FPS tracking
│   │   ├── useSLACompliance.ts             # NEW: SLA calculation (last 20 metrics)
│   │   └── useMetricsExport.ts             # NEW: CSV export hook
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── performance-tracker.ts      # NEW: Core metrics collection
│   │   │   ├── sla-calculator.ts           # NEW: Compliance percentage logic
│   │   │   └── metrics-csv-generator.ts    # NEW: CSV formatting for export
│   │   └── config/
│   │       └── sla-thresholds.ts           # NEW: 10s query, 30fps graph targets
│   └── types/
│       └── performance-metrics.ts          # NEW: PerformanceMetric, SLACompliance, SlowQueryLog
└── tests/
    ├── unit/
    │   ├── sla-calculator.test.ts          # NEW: Compliance calculation tests
    │   ├── useQueryPerformance.test.ts     # NEW: Timing measurement tests
    │   └── useFPSMonitor.test.ts           # NEW: FPS tracking tests
    └── e2e/
        ├── performance-dashboard.spec.ts    # NEW: User Story 1 scenarios
        └── slow-query-alerts.spec.ts       # NEW: User Story 2 scenarios
```

## Phase 0: Research

1. **Network vs Backend Timing**: Decision: Use `performance.getEntriesByType('resource')` for network time, subtract from total for backend
2. **FPS Calculation**: Decision: Rolling average of last 60 `requestAnimationFrame` deltas (1 second window at 60fps)
3. **SLA Window**: Decision: Sliding window of last 20 metrics (not time-based) matching spec requirement
4. **Slow Query Threshold**: Decision: 15s from spec (1.5× Constitution 10s target)
5. **Metrics Persistence**: Decision: Session storage with FIFO eviction at 100 entries (matches Constitution cache strategy)

## Phase 1: Design & Contracts

### Data Model

```typescript
interface PerformanceMetric {
  timestamp: number               // Date.now()
  metricType: 'query' | 'fps'
  value: number                   // milliseconds for query, fps for graph
  slaPass: boolean                // query <10s OR fps >30
  details: {
    queryText?: string            // For query metrics
    entityCount?: number          // For query metrics
    networkTimeMs?: number        // Network latency
    backendTimeMs?: number        // Backend processing
    cameraDistance?: number       // For FPS metrics
  }
}

interface SLACompliance {
  totalQueries: number
  passedQueries: number
  compliancePercentage: number    // (passedQueries / totalQueries) × 100
  threshold: number               // 90% from spec
}

interface SlowQueryLog {
  timestamp: number
  queryText: string
  duration: number                // Total time (ms)
  entityCount: number
  networkTime: number
  backendTime: number
  complexityMetrics: {
    entityCount: number
    relationshipCount: number
    communeCount: number
  }
}
```

### Validation Rules
- Query SLA: <10s (FR-003, matches Constitution)
- Graph FPS SLA: >30fps (FR-003, matches Constitution)
- SLA compliance calculated over last 20 metrics (FR-004)
- Slow query threshold: >15s (FR-005)
- Network/backend time separation required (FR-007)
- Metrics storage max 100 entries (Constitution cache strategy)

### Quickstart

```typescript
import { useQueryPerformance, useFPSMonitor, useSLACompliance } from '@/hooks'

function App() {
  const { trackQueryStart, trackQueryEnd } = useQueryPerformance()
  const { currentFPS, slaPass } = useFPSMonitor()
  const { querySLA, graphSLA } = useSLACompliance()

  const handleQuery = async (query: string) => {
    const startId = trackQueryStart(query)
    const result = await fetchGraphRAG(query)
    trackQueryEnd(startId, result.entityCount)
    return result
  }

  return (
    <>
      <PerformanceDashboard querySLA={querySLA} graphSLA={graphSLA} currentFPS={currentFPS} />
      {/* Main app */}
    </>
  )
}
```

## Re-evaluated Constitution Check

✅ **PASS** - Phase 1 design aligns with Constitution Principle XI performance targets. Ready for `/speckit.tasks`.

## Next Steps

1. Run `/speckit.tasks` to generate actionable task breakdown
2. Implement in order: Query timing → FPS monitor → SLA calculation → Dashboard UI → Slow query alerts → CSV export
3. Test coverage: Unit tests (SLA calculation, timing precision) + E2E (user stories 1-2)
4. Success Criteria: SC-001 (Query SLA ≥90%), SC-002 (Graph FPS SLA ≥90%), SC-003 (100% slow query detection)
