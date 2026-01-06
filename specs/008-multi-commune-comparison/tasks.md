# Tasks: Multi-Commune Comparative Analysis

**Input**: Design documents from `/specs/008-multi-commune-comparison/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: No dedicated test phase - features testable via UI interaction per spec
**Organization**: Tasks grouped by user story for independent implementation

## Phase 1: Setup

- [ ] T001 Create type definitions `src/types/multi-commune.ts` with EntityPrevalence, ComparisonHeatmap, CommuneSelection, AggregateStatistics interfaces
- [ ] T002 [P] Load commune list from existing `src/lib/config/commune-list.json` (50 communes metadata)

## Phase 2: Foundational

**⚠️ CRITICAL**: Core multi-commune query infrastructure

- [ ] T003 Implement batched query logic `batchCommuneQueries()` in `src/lib/utils/multi-commune-aggregator.ts` (5 communes per batch, 1500ms delay)
- [ ] T004 [P] Implement prevalence calculator `calculatePrevalence()` in `src/lib/utils/prevalence-calculator.ts` ((communeCount / total) × 100, classify >70% regional, 20-70% local, <20% hyperlocal)
- [ ] T005 [P] Implement heatmap color scale `generateColorScale()` in `src/lib/utils/heatmap-color-scale.ts` (normalize 0-max mentions to color intensity)

**Checkpoint**: Foundation ready

## Phase 3: User Story 1 - Select Multiple Communes (Priority: P1) 🎯 MVP

**Goal**: Multi-select UI for 2-50 communes with chip display

**Independent Test**: Select 2 communes → verify chips appear → submit query → verify aggregated results

- [ ] T006 [P] [US1] Create multi-select component `CommuneMultiSelect.tsx` with checkboxes for all 50 communes
- [ ] T007 [P] [US1] Create chips component `CommuneChips.tsx` displaying selected communes with X dismiss buttons
- [ ] T008 [P] [US1] Create commune selection hook `useCommuneSelection.ts` exposing { selectedCommunes, toggleCommune, clearAll }
- [ ] T009 [US1] Wire multi-select to main UI: replace single commune selector with CommuneMultiSelect
- [ ] T010 [US1] Display CommuneChips below query input (scrollable container, max 50 chips)
- [ ] T011 [US1] Implement multi-commune query: call backend with commune_ids[] parameter, aggregate responses client-side
- [ ] T012 [US1] Add partial failure handling: merge successful communes, show warning banner "Données partielles : X communes indisponibles"

**Checkpoint**: US1 complete - users can select multiple communes and get aggregated results

## Phase 4: User Story 2 - Visualize Regional Entity Patterns (Priority: P1)

**Goal**: Heatmap showing entities × communes with color intensity for mention frequency

**Independent Test**: Select 5 communes, submit query → verify heatmap displays entities as rows, communes as columns, color intensity indicates mentions

- [ ] T013 [P] [US2] Create heatmap component `EntityHeatmap.tsx` using HTML canvas rendering (entities rows, communes columns)
- [ ] T014 [P] [US2] Create heatmap data transformer `buildHeatmapData()` in `src/lib/utils/heatmap-transformer.ts` (2D array cells[entityIdx][communeIdx])
- [ ] T015 [US2] Implement canvas rendering in EntityHeatmap: draw grid, row/column labels, color-coded cells
- [ ] T016 [US2] Add heatmap cell click handler: highlight entity in 3D graph, show related citizen quotes from that commune
- [ ] T017 [US2] Add heatmap hover tooltip: "ENTITY mentioned X times in COMMUNE"
- [ ] T018 [US2] Implement heatmap pagination: show top 50 entities, "Load more" button for >50 entities
- [ ] T019 [US2] Add mobile horizontal scroll for heatmap with sticky entity labels (left column)

**Checkpoint**: US2 complete - users can visualize regional patterns via heatmap

## Phase 5: User Story 3 - Aggregate Statistics Dashboard (Priority: P2)

**Goal**: Statistics panel showing top 10 concerns with prevalence percentages

**Independent Test**: Query 10 communes → verify statistics shows "127 unique entities", top 10 list with prevalence %

- [ ] T020 [P] [US3] Create statistics panel component `AggregateStatsPanel.tsx` (collapsible side panel desktop, bottom sheet mobile)
- [ ] T021 [P] [US3] Create aggregate stats hook `useAggregateStats.ts` calculating total entities, top 10 by frequency, prevalence %
- [ ] T022 [US3] Display statistics: "X unique entities across Y communes", top 10 list "1. ENTITY (Z% prevalence, N/Y communes)"
- [ ] T023 [US3] Add click handler on statistic item: filter graph to show only that entity and relationships
- [ ] T024 [US3] Implement CSV export `useCsvExport.ts`: generate CSV with columns (Entity, Type, Total Mentions, Commune Count, Prevalence %)
- [ ] T025 [US3] Add "Export statistics" button triggering browser download of CSV file

**Checkpoint**: US3 complete - users get quantitative summary and export capability

## Phase 6: User Story 4 - Regional vs Local Filtering (Priority: P2)

**Goal**: Prevalence slider (0-100%) filtering entities by regional/local/hyperlocal classification

**Independent Test**: Toggle "Regional patterns only (>70%)" → verify graph shows only entities in 7+ of 10 selected communes

- [ ] T026 [P] [US4] Create prevalence slider component `PrevalenceFilterSlider.tsx` (0-100% range input)
- [ ] T027 [P] [US4] Create prevalence filter hook `usePrevalenceFilter.ts` filtering entities by threshold
- [ ] T028 [US4] Wire slider to graph: filter visible entities in real-time based on prevalence %
- [ ] T029 [US4] Add classification labels: "Regional (>70%)", "Local (20-70%)", "Hyperlocal (<20%)" with counts
- [ ] T030 [US4] Add quick filters: buttons "Regional only", "Local only", "Hyperlocal only"
- [ ] T031 [US4] Implement commune-specific filter: "Show [Commune]-specific" highlighting unique entities

**Checkpoint**: US4 complete - users can identify regional vs local patterns

## Phase 7: Polish

- [ ] T032 [P] Mobile responsive: Heatmap pinch-zoom support on mobile
- [ ] T033 [P] Performance: Ensure heatmap renders <500ms for 50 entities × 10 communes
- [ ] T034 [P] Session storage: Persist selected communes across page refresh
- [ ] T035 Edge case: Handle all 50 communes selection with progress bar and batched loading
- [ ] T036 Edge case: Handle zero overlapping entities with message "No shared concerns found"

---

## Dependencies

```
Setup → Foundational → US1 (MVP) → [US2 || US3 || US4 in parallel] → Polish
```

## Task Summary

**Total**: 36 tasks | **MVP**: T001-T012 (12 tasks) | **Parallel**: 19 tasks (53%)

**Independent Tests**:
- ✅ US1: Select 2 communes → verify chips, query aggregation
- ✅ US2: Verify heatmap grid with color intensity
- ✅ US3: Verify statistics panel with top 10, CSV export
- ✅ US4: Toggle prevalence slider → verify filtering
