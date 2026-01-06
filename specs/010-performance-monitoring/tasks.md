# Tasks: Performance Monitoring & SLA Dashboard

**Input**: Design documents from `/specs/010-performance-monitoring/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: No dedicated test phase - metrics validation via browser console and E2E scenarios per spec
**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)
- File paths relative to `3_borges-interface/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and TypeScript foundations

- [ ] T001 Create type definitions file `src/types/performance-metrics.ts` with PerformanceMetric, SLACompliance, SlowQueryLog interfaces
- [ ] T002 [P] Create SLA thresholds config `src/lib/config/sla-thresholds.ts` with QUERY_SLA_MS = 10000, GRAPH_FPS_SLA = 30, SLOW_QUERY_THRESHOLD_MS = 15000

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core performance tracking infrastructure that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Implement query performance tracker `useQueryPerformance.ts` in `src/hooks/` exposing { trackQueryStart, trackQueryEnd, queryMetrics }
- [ ] T004 [P] Implement FPS monitor `useFPSMonitor.ts` in `src/hooks/` using requestAnimationFrame with rolling 60-frame average
- [ ] T005 [P] Implement SLA compliance calculator `sla-calculator.ts` in `src/lib/utils/` calculating (passedCount / totalCount) × 100 over last 20 metrics

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Real-Time Performance Metrics (Priority: P1) 🎯 MVP

**Goal**: Display real-time query time, FPS, and SLA pass/fail status in dashboard

**Independent Test**: Submit queries and navigate graph → View metrics dashboard → Verify displays query time, FPS, SLA compliance status

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create metrics dashboard container component `PerformanceDashboard.tsx` in `src/components/` (right panel desktop, bottom drawer mobile)
- [ ] T007 [P] [US1] Create metric card component `MetricCard.tsx` in `src/components/` displaying: label, value, SLA status (✓/✗), color coding (green/red)
- [ ] T008 [P] [US1] Create performance FAB component `PerformanceFAB.tsx` in `src/components/` for mobile: floating button showing current FPS/query time
- [ ] T009 [US1] Implement query timing in BorgesLibrary.tsx: call trackQueryStart() before MCP call, trackQueryEnd() after response
- [ ] T010 [US1] Implement FPS tracking in GraphVisualization3DForce.tsx: start FPS monitor on camera movement, stop when idle
- [ ] T011 [US1] Wire MetricCard to useQueryPerformance: display latest query time with SLA status (<10s green, >10s red)
- [ ] T012 [US1] Wire MetricCard to useFPSMonitor: display current FPS with live updates every 500ms
- [ ] T013 [US1] Integrate PerformanceDashboard with BorgesLibrary.tsx: add dashboard to layout, pass metric data

**Checkpoint**: User Story 1 complete - users see real-time performance metrics

---

## Phase 4: User Story 2 - Slow Query Detection & Alerts (Priority: P1)

**Goal**: Detect queries >15s, log with complexity metrics, display warning alerts

**Independent Test**: Submit slow query → Verify alert appears → Check slow query log

### Implementation for User Story 2

- [ ] T014 [P] [US2] Create slow query alert component `SlowQueryAlert.tsx` in `src/components/` showing warning banner with query details
- [ ] T015 [P] [US2] Create slow query log component `SlowQueryLog.tsx` in `src/components/` listing: timestamp, query text, duration, entity count
- [ ] T016 [US2] Implement slow query detection in useQueryPerformance: check if duration > 15000ms, trigger alert
- [ ] T017 [US2] Implement slow query logging: save to session storage with structure { timestamp, queryText, duration, entityCount, networkTime, backendTime }
- [ ] T018 [US2] Implement network vs backend time separation: use performance.getEntriesByType('resource') for network time, subtract from total for backend
- [ ] T019 [US2] Wire SlowQueryAlert to useQueryPerformance: show warning when slow query detected with query text and duration
- [ ] T020 [US2] Wire SlowQueryLog to session storage: display list of slow queries with expandable details

**Checkpoint**: User Story 2 complete - slow queries detected and logged

---

## Phase 5: User Story 3 - SLA Compliance Tracking (Priority: P2)

**Goal**: Calculate and display SLA compliance percentage over last 20 queries/interactions

**Independent Test**: Use system for 20 queries → View SLA dashboard → Verify shows compliance % and pass/fail breakdown

### Implementation for User Story 3

- [ ] T021 [P] [US3] Create SLA compliance hook `useSLACompliance.ts` in `src/hooks/` exposing { querySLA, graphSLA, overallCompliance }
- [ ] T022 [P] [US3] Create SLA compliance gauge component `SLAComplianceGauge.tsx` in `src/components/` showing percentage with visual indicator (gauge chart or progress bar)
- [ ] T023 [US3] Implement SLA compliance calculation in useSLACompliance: use sla-calculator.ts on last 20 query metrics
- [ ] T024 [US3] Implement SLA degradation warning: trigger alert when compliance drops below 90% threshold
- [ ] T025 [US3] Wire SLAComplianceGauge to useSLACompliance: display "Query SLA: 90% (18/20 passed)" with green/yellow/red color coding
- [ ] T026 [US3] Add separate gauge for graph FPS SLA: calculate from FPS metrics over last 20 interactions

**Checkpoint**: User Story 3 complete - SLA compliance tracked and displayed

---

## Phase 6: Metrics Export & Persistence

**Purpose**: Enable metrics export as CSV and persist across page refresh

- [ ] T027 [P] Create metrics export hook `useMetricsExport.ts` in `src/hooks/` exposing { exportAsCSV, exportAllMetrics }
- [ ] T028 [P] Implement CSV generator `metrics-csv-generator.ts` in `src/lib/utils/` with columns: timestamp, metricType, value, slaPass, details
- [ ] T029 Implement CSV export in useMetricsExport: generate RFC 4180 compliant CSV with UTF-8 BOM, download via Blob URL
- [ ] T030 Add "Export metrics" button to PerformanceDashboard: trigger browser download of CSV file "performance-metrics-[timestamp].csv"
- [ ] T031 Implement session storage persistence in useQueryPerformance: save metrics array to sessionStorage, restore on page load
- [ ] T032 Implement FIFO eviction in session storage: limit to 100 entries, remove oldest when capacity exceeded (matches Constitution cache strategy)

**Checkpoint**: Metrics export and persistence functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Mobile responsiveness, performance optimization, edge case handling

- [ ] T033 [P] Add mobile-responsive styles to PerformanceDashboard: bottom drawer on mobile (<768px), collapsible side panel on desktop
- [ ] T034 [P] Add mobile FAB interaction: tap to expand full dashboard as bottom sheet, swipe down to close
- [ ] T035 [P] Implement dashboard auto-collapse on mobile: minimize to FAB after 10s of inactivity
- [ ] T036 Implement FPS update throttling: update live FPS display every 500ms (not every frame) to reduce battery usage on mobile
- [ ] T037 Add device capability detection: show warning if device consistently measures <30fps (not SLA failure, but device limitation)
- [ ] T038 Implement 50th percentile SLA for slow devices: calculate SLA on median FPS instead of individual interactions
- [ ] T039 Performance check: Verify metrics collection overhead <5ms per query, dashboard render <100ms
- [ ] T040 Edge case: Handle metrics storage quota exceeded → clear oldest 50 entries and log warning
- [ ] T041 Edge case: Handle negative time values (clock skew) → use Math.abs() or discard invalid metrics
- [ ] T042 Add visual distinction between network vs backend time in SlowQueryLog: stacked bar chart or split display

**Checkpoint**: Feature complete and production-ready

---

## Dependencies & Execution Strategy

### Story Dependencies
```
Setup (Phase 1)
  ↓
Foundational (Phase 2) ← BLOCKING
  ↓
US1 (Phase 3) ← MVP 🎯
  ↓
US2 (Phase 4) ← Can start after US1
  ↓
US3 (Phase 5) ← Can start after US1 + US2
  ↓
Export & Persistence (Phase 6) ← Can start after US1
  ↓
Polish (Phase 7)
```

### Parallel Execution Opportunities

**Within Setup Phase (Phase 1)**:
- T002 can run independent of T001 (different files)

**Within Foundational Phase (Phase 2)**:
- T004, T005 can run in parallel (different files)

**Within US1 (Phase 3)**:
- T006, T007, T008 can run in parallel (different components)

**Within US2 (Phase 4)**:
- T014, T015 can run in parallel (different components)

**Within US3 (Phase 5)**:
- T021, T022 can run in parallel (hook + component)

**Within Export & Persistence (Phase 6)**:
- T027, T028 can run in parallel (hook + utility)

**Within Polish (Phase 7)**:
- T033, T034, T035 can run in parallel (different responsive styles)

### MVP Strategy

**Recommended MVP**: User Story 1 only (Phase 1 + 2 + 3)
- **Tasks**: T001-T013 (13 tasks)
- **Deliverable**: Real-time performance metrics dashboard
- **Value**: Production operations visibility, SLA monitoring
- **Testable**: Independently verifiable via dashboard UI

**Full P1 Delivery**: User Stories 1-2 (Phases 1-4)
- **Tasks**: T001-T020 (20 tasks)
- **Deliverable**: Performance monitoring + slow query detection
- **Value**: Enables targeted optimization

**Complete Feature**: All user stories (Phases 1-7)
- **Tasks**: T001-T042 (42 tasks)
- **Deliverable**: Production-ready with SLA tracking, export, mobile polish

---

## Task Summary

**Total Tasks**: 42
- **Setup**: 2 tasks
- **Foundational**: 3 tasks
- **User Story 1 (P1)**: 8 tasks 🎯 MVP
- **User Story 2 (P1)**: 7 tasks
- **User Story 3 (P2)**: 6 tasks
- **Export & Persistence**: 6 tasks
- **Polish**: 10 tasks

**Parallel Opportunities**: 20 tasks marked [P] (48% parallelizable)

**Independent Test Criteria**:
- ✅ US1: Submit queries → View dashboard → Verify query time, FPS, SLA status
- ✅ US2: Submit slow query → Verify alert → Check slow query log
- ✅ US3: Use for 20 queries → View SLA dashboard → Verify compliance %

**All tasks follow checklist format with Task IDs, Story labels, and exact file paths** ✅
