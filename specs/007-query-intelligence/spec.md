# Feature Specification: Query Intelligence & Input Validation

**Feature Branch**: `007-query-intelligence`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "Add intelligent query validation, French language detection, query suggestions, and smart error messages to improve civic query success rate and user experience"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Query Input (Priority: P1)

A researcher wants to query civic concerns about taxes but enters an empty query or very short text like "tax". The system validates the input and provides immediate feedback before sending to the GraphRAG backend.

**Why this priority**: Prevents wasted API calls and user frustration from cryptic backend errors. Addresses 100% of query workflows.

**Independent Test**: Can be fully tested by entering various invalid inputs (empty, too short, too long, non-French) and verifying appropriate error messages appear immediately without backend calls.

**Acceptance Scenarios**:

1. **Given** user is on the query interface, **When** user submits empty query, **Then** system shows "Veuillez entrer une question (minimum 10 caractères)" and does not call backend
2. **Given** user types "tax", **When** user submits 3-character query, **Then** system shows "Question trop courte (minimum 10 caractères)" with character counter
3. **Given** user types 600-character query, **When** user tries to submit, **Then** system shows "Question trop longue (maximum 500 caractères)" and truncates input
4. **Given** user types English query "What about taxes?", **When** user submits, **Then** system detects non-French language and shows suggestion "Cette interface utilise des données en français. Essayez : 'Quelles sont les préoccupations sur les impôts ?'"

---

### User Story 2 - Query Suggestions & Templates (Priority: P1)

A journalist new to the interface wants to explore civic data but doesn't know what questions to ask. The system provides query templates and autocomplete suggestions for common civic themes.

**Why this priority**: Reduces learning curve, increases query success rate, helps users discover dataset capabilities.

**Independent Test**: Can be tested by clicking suggestion chips or using autocomplete and verifying appropriate template queries are inserted and execute successfully.

**Acceptance Scenarios**:

1. **Given** user focuses on query input field, **When** field is empty, **Then** system displays 5 suggested templates: "Préoccupations sur les impôts", "Services publics", "Santé", "Transports", "Environnement"
2. **Given** user clicks "Préoccupations sur les impôts" template, **When** template is selected, **Then** query field populates with "Quelles sont les préoccupations des citoyens sur les impôts ?" and executes
3. **Given** user types "sant", **When** autocomplete triggers, **Then** system shows "Quelles sont les préoccupations sur la santé ?" as suggestion
4. **Given** user has selected commune "Rochefort", **When** user views suggestions, **Then** templates include commune-specific examples like "Que disent les citoyens de Rochefort sur..."

---

### User Story 3 - Smart Error Messages with Recovery (Priority: P1)

A citizen submits a query that fails due to network timeout or backend error. Instead of seeing "Law GraphRAG query failed", the system provides actionable error messages with recovery steps.

**Why this priority**: Critical for user trust and perceived reliability. Current generic errors frustrate users and provide no guidance.

**Independent Test**: Can be tested by simulating network errors, backend errors, and empty results, verifying each error type shows specific recovery guidance.

**Acceptance Scenarios**:

1. **Given** MCP backend is unreachable, **When** query times out after 30 seconds, **Then** system shows "Connexion au serveur perdue. Vérifiez votre connexion Internet et réessayez." with "Réessayer" button
2. **Given** query returns 0 results, **When** backend responds with empty data, **Then** system shows "Aucun résultat trouvé. Suggestions : Essayez une question plus générale, sélectionnez plusieurs communes, ou explorez les thèmes suggérés."
3. **Given** backend returns 401 auth error, **When** authentication fails, **Then** system shows "Session expirée. La page va se recharger..." and auto-refreshes after 3 seconds
4. **Given** backend returns query syntax error, **When** malformed query is sent, **Then** system shows "Question mal formulée. Essayez : [suggests similar valid query]"

---

### User Story 4 - Query Success Metrics Tracking (Priority: P2)

An administrator wants to understand which queries succeed, which fail, and why users struggle. The system tracks query success metrics for observability and continuous improvement.

**Why this priority**: Enables data-driven improvements to query intelligence; secondary to user-facing features but important for product evolution.

**Independent Test**: Can be tested by submitting queries and verifying metrics are logged to console/telemetry (query text, success/failure, error type, response time).

**Acceptance Scenarios**:

1. **Given** user submits valid query, **When** query succeeds, **Then** system logs {timestamp, queryText, success: true, responseTime: 8500ms, entityCount: 45}
2. **Given** user submits query that fails validation, **When** validation blocks query, **Then** system logs {timestamp, queryText, success: false, errorType: "validation", errorReason: "too_short"}
3. **Given** query fails with network error, **When** retry fails after 3 attempts, **Then** system logs {timestamp, queryText, success: false, errorType: "network", retryCount: 3}
4. **Given** admin views metrics dashboard, **When** accessing /admin/query-metrics, **Then** system displays success rate, top failure reasons, and average query length

---

### Edge Cases

- What happens when user pastes extremely long text (5000 characters) into query field?
  - System truncates to 500 chars and shows warning

- How does system handle special characters or SQL injection attempts?
  - Input sanitization removes dangerous characters; shows warning if query was modified

- What if French language detection has false positives (e.g., proper nouns in English)?
  - Language detection uses 80% threshold; requires majority French words before flagging

- How does system handle accented characters (é, è, à, ç)?
  - Full Unicode support; accents normalized for search but preserved in display

- What if user query contains profanity or offensive language?
  - No content filtering - civic data may include strong language; preserve authenticity

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST validate query length between 10-500 characters before submission
- **FR-002**: System MUST detect query language and show French language suggestion if non-French query detected (>20% non-French words)
- **FR-003**: System MUST provide at least 5 query template suggestions relevant to Grand Débat National civic themes (taxes, public services, health, transport, environment)
- **FR-004**: System MUST display autocomplete suggestions as user types (trigger after 3 characters)
- **FR-005**: System MUST classify errors into categories: validation, network, authentication, backend, empty_results
- **FR-006**: System MUST provide actionable recovery steps for each error category
- **FR-007**: System MUST display character counter showing remaining characters (500 max)
- **FR-008**: System MUST sanitize input to prevent XSS attacks while preserving accented French characters
- **FR-009**: System MUST log query success metrics including: timestamp, query text, success boolean, error type (if failed), response time, entity count (if successful)
- **FR-010**: System MUST show retry button with exponential backoff countdown for network errors
- **FR-011**: Query templates MUST adapt to selected commune context (e.g., "Que disent les citoyens de [commune] sur...")
- **FR-012**: System MUST preserve query text in browser session storage to prevent data loss on accidental refresh

### Key Entities

- **QueryValidationResult**: Validation outcome including: isValid (boolean), errors (array of error messages), warnings (array of warnings), sanitizedQuery (cleaned text)

- **QueryTemplate**: Pre-defined query structure including: id, category (taxes, health, services, etc.), templateText (French query text), variableSlots (e.g., {commune} placeholder)

- **QueryMetric**: Telemetry data including: timestamp, queryText, success (boolean), errorType (string enum), errorReason (string), responseTimeMs (number), entityCount (number), communeIds (array)

- **ErrorClassification**: Error categorization including: category (validation, network, auth, backend, empty), message (user-facing French text), recoverySuggestions (array of actionable steps), retryable (boolean)

### Responsive Design

**Breakpoints**:
- Mobile (< 768px): Query input expands to full width; suggestion chips stack vertically; character counter moves below input field; autocomplete dropdown fits within viewport
- Tablet (768-1024px): Query input takes 70% width; suggestion chips wrap in 2 rows; autocomplete shows max 5 suggestions
- Desktop (> 1024px): Default desktop layout with query input 60% width; suggestion chips in single row; autocomplete shows max 8 suggestions

**Touch Interactions**:
- Tap on suggestion chip inserts template into query field
- Tap on autocomplete suggestion selects and executes query
- Long-press on suggestion chip shows preview tooltip with full query text
- Touch targets for suggestion chips MUST be at least 44x44 pixels with 8px spacing

**Mobile-Specific Considerations**:
- [x] Input field adapts to on-screen keyboard (viewport resizes, input remains visible)
- [x] Suggestion chips scrollable horizontally with swipe gesture on mobile
- [x] Error messages use bottom sheet modal on mobile (dismissible with swipe down)
- [x] Font sizes: query input 16px (prevents iOS zoom), suggestions 14px
- [x] Performance target: Validation runs client-side, <100ms response for instant feedback

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Query validation errors reduce by 60% (from baseline of ~40% validation failures to <16%)
- **SC-002**: Users submit valid query on first attempt 85% of the time (up from ~60% baseline)
- **SC-003**: Query success rate (non-empty results) increases to 75% (from ~55% baseline)
- **SC-004**: Average time to first successful query reduces to under 45 seconds (from ~90 seconds baseline)
- **SC-005**: 70% of users use at least one query template or autocomplete suggestion in their first session
- **SC-006**: Network error recovery rate improves to 80% (users retry and succeed after seeing smart error message)
- **SC-007**: Support tickets related to "query not working" reduce by 50%

### Assumptions

- French language detection uses lightweight dictionary-based approach (not ML model)
- Query templates curated from actual Grand Débat National themes (analyzed from existing commune data)
- Autocomplete suggestions generated from historical successful queries (privacy-preserving, anonymized)
- Error classification covers 90% of error cases; remaining 10% show generic fallback message
- Query metrics stored client-side only (console logs + optional telemetry export); no PII collected
