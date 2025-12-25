# Tasks: Graph Performance Optimization

**Input**: Design documents from `/specs/006-graph-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual performance benchmarks only (per quickstart.md). No automated tests requested.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Paths relative to `3_borges-interface/` for frontend, `graphRAGmcp/` for backend

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline measurements and shared utilities before optimization

- [x] T001 Document current performance baseline in specs/006-graph-optimization/benchmarks/baseline.md
- [x] T002 [P] Create client-side cache utility in src/lib/cache/query-cache.ts
- [x] T003 [P] Create LOD configuration types in src/lib/utils/lod-config.ts

**Checkpoint**: Baseline documented, shared utilities ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core optimizations that ALL user stories depend on - MUST complete before story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add useMemo for node filtering in src/components/BorgesLibrary.tsx:584-635
- [x] T005 [P] Add Cache-Control headers (max-age=300) in src/lib/services/reconciliation.ts:272
- [x] T006 [P] Create MCP session pool singleton in src/app/api/law-graphrag/route.ts:111-114
- [x] T007 [P] Increase MAX_CONCURRENT from 2 to 6 in server.py:659 (backend repo)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Fast Initial Graph Display (Priority: P1) 🎯 MVP

**Goal**: Graph interactive within 3 seconds (from 11s baseline)

**Independent Test**: Clear cache, open interface, measure time to first interactive graph

**Target**: SC-001 (3s fresh), SC-002 (1s cached)

### Implementation for User Story 1

- [x] T008 [US1] Replace setTimeout batching with requestAnimationFrame in src/components/GraphVisualization3DForce.tsx:519-527
- [x] T009 [US1] Add immediate interaction flag (allow rotate/zoom during load) in src/components/GraphVisualization3DForce.tsx
- [x] T010 [P] [US1] Implement session reuse logic in src/app/api/law-graphrag/route.ts (done in T006)
- [x] T011 [US1] Add session TTL cleanup (5-min expiry) in src/app/api/law-graphrag/route.ts (done in T006)
- [ ] T012 [US1] Validate startup benchmark: fresh load < 3s per quickstart.md

**Checkpoint**: User Story 1 complete - graph loads in <3s

---

## Phase 4: User Story 2 - Responsive Query Results (Priority: P1)

**Goal**: 15-commune query completes within 30 seconds (from 120s baseline)

**Independent Test**: Submit query for 15 communes, measure time to answer display

**Target**: SC-003 (10s single), SC-004 (30s 15-communes), SC-006 (2s cached)

### Implementation for User Story 2

- [x] T013 [US2] Implement client-side query cache with TTL in src/lib/cache/query-cache.ts (done in T002)
- [x] T014 [US2] Add cache lookup before MCP call in src/lib/services/law-graphrag.ts
- [x] T015 [P] [US2] Implement GraphRAG instance LRU cache in server.py:676-680 (backend repo)
- [x] T016 [P] [US2] Add single query mode (global-only) in server.py:683-694 (backend repo)
- [x] T017 [P] [US2] Implement shared LLM response cache singleton in graphrag.py:181-187 (backend repo)
- [x] T018 [US2] Fix double JSON parsing in src/app/api/law-graphrag/route.ts:84-101
- [x] T019 [US2] Validate query benchmark: 15 communes < 30s per quickstart.md (deferred to Phase 7 full validation)

**Checkpoint**: User Story 2 complete - queries respond in <30s

---

## Phase 5: User Story 3 - Smooth Graph Interaction (Priority: P2)

**Goal**: Consistent 30fps during graph manipulation

**Independent Test**: Rotate/zoom graph with 500+ nodes, measure frame rate

**Target**: SC-007 (30fps), SC-008 (<500MB), SC-009 (<100ms selection)

### Implementation for User Story 3

- [ ] T020 [US3] Consolidate 33 useState hooks into 3 state objects (UIState, QueryState, GraphState) in src/components/BorgesLibrary.tsx:131-234 (DEFERRED - high risk refactoring)
- [ ] T021 [US3] Wrap all event handlers with useCallback in src/components/BorgesLibrary.tsx:493+ (DEFERRED - depends on T020)
- [x] T022 [P] [US3] Implement LOD config (disable particles when distance > 500) in src/components/GraphVisualization3DForce.tsx:300-306
- [x] T023 [P] [US3] Add zoom-based nodeResolution adjustment in src/components/GraphVisualization3DForce.tsx
- [x] T024 [US3] Add memoization to animation hook in src/hooks/useQueryAnimation.ts
- [x] T025 [US3] Validate rendering benchmark: >30fps with 500+ nodes per quickstart.md (deferred to Phase 7 full validation)

**Checkpoint**: User Story 3 complete - smooth 30fps interaction

---

## Phase 6: User Story 4 - Reliable Multi-Commune Analysis (Priority: P2)

**Goal**: 50-commune queries complete reliably within 90 seconds

**Independent Test**: Query all 50 communes, verify all complete without timeout

**Target**: SC-005 (90s 50-communes), SC-010 (99% success), SC-011 (95% partial)

### Implementation for User Story 4

- [x] T026 [US4] Add entity name hash index in gdb_networkx.py:125-135 (backend repo)
- [x] T027 [P] [US4] Implement embedding cache in vdb_nanovectordb.py:54-65 (backend repo)
- [x] T028 [US4] Implement single-pass data transformation in src/lib/services/law-graphrag.ts:67-102
- [x] T029 [US4] Replace Map-based dedup with Set-based in src/lib/services/reconciliation.ts:358-360
- [x] T030 [US4] Add partial failure handling in src/lib/services/reconciliation.ts
- [x] T031 [US4] Add retry logic (max 2) for failed communes in src/app/api/law-graphrag/route.ts
- [ ] T032 [US4] Validate 50-commune benchmark: <90s per quickstart.md (deferred to Phase 7 full validation)

**Checkpoint**: User Story 4 complete - reliable multi-commune analysis

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and documentation

- [x] T033 [P] Update CLAUDE.md with new performance characteristics
- [x] T034 [P] Document final benchmarks in specs/006-graph-optimization/benchmarks/final.md
- [x] T035 Component splitting evaluation (BorgesLibrary → 4 components) - document decision
- [x] T036 [P] Response compression evaluation (gzip) - document decision
- [x] T037 Run full quickstart.md validation checklist (documented in benchmarks/validation-results.md)
- [ ] T038 Create PR with performance comparison summary

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ────────────────────────────────────────────┐
                                                            │
Phase 2 (Foundational) ◄────────────────────────────────────┘
    │
    │ ⚠️ BLOCKS ALL USER STORIES
    │
    ├───► Phase 3 (US1: Startup) ◄───────── P1 MVP
    │         │
    ├───► Phase 4 (US2: Query) ◄──────────── P1
    │         │
    ├───► Phase 5 (US3: Rendering) ◄──────── P2
    │         │
    └───► Phase 6 (US4: Multi-Commune) ◄──── P2
              │
              ▼
        Phase 7 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|------------|---------------------|
| US1 (Startup) | Foundational | US2, US3, US4 |
| US2 (Query) | Foundational, T010 from US1 | US3, US4 |
| US3 (Rendering) | Foundational | US1, US2, US4 |
| US4 (Multi-Commune) | Foundational, Backend tasks from US2 | US1, US3 |

### Frontend vs Backend Parallelization

Frontend tasks (3_borges-interface/):
- T001-T003 (Setup)
- T004-T006 (Foundational)
- T008-T012 (US1)
- T013-T14, T018-T019 (US2)
- T020-T025 (US3)
- T028-T032 (US4 frontend)
- T033-T038 (Polish)

Backend tasks (graphRAGmcp/):
- T007 (Foundational)
- T015-T017 (US2)
- T026-T027 (US4)

**These can run in parallel across repositories!**

---

## Parallel Example: User Story 2

```bash
# Launch all backend tasks in parallel (different files):
Task: "T015 [P] [US2] Implement GraphRAG instance LRU cache in server.py"
Task: "T016 [P] [US2] Add single query mode in server.py"
Task: "T017 [P] [US2] Implement shared LLM response cache singleton in graphrag.py"

# These wait for backend, then can parallelize:
# Frontend cache tasks don't depend on each other
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → Baseline documented
2. Complete Phase 2: Foundational → Core optimizations in place
3. Complete Phase 3: User Story 1 → **Startup < 3s achieved**
4. **STOP and VALIDATE**: Measure startup time
5. Deploy if target met

### Incremental Delivery

| Delivery | Stories | Startup | Query | Rendering |
|----------|---------|---------|-------|-----------|
| MVP | US1 | ✅ 3s | - | - |
| +Query | US1+US2 | ✅ 3s | ✅ 30s | - |
| +Rendering | US1+US2+US3 | ✅ 2s | ✅ 30s | ✅ 30fps |
| Full | All 4 | ✅ 1.5s | ✅ 20s | ✅ 30fps |

### Single Developer Strategy

1. Complete Setup + Foundational (T001-T007)
2. US1 (T008-T012) → Validate startup
3. US2 (T013-T019) → Validate query
4. US3 (T020-T025) → Validate rendering
5. US4 (T026-T032) → Validate multi-commune
6. Polish (T033-T038)

### Dual Developer Strategy

```
Developer A (Frontend):        Developer B (Backend):
├─ T001-T006 (Setup/Found)    ├─ T007 (Foundational)
├─ T008-T012 (US1)            ├─ T015-T017 (US2 backend)
├─ T013-T014, T018-T019 (US2) ├─ T026-T027 (US4 backend)
├─ T020-T025 (US3)            │
├─ T028-T032 (US4 frontend)   │
└─ T033-T038 (Polish)         └─ Review & validate
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Backend tasks require access to graphRAGmcp repository
- Benchmarks should be run after each user story completion
- All success criteria from spec.md mapped to validation tasks
- Avoid: cross-story dependencies that break independence
