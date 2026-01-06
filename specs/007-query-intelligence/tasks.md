# Tasks: Query Intelligence & Input Validation

**Input**: Design documents from `/specs/007-query-intelligence/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: No dedicated test phase - validation testable via browser console and E2E scenarios per spec
**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4)
- File paths relative to `3_borges-interface/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and TypeScript foundations

- [ ] T001 Create type definitions file `src/types/query-intelligence.ts` with QueryValidationResult, QueryTemplate, QueryMetric, ErrorClassification interfaces
- [ ] T002 [P] Create French civic vocabulary file `src/lib/config/french-civic-dictionary.ts` with 200-word list (impôts, santé, services, etc.)
- [ ] T003 [P] Create query templates config `src/lib/config/query-templates.json` with 5 civic themes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation utilities that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement core validation function `validateQueryLength()` in `src/lib/utils/query-validator.ts` (10-500 chars, trim whitespace)
- [ ] T005 [P] Implement XSS sanitization `sanitizeQuery()` in `src/lib/utils/query-sanitizer.ts` (remove <>"'script but preserve é è à ç)
- [ ] T006 [P] Implement French detection `calculateFrenchScore()` in `src/lib/utils/french-detector.ts` (word frequency against dictionary, return 0.0-1.0 score)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Validate Query Input (Priority: P1) 🎯 MVP

**Goal**: Provide immediate client-side validation feedback (empty, too short/long, non-French) before backend call

**Independent Test**: Enter invalid inputs (empty, "tax", 600 chars, "What about taxes?") → verify error messages appear immediately without backend calls

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create validation hook `useQueryValidation.ts` in `src/hooks/` exposing { validate, validationResult, characterCount }
- [ ] T008 [P] [US1] Create validation message component `QueryValidationMessage.tsx` in `src/components/` displaying errors array with French text
- [ ] T009 [P] [US1] Create character counter component `QueryCharacterCounter.tsx` showing "X/500 caractères" with color coding (green <400, orange 400-490, red >490)
- [ ] T010 [US1] Modify `QueryInput.tsx` to integrate useQueryValidation hook, display QueryValidationMessage, show QueryCharacterCounter below input
- [ ] T011 [US1] Add validation check to query submission: prevent backend call if `validationResult.isValid === false`
- [ ] T012 [US1] Add French language warning when score <0.8: show "Cette interface utilise des données en français" with French query suggestion

**Checkpoint**: User Story 1 complete - validation prevents invalid queries, users see immediate feedback

---

## Phase 4: User Story 2 - Query Suggestions & Templates (Priority: P1)

**Goal**: Provide 5 template suggestions and autocomplete to help users discover civic themes

**Independent Test**: Click template chip "Préoccupations sur les impôts" → verify query field populates with full French question and executes

### Implementation for User Story 2

- [ ] T013 [P] [US2] Create templates hook `useQueryTemplates.ts` in `src/hooks/` exposing { templates, applyTemplate, getAutocomplete }
- [ ] T014 [P] [US2] Create suggestion chips component `QuerySuggestionChips.tsx` in `src/components/` displaying 5 civic theme buttons (impôts, services publics, santé, transports, environnement)
- [ ] T015 [P] [US2] Create autocomplete component `QueryAutocomplete.tsx` showing dropdown with matching templates (trigger after 3 characters)
- [ ] T016 [US2] Implement template interpolation: replace {commune} placeholder with selected commune name when commune context available
- [ ] T017 [US2] Modify `QueryInput.tsx` to integrate QuerySuggestionChips above input and QueryAutocomplete dropdown below input
- [ ] T018 [US2] Wire template click handler: populate query field with templateText and auto-submit query
- [ ] T019 [US2] Wire autocomplete selection: populate query field on Enter/click and auto-submit

**Checkpoint**: User Story 2 complete - users can discover queries via templates and autocomplete

---

## Phase 5: User Story 3 - Smart Error Messages with Recovery (Priority: P1)

**Goal**: Classify errors into 5 categories (validation, network, auth, backend, empty_results) and show actionable recovery steps

**Independent Test**: Simulate network timeout → verify shows "Connexion au serveur perdue" with "Réessayer" button

### Implementation for User Story 3

- [ ] T020 [P] [US3] Create error messages config `src/lib/config/error-messages-fr.json` with French messages and recovery suggestions for each error category
- [ ] T021 [P] [US3] Create error classification hook `useErrorClassification.ts` in `src/hooks/` with classifyError(error) → ErrorClassification
- [ ] T022 [P] [US3] Implement error pattern matching in `useErrorClassification`: detect network (timeout, ECONNREFUSED), auth (401, 403), backend (500, 503), validation (400, invalid), empty (result.length === 0)
- [ ] T023 [US3] Modify `ErrorMessage.tsx` component to display classified error with category-specific icon, French message, and recovery suggestions list
- [ ] T024 [US3] Add "Réessayer" button to ErrorMessage for retryable errors (network, backend)
- [ ] T025 [US3] Implement auto-refresh for auth errors: show countdown "La page va se recharger dans 3s..." and call window.location.reload() after 3000ms
- [ ] T026 [US3] Wire error classification in query submission: catch errors, classify, and display via ErrorMessage component

**Checkpoint**: User Story 3 complete - errors show specific recovery guidance, users can retry or understand issue

---

## Phase 6: User Story 4 - Query Success Metrics Tracking (Priority: P2)

**Goal**: Log query metrics (timestamp, queryText, success, errorType, responseTime, entityCount) for observability

**Independent Test**: Submit queries → open browser console → verify metrics logged as JSON objects

### Implementation for User Story 4

- [ ] T027 [P] [US4] Create metrics hook `useQueryMetrics.ts` in `src/hooks/` exposing { logQuery, getMetrics, clearMetrics }
- [ ] T028 [P] [US4] Implement session storage persistence in useQueryMetrics: save/load metrics array with FIFO eviction at 100 entries (match Constitution cache strategy)
- [ ] T029 [P] [US4] Implement console logging in useQueryMetrics: call console.log() with formatted JSON for each metric entry
- [ ] T030 [US4] Wire metrics logging in query submission flow: logQuery({ success: true, responseTime, entityCount }) on success
- [ ] T031 [US4] Wire metrics logging in error handling flow: logQuery({ success: false, errorType, errorReason }) on failure
- [ ] T032 [US4] Wire metrics logging in validation: logQuery({ success: false, errorType: 'validation', errorReason }) when validation fails

**Checkpoint**: User Story 4 complete - all query attempts logged for observability

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Mobile responsiveness, performance optimization, edge case handling

- [ ] T033 [P] Add mobile-responsive styles to QuerySuggestionChips: horizontal scroll with swipe gesture, 44x44px touch targets
- [ ] T034 [P] Add mobile-responsive styles to ErrorMessage: bottom sheet modal on mobile (<768px) dismissible with swipe down
- [ ] T035 [P] Ensure query input font size ≥16px on mobile to prevent iOS auto-zoom
- [ ] T036 Implement query text preservation in session storage (useQueryMetrics): restore query on page refresh (FR-012)
- [ ] T037 Add defensive null handling to all hooks: use ?? fallback operators per Constitution Principle X
- [ ] T038 Performance check: Verify validation runs <100ms, autocomplete <50ms on typical device
- [ ] T039 Edge case: Handle 5000-character paste → truncate to 500 and show warning "Texte tronqué à 500 caractères"

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
US3 (Phase 5) ← Can start after US1
  ↓
US4 (Phase 6) ← Can start after US1 + US3
  ↓
Polish (Phase 7)
```

### Parallel Execution Opportunities

**Within Setup Phase (Phase 1)**:
- T002 and T003 can run in parallel (different config files)

**Within Foundational Phase (Phase 2)**:
- T005 and T006 can run in parallel (different utility files)

**Within US1 (Phase 3)**:
- T007, T008, T009 can run in parallel (different components/hooks)

**Within US2 (Phase 4)**:
- T013, T014, T015 can run in parallel (different components)

**Within US3 (Phase 5)**:
- T020, T021, T022 can run in parallel (config + hook implementation)

**Within US4 (Phase 6)**:
- T027, T028 can run in parallel (hook structure + persistence logic)

**Within Polish (Phase 7)**:
- T033, T034, T035 can run in parallel (different responsive styles)

### MVP Strategy

**Recommended MVP**: User Story 1 only (Phase 1 + 2 + 3)
- **Tasks**: T001-T012 (12 tasks)
- **Deliverable**: Basic query validation preventing invalid inputs
- **Value**: Immediate feedback, no wasted backend calls
- **Testable**: Independently verifiable via browser

**Full P1 Delivery**: User Stories 1-3 (Phases 1-5)
- **Tasks**: T001-T026 (26 tasks)
- **Deliverable**: Complete query intelligence with validation, templates, error recovery
- **Value**: Full user-facing experience improvement

**Complete Feature**: All user stories (Phases 1-7)
- **Tasks**: T001-T039 (39 tasks)
- **Deliverable**: Production-ready with metrics and polish

---

## Task Summary

**Total Tasks**: 39
- **Setup**: 3 tasks
- **Foundational**: 3 tasks
- **User Story 1 (P1)**: 6 tasks 🎯 MVP
- **User Story 2 (P1)**: 7 tasks
- **User Story 3 (P1)**: 7 tasks
- **User Story 4 (P2)**: 6 tasks
- **Polish**: 7 tasks

**Parallel Opportunities**: 21 tasks marked [P] (54% parallelizable)

**Independent Test Criteria**:
- ✅ US1: Enter invalid inputs → verify error messages without backend calls
- ✅ US2: Click template → verify query populates and executes
- ✅ US3: Simulate network error → verify recovery message with retry button
- ✅ US4: Submit queries → verify console logs show metrics

**All tasks follow checklist format with Task IDs, Story labels, and exact file paths** ✅
