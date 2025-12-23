# Tasks: Grand Débat UI Consistency with Borges Interface

**Input**: Design documents from `/specs/004-ui-consistency/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No tests explicitly requested in the specification. Visual regression testing mentioned but implemented as manual verification tasks.

**Organization**: Tasks are grouped by user story (6 stories: US1-US6) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `3_borges-interface/src/` at repository root
- Components: `3_borges-interface/src/components/`
- Services: `3_borges-interface/src/lib/services/`
- Types: `3_borges-interface/src/types/`
- Utils: `3_borges-interface/src/lib/utils/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and GraphML infrastructure

- [x] T001 Verify Tailwind config matches reference interface in 3_borges-interface/tailwind.config.js
- [x] T002 [P] Create GraphML type definitions in 3_borges-interface/src/types/graphml.ts
- [x] T003 [P] Create public data directory at 3_borges-interface/public/data/
- [x] T004 [P] Verify Google Fonts (Cormorant Garamond) import in 3_borges-interface/src/app/layout.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Warning**: No user story work can begin until this phase is complete

- [x] T005 Create parseGraphML function in 3_borges-interface/src/lib/utils/graphml-parser.ts
- [x] T006 Create validateGraphML function in 3_borges-interface/src/lib/utils/graphml-parser.ts
- [x] T007 [P] Create communeMapping lookup table in 3_borges-interface/src/lib/utils/commune-mapping.ts
- [x] T008 Add GraphML loading hook in 3_borges-interface/src/hooks/useGraphMLData.ts
- [x] T009 [P] Place sample GraphML file at 3_borges-interface/public/data/grand-debat.graphml

**Checkpoint**: Foundation ready - GraphML parsing infrastructure complete, user story implementation can now begin

---

## Phase 3: User Story 1 - GraphML-Based Data Loading (Priority: P1)

**Goal**: Load civic graph data directly from GraphML files without Neo4j dependency

**Independent Test**: Load interface and verify graph data appears from GraphML files without Neo4j connection errors

### Implementation for User Story 1

- [x] T010 [US1] Update BorgesLibrary.tsx to import and use useGraphMLData hook in 3_borges-interface/src/components/BorgesLibrary.tsx
- [x] T011 [US1] Remove Neo4j/reconciliation service dependencies from BorgesLibrary.tsx
- [x] T012 [US1] Transform GraphML data to reconciliationData format for visualization compatibility in 3_borges-interface/src/components/BorgesLibrary.tsx
- [x] T013 [US1] Add error boundary for GraphML loading failures in 3_borges-interface/src/components/BorgesLibrary.tsx
- [x] T014 [US1] Add loading state display during GraphML fetch/parse in 3_borges-interface/src/components/BorgesLibrary.tsx
- [x] T015 [US1] Filter orphan nodes (degree === 0) before passing to visualization in 3_borges-interface/src/components/BorgesLibrary.tsx

**Checkpoint**: User Story 1 complete - Interface loads graph from GraphML without database dependency

---

## Phase 4: User Story 2 - Consistent Visual Identity (Priority: P1)

**Goal**: Match dark theme, typography, and color palette with reference Borges Library interface

**Independent Test**: Visual side-by-side comparison shows identical styling for equivalent components

### Implementation for User Story 2

- [x] T016 [P] [US2] Verify borges-dark (#0a0a0a) background in 3_borges-interface/src/app/page.tsx
- [x] T017 [P] [US2] Verify borges-light (#f5f5f5) text color across all components in 3_borges-interface/src/components/
- [x] T018 [P] [US2] Verify borges-accent (#7dd3fc) on interactive elements in 3_borges-interface/src/components/QueryInterface.tsx
- [x] T019 [US2] Confirm Cormorant Garamond font renders correctly with fallbacks in 3_borges-interface/src/app/globals.css
- [x] T020 [US2] Add hexagonal library assembly loading animation in 3_borges-interface/src/components/BorgesLibrary.tsx
- [x] T021 [US2] Add Borges quote during loading states in 3_borges-interface/src/components/BorgesLibrary.tsx

**Checkpoint**: User Story 2 complete - Visual identity matches reference interface

---

## Phase 5: User Story 3 - Unified 3D Graph Visualization (Priority: P1)

**Goal**: 3D graph visualization behaves identically to Borges Library interface

**Independent Test**: Graph interactions (rotate, zoom, click) produce identical visual feedback

### Implementation for User Story 3

- [x] T022 [US3] Add isCommune() detection function replacing isBook() in 3_borges-interface/src/components/GraphVisualization3DForce.tsx
- [x] T023 [US3] Update charge force strength to use COMMUNE_ detection in 3_borges-interface/src/components/GraphVisualization3DForce.tsx
- [x] T024 [US3] Update link force distance using commune detection in 3_borges-interface/src/components/GraphVisualization3DForce.tsx
- [x] T025 [US3] Update radial force to position communes at center in 3_borges-interface/src/components/GraphVisualization3DForce.tsx
- [x] T026 [US3] Add COMMUNE entity type color (#ffd700) to typeColors mapping in 3_borges-interface/src/components/GraphVisualization3DForce.tsx
- [x] T027 [US3] Update entityTypeToFrench mapping to include Communes label in 3_borges-interface/src/components/GraphVisualization3DForce.tsx
- [x] T028 [US3] Verify node tooltip styling matches reference in 3_borges-interface/src/components/RelationshipTooltip.tsx
- [x] T029 [US3] Verify link tooltip styling matches reference in 3_borges-interface/src/components/RelationshipTooltip.tsx

**Checkpoint**: User Story 3 complete - 3D graph visualization behavior matches reference

---

## Phase 6: User Story 4 - Consistent Query Interface (Priority: P2)

**Goal**: Query input and response display match Borges Library interface

**Independent Test**: Submit query and compare input styling, loading animation, response formatting

### Implementation for User Story 4

- [x] T030 [P] [US4] Verify query input border styling in 3_borges-interface/src/components/QueryInterface.tsx
- [x] T031 [P] [US4] Verify placeholder text formatting in 3_borges-interface/src/components/QueryInterface.tsx
- [x] T032 [US4] Verify focus states match reference in 3_borges-interface/src/components/QueryInterface.tsx
- [x] T033 [US4] Ensure loading animation (hexagonal) displays during processing in 3_borges-interface/src/components/QueryInterface.tsx
- [x] T034 [US4] Verify highlighted entity color-coding in responses in 3_borges-interface/src/components/HighlightedText.tsx
- [x] T035 [US4] Verify response text formatting matches reference in 3_borges-interface/src/components/QueryInterface.tsx

**Checkpoint**: User Story 4 complete - Query interface styling matches reference

---

## Phase 7: User Story 5 - Provenance Panel with Civic Context (Priority: P2)

**Goal**: Provenance panel displays entities, relationships, and source chunks with commune attribution

**Independent Test**: After query, provenance panel shows three tabs with commune attribution

### Implementation for User Story 5

- [x] T036 [US5] Replace book provenance labels with commune labels in 3_borges-interface/src/components/ProvenancePanel.tsx
- [x] T037 [US5] Update entities tab to show commune attribution in 3_borges-interface/src/components/ProvenancePanel.tsx
- [x] T038 [US5] Update chunks tab to show commune of origin in 3_borges-interface/src/components/ProvenancePanel.tsx
- [x] T039 [US5] Replace bookMapping with communeMapping in 3_borges-interface/src/components/EntityDetailModal.tsx
- [x] T040 [US5] Update entity detail modal to display commune provenance in 3_borges-interface/src/components/EntityDetailModal.tsx
- [x] T041 [US5] Update getCommuneDisplayName helper function in 3_borges-interface/src/components/EntityDetailModal.tsx

**Checkpoint**: User Story 5 complete - Provenance displays civic context with commune attribution

---

## Phase 8: User Story 6 - Mobile Responsive Consistency (Priority: P3)

**Goal**: Responsive behavior matches Borges Library mobile experience

**Independent Test**: Resize browser to mobile widths and verify layout adapts correctly

### Implementation for User Story 6

- [x] T042 [P] [US6] Verify mobile breakpoint (< 768px) layout adaptation in 3_borges-interface/src/components/BorgesLibrary.tsx
- [x] T043 [P] [US6] Verify hamburger menu collapse on mobile in 3_borges-interface/src/components/BorgesLibrary.tsx
- [x] T044 [US6] Test touch gestures (pinch/drag) on graph visualization in 3_borges-interface/src/components/GraphVisualization3DForce.tsx
- [x] T045 [US6] Verify modals are full-screen on mobile in 3_borges-interface/src/components/EntityDetailModal.tsx
- [x] T046 [US6] Verify 44px minimum touch targets on interactive elements in 3_borges-interface/src/components/
- [x] T047 [US6] Verify font sizes (minimum 16px body text) on mobile in 3_borges-interface/src/app/globals.css

**Checkpoint**: User Story 6 complete - Mobile responsive behavior matches reference

---

## Phase 9: Mobile Responsiveness Testing

**Purpose**: Ensure all UI changes comply with Constitution Principle VIII - Mobile-First Responsiveness

- [x] T048 [P] Test on mobile viewport (< 768px) - verify layout adapts correctly
- [x] T049 [P] Test on tablet viewport (768-1024px) - verify intermediate breakpoint
- [x] T050 [P] Verify touch targets are at least 44x44 pixels for all interactive elements
- [x] T051 [P] Test touch gestures on graph visualization (tap, pinch, drag, double-tap)
- [x] T052 Test navigation menu collapse on mobile (hamburger menu)
- [x] T053 Verify modals/panels are scrollable and dismissible on small screens
- [x] T054 Verify font sizes (minimum 16px body text on mobile)
- [x] T055 Measure First Contentful Paint on 3G connection (target < 3s)
- [x] T056 Test graph visualization on devices with limited GPU capabilities

**Checkpoint**: All UI changes pass mobile responsiveness validation

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [x] T057 [P] Visual comparison: side-by-side screenshot comparison with reference interface
- [x] T058 [P] Performance verification: GraphML loads within 2 seconds
- [x] T059 [P] Performance verification: Graph interactions respond within 100ms
- [x] T060 Code cleanup: Remove any unused Neo4j/reconciliation imports
- [x] T061 Update CLAUDE.md with GraphML-specific notes if needed
- [x] T062 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (GraphML Loading) should complete before US2-US6 as other stories need loaded data
  - US2 (Visual Identity) and US3 (3D Graph) can proceed in parallel after US1
  - US4 (Query Interface) and US5 (Provenance Panel) can proceed in parallel after US1
  - US6 (Mobile) should be last user story as it validates all responsive behavior
- **Mobile Testing (Phase 9)**: Depends on all UI-related stories (US2-US6)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - No dependencies on other stories
- **User Story 2 (P1)**: Foundation only - Can start after US1 data loads
- **User Story 3 (P1)**: Foundation only - Can start after US1 data loads
- **User Story 4 (P2)**: Foundation only - Can start after US1 data loads
- **User Story 5 (P2)**: Foundation only - Can start after US1 data loads
- **User Story 6 (P3)**: Foundation only - Tests responsive behavior of US2-US5

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once US1 completes: US2, US3, US4, US5 can start in parallel
- All tasks within a user story marked [P] can run in parallel
- Mobile testing tasks marked [P] can run in parallel

---

## Parallel Example: After Foundational Phase

```bash
# After T009 completes (Foundational done), launch User Stories 2-5 in parallel:

# Team member A: User Story 2 (Visual Identity)
Task: "T016 [P] [US2] Verify borges-dark (#0a0a0a) background"
Task: "T017 [P] [US2] Verify borges-light (#f5f5f5) text color"
Task: "T018 [P] [US2] Verify borges-accent (#7dd3fc) on interactive elements"

# Team member B: User Story 3 (3D Graph)
Task: "T022 [US3] Add isCommune() detection function"
Task: "T023 [US3] Update charge force strength"

# Team member C: User Story 5 (Provenance)
Task: "T036 [US5] Replace book provenance labels with commune labels"
Task: "T039 [US5] Replace bookMapping with communeMapping"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (GraphML Loading)
4. **STOP and VALIDATE**: Interface loads from GraphML without Neo4j
5. Deploy/demo if ready - this is the core architectural change

### Incremental Delivery

1. Complete Setup + Foundational + US1 → GraphML loading works (MVP!)
2. Add US2 (Visual Identity) + US3 (3D Graph) → Core visual consistency
3. Add US4 (Query Interface) + US5 (Provenance) → Full interpretability
4. Add US6 (Mobile) → Complete responsive support
5. Each story adds value without breaking previous stories

### Recommended Execution Order

1. **Phase 1**: T001-T004 (Setup)
2. **Phase 2**: T005-T009 (Foundational) - GraphML infrastructure
3. **Phase 3**: T010-T015 (US1) - GraphML loading **← MVP complete here**
4. **Phase 4-5**: T016-T029 (US2+US3) - Visual identity + 3D graph (parallel)
5. **Phase 6-7**: T030-T041 (US4+US5) - Query + Provenance (parallel)
6. **Phase 8**: T042-T047 (US6) - Mobile responsiveness
7. **Phase 9**: T048-T056 - Mobile testing
8. **Phase 10**: T057-T062 - Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- The key architectural change (GraphML vs Neo4j) is in US1 - complete this first
- Visual consistency tasks (US2-US5) can largely proceed in parallel
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
