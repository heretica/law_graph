# Tasks: Interactive Provenance Chain Navigation

**Input**: Design documents from `/specs/009-interactive-provenance/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: No dedicated test phase - features testable via UI interaction per spec
**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4)
- File paths relative to `3_borges-interface/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and TypeScript foundations

- [ ] T001 Create type definitions file `src/types/provenance-chain.ts` with ProvenanceChain, UsedEntity, TraversedRelationship, SourceChunk interfaces
- [ ] T002 [P] Create provenance utility file `src/lib/utils/provenance-indexer.ts` with entity → answer reverse index builder

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core provenance infrastructure that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Implement provenance navigation hook `useProvenanceNavigation.ts` in `src/hooks/` exposing { breadcrumb, currentStep, navigateTo, navigationHistory }
- [ ] T004 [P] Implement reverse provenance hook `useReverseProvenance.ts` in `src/hooks/` with entity → answers mapping (Map<entityId, answerIds[]>)
- [ ] T005 [P] Implement entity highlighter utility `entity-highlighter.ts` in `src/lib/utils/` marking entities in text chunks with <mark> tags

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Navigate Answer to Source Text (Priority: P1) 🎯 MVP

**Goal**: Enable click-through from RAG answer → entities → relationships → source chunks

**Independent Test**: Click RAG answer → View entity list → Click entity → See citizen quotes with commune attribution

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create provenance panel component `ProvenancePanel.tsx` in `src/components/` (collapsible right panel desktop, full-screen mobile)
- [ ] T007 [P] [US1] Create entity list component `EntityList.tsx` in `src/components/` displaying used entities with type badges, relevance scores
- [ ] T008 [P] [US1] Create source chunk list component `SourceChunkList.tsx` in `src/components/` showing citizen quotes with commune name, date, highlighted entities
- [ ] T009 [US1] Wire entity click handler in EntityList: sync `highlightedEntityId` state with GraphVisualization3DForce.tsx
- [ ] T010 [US1] Implement entity highlighting sync: update 3D graph when entity clicked from provenance panel
- [ ] T011 [US1] Add commune click handler in SourceChunkList: filter chunks by commune and highlight commune node in graph
- [ ] T012 [US1] Integrate ProvenancePanel with BorgesLibrary.tsx: open panel when answer clicked, pass provenance data

**Checkpoint**: User Story 1 complete - users can navigate from answer to source text

---

## Phase 4: User Story 2 - Breadcrumb Trail Navigation (Priority: P1)

**Goal**: Display interactive breadcrumb Query → Entities → Relationships → Source Chunks with step counts

**Independent Test**: Submit query → Click breadcrumb elements → Verify each step navigates to corresponding view

### Implementation for User Story 2

- [ ] T013 [P] [US2] Create breadcrumb component `ProvenanceBreadcrumb.tsx` in `src/components/` showing: Query → X Entities → Y Relationships → Z Source Chunks
- [ ] T014 [P] [US2] Create relationship path viewer component `RelationshipPathViewer.tsx` in `src/components/` displaying traversed relationships with hop distance color coding
- [ ] T015 [US2] Implement breadcrumb step count calculation: parse usedEntities.length, traversedRelationships.length, sourceChunks.length from provenance
- [ ] T016 [US2] Wire breadcrumb click handlers: navigateTo('entities'), navigateTo('relationships'), navigateTo('chunks')
- [ ] T017 [US2] Implement relationship hop distance visualization: color/opacity encoding for direct (hop 1), second-order (hop 2), third-order (hop 3)
- [ ] T018 [US2] Add relationship path highlighting in 3D graph: animate traversal when "Relationships" breadcrumb clicked
- [ ] T019 [US2] Integrate ProvenanceBreadcrumb into ProvenancePanel header with navigation state sync

**Checkpoint**: User Story 2 complete - users can navigate via breadcrumb trail

---

## Phase 5: User Story 3 - Reverse Navigation: Graph to Provenance (Priority: P1)

**Goal**: Enable clicking entity in graph to see which answers referenced it

**Independent Test**: Click entity in graph → View "Used in answers" panel → Click answer to see full provenance

### Implementation for User Story 3

- [ ] T020 [P] [US3] Implement reverse index builder in `provenance-indexer.ts`: buildEntityAnswerIndex(provenanceData[]) → Map<entityId, answerIds[]>
- [ ] T021 [P] [US3] Create reverse provenance panel component `ReverseProvenancePanel.tsx` in `src/components/` showing "Used in X answers" with answer snippets
- [ ] T022 [US3] Wire graph entity click handler in GraphVisualization3DForce.tsx: trigger reverse provenance panel on node click
- [ ] T023 [US3] Implement answer snippet click handler: scroll to full answer in main UI and open forward provenance panel
- [ ] T024 [US3] Add "Standalone entity" message when entity has no answer usage (answerIds.length === 0)
- [ ] T025 [US3] Integrate reverse provenance index build on page load: parse all answers and build Map in useEffect

**Checkpoint**: User Story 3 complete - bidirectional navigation enabled

---

## Phase 6: User Story 4 - Export Provenance Audit Trail (Priority: P2)

**Goal**: Export complete provenance chain as JSON for audit/compliance

**Independent Test**: Open provenance → Click "Export audit trail" → Verify JSON contains all required fields

### Implementation for User Story 4

- [ ] T026 [P] [US4] Create provenance export hook `useProvenanceExport.ts` in `src/hooks/` exposing { exportAsJSON, exportAllAnswers }
- [ ] T027 [P] [US4] Implement JSON serialization in useProvenanceExport: generate { query, answerText, entities[], relationships[], sourceChunks[], timestamp }
- [ ] T028 [US4] Implement browser download via Blob URL: create downloadable JSON file with filename "provenance-[timestamp].json"
- [ ] T029 [US4] Add export button to ProvenancePanel header: "Export as JSON" icon button (desktop), prominent button (mobile)
- [ ] T030 [US4] Implement multi-answer export: "Export all answers" option generating array of provenance objects
- [ ] T031 [US4] Add user selection UI: modal with radio buttons "Current answer" / "All answers on page"

**Checkpoint**: User Story 4 complete - audit trail export functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Mobile responsiveness, performance optimization, edge case handling

- [ ] T032 [P] Add mobile-responsive styles to ProvenancePanel: full-screen overlay on mobile (<768px), swipe-to-close gesture
- [ ] T033 [P] Add mobile breadcrumb styles: horizontal scroll with sticky overflow indicators
- [ ] T034 [P] Add source chunk pagination on mobile: show 3 chunks initially, "Load more" button for >3
- [ ] T035 Implement navigation state persistence: preserve breadcrumb position across panel open/close (FR-009)
- [ ] T036 Add partial provenance warning: display "Partial provenance available" banner when entities/chunks missing
- [ ] T037 Implement long text truncation for source chunks: show first 200 words with "Read more" expansion for >500 words
- [ ] T038 Add circular relationship detection: mark relationships with "Circular reference" label if source === target or forms cycle
- [ ] T039 Performance check: Ensure entity list renders <100ms for 100 entities, breadcrumb updates <50ms
- [ ] T040 Edge case: Handle entity with no highlighting in text chunk (entity not found in chunkText) → show entity separately
- [ ] T041 Mobile performance: Limit entity list to top 20 by relevance on mobile (FR-010 mobile optimization)

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
US4 (Phase 6) ← Can start after US1
  ↓
Polish (Phase 7)
```

### Parallel Execution Opportunities

**Within Setup Phase (Phase 1)**:
- T002 can run independent of T001 (different files)

**Within Foundational Phase (Phase 2)**:
- T004 and T005 can run in parallel (different utility files)

**Within US1 (Phase 3)**:
- T006, T007, T008 can run in parallel (different components)

**Within US2 (Phase 4)**:
- T013, T014 can run in parallel (different components)

**Within US3 (Phase 5)**:
- T020, T021 can run in parallel (utility + component)

**Within US4 (Phase 6)**:
- T026, T027 can run in parallel (hook structure + serialization logic)

**Within Polish (Phase 7)**:
- T032, T033, T034 can run in parallel (different responsive styles)

### MVP Strategy

**Recommended MVP**: User Story 1 only (Phase 1 + 2 + 3)
- **Tasks**: T001-T012 (12 tasks)
- **Deliverable**: Basic provenance navigation from answer to source text
- **Value**: Core transparency feature, Constitution Principle II implementation
- **Testable**: Independently verifiable via click-through

**Full P1 Delivery**: User Stories 1-3 (Phases 1-5)
- **Tasks**: T001-T025 (25 tasks)
- **Deliverable**: Complete bidirectional provenance navigation with breadcrumb trail
- **Value**: Full interpretability loop (forward + reverse navigation)

**Complete Feature**: All user stories (Phases 1-7)
- **Tasks**: T001-T041 (41 tasks)
- **Deliverable**: Production-ready with audit export and mobile polish

---

## Task Summary

**Total Tasks**: 41
- **Setup**: 2 tasks
- **Foundational**: 3 tasks
- **User Story 1 (P1)**: 7 tasks 🎯 MVP
- **User Story 2 (P1)**: 7 tasks
- **User Story 3 (P1)**: 6 tasks
- **User Story 4 (P2)**: 6 tasks
- **Polish**: 10 tasks

**Parallel Opportunities**: 17 tasks marked [P] (41% parallelizable)

**Independent Test Criteria**:
- ✅ US1: Click RAG answer → View entity list → Click entity → See citizen quotes
- ✅ US2: Submit query → Click breadcrumb elements → Verify navigation
- ✅ US3: Click entity in graph → View "Used in answers" → Click answer
- ✅ US4: Open provenance → Export JSON → Verify structure

**All tasks follow checklist format with Task IDs, Story labels, and exact file paths** ✅
