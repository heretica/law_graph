# Implementation Plan: Error Recovery & Graceful Degradation

**Branch**: `011-error-recovery` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)

## Summary

Add graceful error recovery with visible retry UI (countdown timer, exponential backoff 1s→2s→4s), partial result display (show successful communes when some fail), fallback to cached data/GraphML, and session restoration (query, communes, graph position) to improve network error recovery rate from <50% to 80% and reduce user frustration by 50%.

**Primary Requirements**:
- FR-003: Exponential backoff: 1s, 2s, 4s delays (max 3 retries)
- FR-004: Display partial results when some communes succeed and others fail
- FR-005: Show clear warning banner indicating which communes failed
- FR-006: Support retry of failed communes only (not entire query)
- FR-007: Fall back to cached query results when network unavailable
- FR-008: Fall back to GraphML visualization when no cached results available
- FR-010: Restore session state (query, communes, graph position) on reconnect

**Technical Approach**:
- **Retry UI**: Toast notification (desktop) or bottom sheet (mobile) with countdown timer and manual retry button
- **Exponential Backoff**: Align with Constitution MCP retry strategy (1s, 2s retries) + user-facing 4s third retry
- **Partial Results**: Merge successful commune responses, display warning banner with failed commune list
- **Fallback Hierarchy**: MCP → Query cache (5min TTL) → GraphML (browser cache)
- **Session Restoration**: Session storage (query, communes, graph camera position, open panels)

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 19.2.1, Next.js 16.0.7
**Primary Dependencies**: Existing (uses MCP retry infrastructure, query cache, GraphML loader)
**Storage**: Browser session storage (session state), query cache (5min TTL), GraphML browser cache
**Testing**: Jest + RTL for unit tests, Playwright for E2E retry/fallback scenarios
**Target Platform**: Web (mobile-first responsive, bottom sheet modals on mobile)
**Project Type**: Web application (existing frontend codebase)
**Performance Goals**: Retry UI render <100ms, fallback activation <500ms, session restore <1s
**Constraints**: Must preserve existing MCP retry logic, maintain query cache TTL (5min), Constitution exponential backoff
**Scale/Scope**: Handles up to 50 commune failures, session state <1MB (fits session storage)

## Constitution Check

### ✅ Principle VI: Single-Source Civic Data Foundation
**Status**: PASS - Fallback hierarchy preserves MCP as primary, cache/GraphML as graceful degradation.

### ✅ Principle VIII: Mobile-First Responsiveness
**Status**: PASS - Bottom sheet retry UI on mobile, swipe-down dismiss, full-width retry button.

### ✅ Principle XI: Performance Optimization Architecture
**Status**: PASS - Retry strategy aligns with Constitution (1s, 2s backoff), leverages existing cache layers.

**Overall Gate Result**: ✅ **PASS**

## Project Structure

### Source Code

```text
3_borges-interface/
├── src/
│   ├── components/
│   │   ├── RetryUI.tsx                      # NEW: Countdown timer + manual retry button
│   │   ├── PartialResultsWarning.tsx        # NEW: Failed commune list banner
│   │   ├── OfflineModeBanner.tsx            # NEW: "Mode hors ligne" indicator
│   │   └── SessionRestorationToast.tsx      # NEW: "Session expirée. Reconnexion..." message
│   ├── hooks/
│   │   ├── useRetryStrategy.ts              # NEW: Exponential backoff logic (1s, 2s, 4s)
│   │   ├── usePartialResults.ts             # NEW: Merge successful communes, track failures
│   │   ├── useFallbackStrategy.ts           # NEW: MCP → cache → GraphML hierarchy
│   │   └── useSessionRestore.ts             # NEW: Save/restore query, communes, graph state
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── exponential-backoff.ts       # NEW: Retry delay calculation
│   │   │   ├── partial-result-merger.ts     # NEW: Combine successful commune results
│   │   │   └── session-state-serializer.ts  # NEW: Session storage serialization
│   │   └── config/
│   │       └── retry-config.ts              # NEW: Max retries (3), delays (1s, 2s, 4s)
│   └── types/
│       └── error-recovery.ts                # NEW: RetryState, PartialResult, SessionState
└── tests/
    ├── unit/
    │   ├── exponential-backoff.test.ts      # NEW: Retry delay tests
    │   ├── partial-result-merger.test.ts    # NEW: Commune result merging tests
    │   └── useRetryStrategy.test.ts         # NEW: Retry state machine tests
    └── e2e/
        ├── retry-with-countdown.spec.ts     # NEW: User Story 1 scenarios
        ├── partial-results.spec.ts          # NEW: User Story 2 scenarios
        └── session-restore.spec.ts          # NEW: User Story 4 scenarios
```

## Phase 0: Research

1. **Retry Count Alignment**: Decision: 3 user-facing retries (1s, 2s, 4s) vs. Constitution 2 internal retries - intentionally more permissive for UX
2. **Partial Result Merging**: Decision: Client-side aggregation preserving per-commune attribution (similar to multi-commune query)
3. **Fallback Detection**: Decision: Check query cache first (O(1) lookup), then GraphML cache availability (browser cache API)
4. **Session State Structure**: Decision: Store query, selectedCommunes, graphCameraPosition (vec3), openPanels (boolean flags)
5. **Cache Expiry Handling**: Decision: 5min TTL from Constitution; expired cache triggers GraphML fallback

## Phase 1: Design & Contracts

### Data Model

```typescript
interface RetryState {
  attemptNumber: number           // 0, 1, 2 (max 3 total attempts)
  nextRetryDelay: number          // 1000ms, 2000ms, 4000ms
  maxAttempts: number             // 3
  errorType: string               // 'network' | 'timeout' | 'server'
  isRetrying: boolean
}

interface PartialResult {
  successfulCommunes: string[]
  failedCommunes: Array<{
    communeId: string
    communeName: string
    errorReason: string
  }>
  canRetry: boolean               // True if retry of failed communes possible
  result: any                     // Merged successful responses
}

interface SessionState {
  lastQuery: string
  selectedCommunes: string[]
  graphCameraPosition: { x: number; y: number; z: number }
  openPanels: {
    provenance: boolean
    statistics: boolean
    filters: boolean
  }
  timestamp: number
}

interface FallbackStrategy {
  primarySource: 'MCP'
  fallbackSource: 'cache' | 'graphml'
  activeFallback?: 'cache' | 'graphml'  // Currently active fallback
}
```

### Validation Rules
- Retry delays MUST be 1000ms, 2000ms, 4000ms (FR-003)
- Max retries MUST be 3 (FR-003)
- Partial results MUST show which communes failed (FR-005)
- Retry of failed communes only (not entire query) (FR-006)
- Session state MUST preserve: query, communes, graph position, open panels (FR-010)
- Fallback hierarchy: MCP → cache → GraphML (FR-007, FR-008)

### Quickstart

```typescript
import { useRetryStrategy, usePartialResults, useFallbackStrategy, useSessionRestore } from '@/hooks'

function QueryWithRecovery() {
  const { retry, retryState } = useRetryStrategy({ maxAttempts: 3, delays: [1000, 2000, 4000] })
  const { mergePartialResults, partialResult } = usePartialResults()
  const { getFallbackData } = useFallbackStrategy()
  const { saveSessionState, restoreSessionState } = useSessionRestore()

  const handleQuery = async (query: string, communes: string[]) => {
    saveSessionState({ query, communes, graphPosition, openPanels })

    try {
      const result = await fetchGraphRAG(query, communes)
      return result
    } catch (error) {
      if (error.type === 'network') {
        // Try retry
        const retryResult = await retry(() => fetchGraphRAG(query, communes))
        if (retryResult) return retryResult

        // Fallback to cache or GraphML
        const fallbackData = await getFallbackData(query, communes)
        return fallbackData
      }
    }
  }

  return (
    <>
      {retryState.isRetrying && <RetryUI retryState={retryState} onManualRetry={retry} />}
      {partialResult && <PartialResultsWarning partialResult={partialResult} />}
    </>
  )
}
```

## Re-evaluated Constitution Check

✅ **PASS** - Phase 1 design aligns with Constitution retry strategy and cache hierarchy. Ready for `/speckit.tasks`.

## Next Steps

1. Run `/speckit.tasks` to generate actionable task breakdown
2. Implement in order: Retry UI + exponential backoff → Partial results → Fallback hierarchy → Session restoration
3. Test coverage: Unit tests (backoff, merging) + E2E (user stories 1, 2, 4)
4. Success Criteria: SC-001 (80% error recovery), SC-002 (70% partial result acceptance), SC-006 (50% frustration reduction)
