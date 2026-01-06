# Feature Specification: Interactive Provenance Chain Navigation

**Feature Branch**: `009-interactive-provenance`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "Add interactive provenance chain navigation enabling bidirectional tracing from RAG answers to source citizen quotes through graph entities and relationships"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Answer to Source Text (Priority: P1)

A journalist wants to verify that a RAG answer claiming "Citizens prioritize healthcare access" is grounded in actual citizen contributions. They click the answer to see which entities were used, then click an entity to see source quotes.

**Why this priority**: Implements Constitution Principle II (Civic Provenance Chain). Core transparency feature.

**Independent Test**: Click RAG answer → View entity list → Click entity → See citizen quotes with commune attribution.

**Acceptance Scenarios**:
1. **Given** RAG answer displayed, **When** user clicks answer text, **Then** provenance panel opens showing: 5 entities used, 12 relationships traversed, 8 source chunks
2. **Given** provenance panel open, **When** user clicks "SANTÉ" entity, **Then** system highlights entity in 3D graph AND shows 3 citizen quotes mentioning "SANTÉ"
3. **Given** citizen quote visible, **When** user clicks commune name "Rochefort", **Then** system shows all quotes from Rochefort and highlights Rochefort node in graph

### User Story 2 - Breadcrumb Trail Navigation (Priority: P1)

A researcher wants to understand the complete reasoning path from their query to the answer. The system displays an interactive breadcrumb trail.

**Why this priority**: Enables end-to-end interpretability as specified in Constitution Principle I.

**Independent Test**: Submit query → Click breadcrumb elements → Verify each step navigates to corresponding view (query → entities → relationships → chunks).

**Acceptance Scenarios**:
1. **Given** RAG answer displayed, **When** provenance opens, **Then** breadcrumb shows: "Query: 'impôts' → 5 Entities → 12 Relationships → 8 Source Chunks"
2. **Given** user clicks "5 Entities" in breadcrumb, **When** clicked, **Then** system displays entity list with type distribution (3 CONCEPT, 1 PERSON, 1 ORGANIZATION)
3. **Given** user clicks "12 Relationships" in breadcrumb, **When** clicked, **Then** system highlights relationship paths in 3D graph with animated traversal

### User Story 3 - Reverse Navigation: Graph to Provenance (Priority: P1)

A citizen exploring the 3D graph clicks an entity and wants to see which RAG answers used it. The system shows reverse provenance (entity → which answers referenced it).

**Why this priority**: Bidirectional navigation completes the interpretability loop.

**Independent Test**: Click entity in graph → View "Used in answers" panel → Click answer to see full provenance.

**Acceptance Scenarios**:
1. **Given** user clicks "IMPÔTS" node in graph, **When** entity selected, **Then** panel shows "Used in 3 answers" with answer snippets and timestamps
2. **Given** "Used in answers" list displayed, **When** user clicks answer snippet, **Then** system scrolls to full answer and opens provenance panel
3. **Given** entity has no answer usage, **When** clicked, **Then** panel shows "Standalone entity (not used in current answers)"

### User Story 4 - Export Provenance Audit Trail (Priority: P2)

An administrator needs to document how a specific RAG answer was derived for audit/compliance. The system exports the complete provenance chain as JSON.

**Why this priority**: Supports accountability and verification; secondary to interactive features.

**Independent Test**: Open provenance → Click "Export audit trail" → Verify JSON contains: query, entities, relationships, chunks, timestamps.

**Acceptance Scenarios**:
1. **Given** provenance panel open, **When** user clicks "Export as JSON", **Then** system downloads file with structure: {query, answerText, entities[], relationships[], sourceChunks[], timestamp}
2. **Given** exported JSON file, **When** opened, **Then** all entity IDs, relationship types, and chunk references are present
3. **Given** multiple answers on page, **When** exporting, **Then** user can select "Current answer" or "All answers on page"

### Edge Cases
- What if provenance data is incomplete (missing entities or chunks)?
  - Display warning "Partial provenance available" with available data
- How are multi-hop relationships displayed?
  - Group by hop distance: Direct (hop 1), Second-order (hop 2), Third-order (hop 3)
- What if source chunk text is very long (500+ words)?
  - Show first 200 words with "Read more" expansion
- How to handle circular relationship paths?
  - Mark as "Circular reference" and show once

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST display interactive breadcrumb trail: Query → Entities → Relationships → Source Chunks
- **FR-002**: System MUST allow clicking any breadcrumb element to navigate to corresponding view
- **FR-003**: System MUST highlight selected entity in 3D graph when clicked from provenance panel
- **FR-004**: System MUST show reverse provenance ("Used in answers") when entity clicked in graph
- **FR-005**: System MUST display source chunks with: commune name, contribution date (if available), text excerpt, entity annotations
- **FR-006**: System MUST support exporting provenance as JSON with all required fields
- **FR-007**: Breadcrumb MUST show counts (e.g., "5 Entities", "12 Relationships") as clickable links
- **FR-008**: System MUST visually encode relationship hop distance (direct, second-order, third-order) with color/opacity
- **FR-009**: System MUST preserve provenance navigation state across panel open/close
- **FR-010**: Provenance panel MUST be dismissible but restorable without re-query

### Key Entities
- **ProvenanceChain**: Complete audit trail including: queryText, answerText, usedEntities[], traversedRelationships[], sourceChunks[], timestamp
- **UsedEntity**: Entity with usage context including: entityId, entityName, entityType, relevanceScore, commune
- **TraversedRelationship**: Relationship with traversal metadata including: sourceEntity, targetEntity, relationshipType, hopDistance, weight
- **SourceChunk**: Text chunk with attribution including: chunkText, commune, contributionDate, highlightedEntities[]

### Responsive Design
**Breakpoints**:
- Mobile (< 768px): Provenance panel full-screen overlay; breadcrumb stacks vertically; source chunks use accordion
- Tablet (768-1024px): Provenance panel slide-in from right (70% width); breadcrumb wraps in 2 rows
- Desktop (> 1024px): Provenance panel docked right (40% width); breadcrumb single row

**Touch Interactions**:
- Tap breadcrumb element to navigate
- Swipe provenance panel right to close (mobile)
- Long-press entity to preview without navigating
- Touch targets MUST be at least 44x44 pixels

**Mobile-Specific Considerations**:
- [x] Provenance panel slides up from bottom as full-screen sheet
- [x] Breadcrumb uses horizontal scroll on mobile
- [x] Source chunks paginate (show 3 at a time, "Load more" button)
- [x] Export button prominent at top of panel (mobile)
- [x] Performance: Limit entity list to top 20 by relevance on mobile

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: 70% of users click provenance panel at least once per session (validates feature discoverability)
- **SC-002**: Breadcrumb navigation used by 50% of users who open provenance (validates interactive utility)
- **SC-003**: Average provenance panel open time >30 seconds (indicates meaningful engagement)
- **SC-004**: Reverse navigation (graph → provenance) used by 40% of users
- **SC-005**: JSON export used by 15% of users (validates audit use case)
- **SC-006**: Users successfully trace answer to source quote 85% of the time when attempting

### Assumptions
- Provenance data always available from backend (MCP server returns full provenance)
- Entity highlighting in 3D graph uses existing highlighting infrastructure
- JSON export includes raw IDs (not human-friendly labels) for technical accuracy
- Breadcrumb counts accurate (backend provides entity/relationship counts)
