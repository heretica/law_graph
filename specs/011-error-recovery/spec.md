# Feature Specification: Error Recovery & Graceful Degradation

**Feature Branch**: `011-error-recovery`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "Add graceful error recovery with visible retry UI, partial result display, fallback strategies, and session restoration for improved reliability"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visible Retry with Countdown (Priority: P1)

A user's query fails due to temporary network issue. Instead of blank screen, the system shows retry UI with countdown timer and manual retry button.

**Why this priority**: Critical for user trust during transient errors. Addresses current frustration with cryptic failures.

**Independent Test**: Simulate network error → Verify retry UI appears → Verify automatic retry with countdown → Verify manual retry button works.

**Acceptance Scenarios**:
1. **Given** query fails with network error, **When** error detected, **Then** system shows "Connexion perdue. Nouvelle tentative dans 2s..." with countdown
2. **Given** retry countdown active, **When** timer reaches 0, **Then** system auto-retries query with loading indicator
3. **Given** auto-retry fails again, **When** second attempt fails, **Then** countdown increases to 4s and shows "Tentative 2/3"
4. **Given** retry UI visible, **When** user clicks "Réessayer maintenant" button, **Then** system immediately retries without waiting for countdown

### User Story 2 - Partial Results Display (Priority: P1)

A user queries 10 communes but 2 fail to respond. Instead of showing error, the system displays results from 8 successful communes with clear indication of partial data.

**Why this priority**: Maximizes value from partial success; users get data even when some sources fail.

**Independent Test**: Simulate partial failure (8/10 communes succeed) → Verify partial results display → Verify warning shows which communes failed.

**Acceptance Scenarios**:
1. **Given** multi-commune query submitted, **When** 8/10 communes succeed and 2 fail, **Then** system displays 8 commune results with warning banner "Données partielles : 2 communes indisponibles (Rochefort, Andilly)"
2. **Given** partial results displayed, **When** user clicks warning banner, **Then** system shows: which communes failed, error reason, option to retry failed communes only
3. **Given** user retries failed communes, **When** retry succeeds, **Then** system merges new results with existing partial results seamlessly

### User Story 3 - Fallback to Cached Data (Priority: P2)

A user loses connection while browsing. Instead of complete failure, the system falls back to GraphML cache and previously cached query results.

**Why this priority**: Enables offline browsing; reduces frustration during connectivity issues.

**Independent Test**: Disconnect network → Submit query → Verify fallback to GraphML/cache → Verify indicator shows "Mode hors ligne".

**Acceptance Scenarios**:
1. **Given** network disconnected, **When** user submits new query, **Then** system checks cache, finds previous result for similar query, displays with banner "Résultats en cache (hors ligne)"
2. **Given** no cached results available, **When** query fails, **Then** system displays GraphML visualization (loaded on startup) with message "Affichage du graphe complet (hors ligne)"
3. **Given** offline mode active, **When** network restored, **Then** banner changes to "Connexion rétablie" with option to refresh results

### User Story 4 - Session Recovery on Reconnect (Priority: P2)

A user's session expires due to idle time or network drop. When reconnected, the system restores their exploration state (query, selected entities, graph position).

**Why this priority**: Prevents loss of exploration context; improves perceived reliability.

**Independent Test**: Trigger session expiry → Reconnect → Verify query history, selected entities, graph camera position restored.

**Acceptance Scenarios**:
1. **Given** session expires after 5 min idle, **When** user interacts again, **Then** system shows "Session expirée. Reconnexion..." and auto-reconnects
2. **Given** session reconnecting, **When** reconnection succeeds, **Then** system restores: last query, selected communes, graph camera position, open panels
3. **Given** reconnection fails, **When** retry exhausted, **Then** system shows "Impossible de restaurer la session. Rechargez la page." with refresh button

### Edge Cases
- What if all retries fail?
  - Show final error with troubleshooting steps: check connection, try different commune, contact support
- How long are results cached?
  - Query cache: 5 min (from Constitution), GraphML cache: browser cache (indefinite)
- What if GraphML cache corrupted?
  - Detect corruption, clear cache, reload from server with warning
- How to handle race condition (retry succeeds while user clicks manual retry)?
  - Ignore duplicate request, show success from first completion

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST display retry UI with countdown timer for network errors
- **FR-002**: System MUST support manual retry button (bypass countdown)
- **FR-003**: System MUST implement exponential backoff: 1s, 2s, 4s delays (max 3 retries)
- **FR-004**: System MUST display partial results when some communes succeed and others fail
- **FR-005**: System MUST show clear warning banner indicating which communes failed
- **FR-006**: System MUST support retry of failed communes only (not entire query)
- **FR-007**: System MUST fall back to cached query results when network unavailable
- **FR-008**: System MUST fall back to GraphML visualization when no cached results available
- **FR-009**: System MUST indicate offline mode with persistent banner
- **FR-010**: System MUST restore session state (query, communes, graph position) on reconnect
- **FR-011**: System MUST preserve session state in browser session storage
- **FR-012**: Retry UI MUST show attempt number (e.g., "Tentative 2/3")

### Key Entities
- **RetryState**: Retry attempt tracking including: attemptNumber, nextRetryDelay, maxAttempts, errorType
- **PartialResult**: Partial query result including: successfulCommunes[], failedCommunes[], errorReasons (map), canRetry (boolean)
- **SessionState**: Restorable session including: lastQuery, selectedCommunes, graphCameraPosition, openPanels, timestamp
- **FallbackStrategy**: Fallback chain including: primarySource (MCP), fallbackSource (cache), ultimateFallback (GraphML)

### Responsive Design
**Breakpoints**:
- Mobile (<768px): Retry UI as bottom sheet; warning banner full width; fallback indicator as floating chip
- Tablet (768-1024px): Retry UI as modal center screen; banner top of viewport
- Desktop (>1024px): Retry UI as toast notification (bottom-right); banner top-center

**Touch Interactions**:
- Tap "Réessayer maintenant" button to retry
- Swipe warning banner to dismiss (mobile)
- Tap offline indicator to see connection status
- Touch targets ≥44x44 pixels

**Mobile-Specific Considerations**:
- [x] Retry countdown large (32px font) for visibility
- [x] Manual retry button prominent (full width on mobile)
- [x] Warning banner sticky at top (doesn't scroll away)
- [x] Fallback indicator non-intrusive (bottom-left floating chip)

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Network error recovery rate improves to 80% (users retry and succeed)
- **SC-002**: Partial result acceptance rate >70% (users continue with partial data vs. abandoning)
- **SC-003**: Average time to first retry reduces to <5s (users engage with retry UI quickly)
- **SC-004**: Session restoration success rate >90% (state preserved across reconnects)
- **SC-005**: Offline mode usage >20% during connectivity issues (fallback strategies used)
- **SC-006**: User frustration with errors reduces by 50% (measured via reduced support tickets)

### Assumptions
- Network errors transient (99% resolve within 3 retries)
- GraphML cache always available (loaded on app startup)
- Session state <1MB (fits in session storage)
- Partial results valuable even with 50% commune success rate
