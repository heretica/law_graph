# Tasks: Error Recovery & Graceful Degradation

**Input**: Design documents from `/specs/011-error-recovery/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: No dedicated test phase - error scenarios testable via network simulation and E2E tests per spec
**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4)
- File paths relative to `3_borges-interface/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and TypeScript foundations

- [ ] T001 Create type definitions file `src/types/error-recovery.ts` with RetryState, PartialResult, SessionState, FallbackStrategy interfaces
- [ ] T002 [P] Create retry configuration file `src/lib/config/retry-config.ts` with MAX_RETRIES = 3, RETRY_DELAYS = [1000, 2000, 4000]

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core retry and fallback infrastructure that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Implement exponential backoff utility `exponential-backoff.ts` in `src/lib/utils/` calculating delay from attemptNumber (1000ms, 2000ms, 4000ms)
- [ ] T004 [P] Implement retry strategy hook `useRetryStrategy.ts` in `src/hooks/` exposing { retry, retryState, cancelRetry, manualRetry }
- [ ] T005 [P] Implement fallback strategy hook `useFallbackStrategy.ts` in `src/hooks/` with hierarchy: MCP → cache → GraphML

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Visible Retry with Countdown (Priority: P1) 🎯 MVP

**Goal**: Display retry UI with countdown timer, auto-retry with exponential backoff, manual retry button

**Independent Test**: Simulate network error → Verify retry UI appears → Verify automatic retry with countdown → Verify manual retry button works

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create retry UI component `RetryUI.tsx` in `src/components/` (toast notification desktop, bottom sheet mobile)
- [ ] T007 [P] [US1] Create countdown timer component `CountdownTimer.tsx` in `src/components/` showing seconds remaining with progress ring
- [ ] T008 [P] [US1] Create session restoration toast component `SessionRestorationToast.tsx` in `src/components/` ("Session expirée. Reconnexion...")
- [ ] T009 [US1] Implement retry countdown logic in useRetryStrategy: use setInterval with 1s ticks, auto-retry when countdown reaches 0
- [ ] T010 [US1] Implement manual retry handler in RetryUI: onClick cancel countdown and immediately call retry()
- [ ] T011 [US1] Wire RetryUI to useRetryStrategy: display attempt number "Tentative 2/3", show countdown from retryState.nextRetryDelay
- [ ] T012 [US1] Integrate RetryUI with BorgesLibrary.tsx: show on network error detection, hide on success/cancel
- [ ] T013 [US1] Implement error type detection: classify errors as 'network' | 'timeout' | 'server' based on error code/message

**Checkpoint**: User Story 1 complete - users see retry UI with countdown and can manually retry

---

## Phase 4: User Story 2 - Partial Results Display (Priority: P1)

**Goal**: Display partial results when some communes succeed, show warning with failed commune list, support retry of failed only

**Independent Test**: Simulate partial failure (8/10 communes succeed) → Verify partial results display → Verify warning shows which communes failed

### Implementation for User Story 2

- [ ] T014 [P] [US2] Create partial results warning component `PartialResultsWarning.tsx` in `src/components/` showing banner "Données partielles : X communes indisponibles"
- [ ] T015 [P] [US2] Create partial result merger utility `partial-result-merger.ts` in `src/lib/utils/` combining successful commune responses
- [ ] T016 [P] [US2] Create partial results hook `usePartialResults.ts` in `src/hooks/` exposing { mergePartialResults, failedCommunes, retryFailedOnly }
- [ ] T017 [US2] Implement partial result merging: client-side aggregation preserving per-commune attribution (similar to multi-commune query)
- [ ] T018 [US2] Implement failed commune tracking: maintain Map<communeId, errorReason> for all failed requests
- [ ] T019 [US2] Wire PartialResultsWarning to usePartialResults: display failed commune list with error reasons
- [ ] T020 [US2] Implement retry failed communes only: retryFailedOnly() calls MCP for failed commune IDs, merges new results with existing
- [ ] T021 [US2] Add click handler to warning banner: expand to show detailed failure reasons and "Réessayer les communes échouées" button

**Checkpoint**: User Story 2 complete - partial results displayed with retry capability

---

## Phase 5: User Story 3 - Fallback to Cached Data (Priority: P2)

**Goal**: Fall back to query cache when network unavailable, ultimate fallback to GraphML visualization, show offline mode indicator

**Independent Test**: Disconnect network → Submit query → Verify fallback to GraphML/cache → Verify indicator shows "Mode hors ligne"

### Implementation for User Story 3

- [ ] T022 [P] [US3] Create offline mode banner component `OfflineModeBanner.tsx` in `src/components/` showing "Mode hors ligne" with connection status
- [ ] T023 [P] [US3] Implement cache lookup in useFallbackStrategy: check query cache (O(1) lookup) for similar query before GraphML fallback
- [ ] T024 [US3] Implement GraphML fallback detection: verify GraphML cache available in browser cache, fall back if query cache empty
- [ ] T025 [US3] Wire fallback hierarchy in BorgesLibrary.tsx: try MCP → on network error try cache → on cache miss try GraphML
- [ ] T026 [US3] Add offline indicator to UI: show OfflineModeBanner when fallback active with source label "Résultats en cache" or "Graphe complet"
- [ ] T027 [US3] Implement network restoration detection: listen to window 'online' event, show "Connexion rétablie" with refresh option
- [ ] T028 [US3] Add cache expiry handling: check 5min TTL from Constitution, expired cache triggers GraphML fallback with warning

**Checkpoint**: User Story 3 complete - graceful degradation to cached/GraphML data

---

## Phase 6: User Story 4 - Session Recovery on Reconnect (Priority: P2)

**Goal**: Save session state (query, communes, graph position) to session storage, restore on reconnect after expiry/disconnect

**Independent Test**: Trigger session expiry → Reconnect → Verify query history, selected entities, graph camera position restored

### Implementation for User Story 4

- [ ] T029 [P] [US4] Create session restore hook `useSessionRestore.ts` in `src/hooks/` exposing { saveSessionState, restoreSessionState, clearSession }
- [ ] T030 [P] [US4] Create session state serializer utility `session-state-serializer.ts` in `src/lib/utils/` with JSON serialization/deserialization
- [ ] T031 [US4] Implement session state save: serialize { lastQuery, selectedCommunes, graphCameraPosition, openPanels, timestamp } to sessionStorage
- [ ] T032 [US4] Implement session state restore: deserialize from sessionStorage on app init, validate timestamp (<24h old)
- [ ] T033 [US4] Wire session save in BorgesLibrary.tsx: call saveSessionState after query submission, on commune selection change, on graph camera move
- [ ] T034 [US4] Wire session restore in BorgesLibrary.tsx: call restoreSessionState on mount, apply restored state to UI components
- [ ] T035 [US4] Add session expiry detection: check timestamp, show SessionRestorationToast if >5min idle when user returns
- [ ] T036 [US4] Implement reconnection failure handling: show "Impossible de restaurer la session" with page refresh button after retry exhausted

**Checkpoint**: User Story 4 complete - session state preserved across disconnects

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Mobile responsiveness, performance optimization, edge case handling

- [ ] T037 [P] Add mobile-responsive styles to RetryUI: bottom sheet on mobile (<768px), toast notification on desktop
- [ ] T038 [P] Add mobile-responsive styles to PartialResultsWarning: sticky banner at top, swipe-to-dismiss gesture on mobile
- [ ] T039 [P] Add mobile-responsive styles to OfflineModeBanner: floating chip bottom-left (non-intrusive), expandable on tap
- [ ] T040 Implement retry cancellation: allow user to dismiss retry UI, stop countdown, and see raw error message
- [ ] T041 Add retry race condition handling: ignore duplicate retry requests if first retry already completing
- [ ] T042 Implement permanent error detection: after 3 failed retries, classify as permanent and show troubleshooting steps (check connection, try different commune, contact support)
- [ ] T043 Add GraphML cache corruption detection: validate GraphML structure on load, clear cache and reload if corrupted
- [ ] T044 Performance check: Verify retry UI render <100ms, fallback activation <500ms, session restore <1s
- [ ] T045 Edge case: Handle session storage quota exceeded → clear oldest session state, log warning
- [ ] T046 Edge case: Handle clock skew (negative timestamps) → use server time if available, fallback to Date.now()
- [ ] T047 Add visual feedback for retry progress: loading spinner during auto-retry, success checkmark on completion

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
- T004, T005 can run in parallel (different hooks)

**Within US1 (Phase 3)**:
- T006, T007, T008 can run in parallel (different components)

**Within US2 (Phase 4)**:
- T014, T015, T016 can run in parallel (component + utilities + hook)

**Within US3 (Phase 5)**:
- T022, T023 can run in parallel (component + cache logic)

**Within US4 (Phase 6)**:
- T029, T030 can run in parallel (hook + serializer)

**Within Polish (Phase 7)**:
- T037, T038, T039 can run in parallel (different responsive styles)

### MVP Strategy

**Recommended MVP**: User Story 1 only (Phase 1 + 2 + 3)
- **Tasks**: T001-T013 (13 tasks)
- **Deliverable**: Visible retry UI with exponential backoff
- **Value**: Critical for user trust during transient errors
- **Testable**: Independently verifiable via network simulation

**Full P1 Delivery**: User Stories 1-2 (Phases 1-4)
- **Tasks**: T001-T021 (21 tasks)
- **Deliverable**: Retry UI + partial results display
- **Value**: Maximizes value from partial success

**Complete Feature**: All user stories (Phases 1-7)
- **Tasks**: T001-T047 (47 tasks)
- **Deliverable**: Production-ready with fallback strategies, session restoration, mobile polish

---

## Task Summary

**Total Tasks**: 47
- **Setup**: 2 tasks
- **Foundational**: 3 tasks
- **User Story 1 (P1)**: 8 tasks 🎯 MVP
- **User Story 2 (P1)**: 8 tasks
- **User Story 3 (P2)**: 7 tasks
- **User Story 4 (P2)**: 8 tasks
- **Polish**: 11 tasks

**Parallel Opportunities**: 20 tasks marked [P] (43% parallelizable)

**Independent Test Criteria**:
- ✅ US1: Simulate network error → Verify retry UI with countdown → Manual retry works
- ✅ US2: Simulate partial failure → Verify partial results → Retry failed communes only
- ✅ US3: Disconnect network → Verify fallback to cache/GraphML → Offline indicator shows
- ✅ US4: Trigger session expiry → Reconnect → Verify state restored

**All tasks follow checklist format with Task IDs, Story labels, and exact file paths** ✅
