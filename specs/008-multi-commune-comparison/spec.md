# Feature Specification: Multi-Commune Comparative Analysis

**Feature Branch**: `008-multi-commune-comparison`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "Add multi-commune comparative analysis UI with multi-select commune picker, regional pattern visualization, and aggregate statistics dashboard to enable cross-commune civic insights"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Multiple Communes for Comparison (Priority: P1)

A journalist investigating regional tax concerns wants to compare 5 coastal communes vs. 5 inland communes to identify pattern differences. The system allows selecting multiple communes via chip-based multi-select UI.

**Why this priority**: Enables Constitution Principle V (Cross-Commune Analysis). Core capability unlocking entire comparative workflow.

**Independent Test**: Can be tested by selecting 2+ communes from picker and verifying selected communes appear as chips, query executes with all selected communes, and results show per-commune attribution.

**Acceptance Scenarios**:

1. **Given** user clicks commune selector, **When** dropdown opens, **Then** system shows all 50 communes with checkboxes (multi-select mode)
2. **Given** user selects "Rochefort" and "Andilly", **When** selections made, **Then** system displays 2 chips below query field with commune names and X remove buttons
3. **Given** user has selected 3 communes, **When** user submits query, **Then** system calls backend with commune_ids=[id1, id2, id3] and aggregates results
4. **Given** user clicks X on "Rochefort" chip, **When** chip removed, **Then** commune deselected and subsequent queries exclude Rochefort

---

### User Story 2 - Visualize Regional Entity Patterns (Priority: P1)

An analyst wants to see which civic concerns are universal across all selected communes vs. which are region-specific. The system visualizes entity prevalence across communes in a heatmap.

**Why this priority**: Core analytical value - reveals regional patterns that single-commune queries cannot show.

**Independent Test**: Can be tested by selecting 5 communes, submitting query, and verifying heatmap shows entities (rows) × communes (columns) with color intensity indicating mention frequency.

**Acceptance Scenarios**:

1. **Given** user has selected 5 communes and submitted query "préoccupations fiscales", **When** results load, **Then** system displays heatmap with entities as rows, communes as columns, color intensity = mention count
2. **Given** user hovers over heatmap cell, **When** mouse over, **Then** tooltip shows "IMPÔTS mentioned 12 times in Rochefort"
3. **Given** user clicks heatmap cell, **When** cell clicked, **Then** system highlights entity in 3D graph and shows related citizen quotes from that commune
4. **Given** heatmap shows "SERVICES PUBLICS" appears in 4/5 communes, **When** user views summary, **Then** system labels it "Universal concern (80% prevalence)"

---

### User Story 3 - Aggregate Statistics Dashboard (Priority: P2)

A researcher wants quantitative summary statistics showing top 10 concerns across selected communes with prevalence percentages. The system displays aggregate metrics dashboard.

**Why this priority**: Provides quantitative backing for qualitative insights; secondary to visualization but important for reports.

**Independent Test**: Can be tested by selecting communes, submitting query, and verifying statistics panel shows: total entities, top 10 by frequency, prevalence %, and commune breakdown.

**Acceptance Scenarios**:

1. **Given** user has queried 10 communes, **When** results load, **Then** statistics panel shows: "127 unique entities across 10 communes"
2. **Given** statistics panel open, **When** viewing top concerns, **Then** system lists "1. IMPÔTS (90% prevalence, 8/10 communes)", "2. SANTÉ (70%, 7/10)"
3. **Given** user clicks "IMPÔTS" in statistics, **When** clicked, **Then** system filters graph to show only IMPÔTS and related entities
4. **Given** user selects "Export statistics", **When** export clicked, **Then** system downloads CSV with columns: Entity, Type, Total Mentions, Commune Count, Prevalence %

---

### User Story 4 - Regional vs. Local Filtering (Priority: P2)

An administrator wants to identify which concerns are truly regional (appear in 70%+ of communes) vs. hyperlocal (appear in <20%). The system provides prevalence-based filtering.

**Why this priority**: Helps policy makers prioritize regional vs. local interventions; valuable for strategic planning.

**Independent Test**: Can be tested by toggling "Show only regional patterns (>70% prevalence)" filter and verifying graph displays only entities appearing in majority of selected communes.

**Acceptance Scenarios**:

1. **Given** user has selected 10 communes with results, **When** user toggles "Regional patterns only (>70%)", **Then** graph shows only entities appearing in 7+ communes
2. **Given** regional filter active, **When** user views statistics, **Then** dashboard shows "8 regional concerns, 42 local concerns, 77 hyperlocal"
3. **Given** user slides prevalence threshold to 50%, **When** slider adjusted, **Then** graph dynamically updates to show entities with 50%+ prevalence
4. **Given** user wants to see local concerns for specific commune, **When** user clicks "Show Rochefort-specific", **Then** graph highlights entities unique to Rochefort

---

### Edge Cases

- What happens when user selects all 50 communes?
  - System warns "Large query may take 90+ seconds" with progress bar, batches loading as per progressive loading feature

- How does system handle when selected communes have zero overlapping entities?
  - Heatmap shows all cells as 0/empty; message: "No shared concerns found. Try broader query or different communes"

- What if one commune query fails but others succeed?
  - System shows partial results with warning "Data unavailable for [commune name]. Showing 4/5 communes."

- How are entity names normalized across communes (e.g., "IMPÔTS" vs. "TAXES")?
  - Backend performs entity deduplication; frontend groups synonyms; user can review groupings

- What if user selects 2 communes but query returns 500+ unique entities?
  - Heatmap paginates (show top 50 by prevalence); user can scroll/filter; graph shows aggregated view

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support multi-select commune picker with checkboxes for all 50 communes
- **FR-002**: System MUST display selected communes as dismissible chips (max 50 chips, scrollable container)
- **FR-003**: System MUST aggregate query results across all selected communes with per-commune attribution
- **FR-004**: System MUST visualize entity prevalence as heatmap (entities × communes) with color intensity indicating mention frequency
- **FR-005**: System MUST calculate prevalence percentage as (communes mentioning entity) / (total selected communes) × 100
- **FR-006**: System MUST display aggregate statistics: total unique entities, top 10 by frequency, prevalence %, commune breakdown
- **FR-007**: System MUST support exporting statistics as CSV with columns: Entity, Type, Total Mentions, Commune Count, Prevalence %
- **FR-008**: System MUST allow prevalence-based filtering (slider 0-100%) to show only entities above threshold
- **FR-009**: System MUST classify entities as: Regional (>70% prevalence), Local (20-70%), Hyperlocal (<20%)
- **FR-010**: System MUST handle partial failures (some communes succeed, others fail) with clear indication
- **FR-011**: Heatmap MUST support pagination for large result sets (>50 entities)
- **FR-012**: System MUST preserve multi-commune selection in browser session storage

### Key Entities

- **CommuneSelection**: Selected communes state including: communeIds (array), communeNames (array for display), selectionTimestamp

- **EntityPrevalence**: Entity frequency across communes including: entityId, entityName, entityType, mentionsByCommune (map of communeId → count), totalMentions, communeCount, prevalencePercentage, classification (regional/local/hyperlocal)

- **ComparisonHeatmap**: Heatmap data structure including: entities (rows), communes (columns), cells (2D array of mention counts), colorScale (min/max for normalization)

- **AggregateStatistics**: Summary metrics including: totalUniqueEntities, topEntities (sorted by frequency), averageMentionsPerEntity, communeCoverage (which communes responded)

### Responsive Design

**Breakpoints**:
- Mobile (< 768px): Commune chips stack vertically; heatmap scrolls horizontally; statistics panel collapses to accordion; prevalence slider full width below chips
- Tablet (768-1024px): Commune chips wrap in 2 rows; heatmap fits viewport with horizontal scroll if needed; statistics side panel (collapsible)
- Desktop (> 1024px): Commune chips in single scrollable row; heatmap + graph split view (60/40); statistics fixed side panel

**Touch Interactions**:
- Tap on commune chip X button to remove selection
- Swipe left/right on heatmap to scroll communes (mobile)
- Tap heatmap cell to highlight entity in graph
- Long-press chip to show commune details tooltip
- Touch targets for chips and heatmap cells MUST be at least 44x44 pixels

**Mobile-Specific Considerations**:
- [x] Commune picker adapts to bottom sheet modal on mobile (full screen overlay)
- [x] Heatmap uses horizontal scroll with sticky entity labels (left column)
- [x] Statistics panel slides up from bottom as sheet (swipe down to dismiss)
- [x] Prevalence slider has large touch targets (min 44px height)
- [x] Performance: Limit heatmap to top 30 entities on mobile (reduce rendering load)

**Graph Visualization**:
- Touch gestures: Same as main graph (tap, pinch, drag, double-tap)
- Multi-commune mode: Color entities by "most mentioned commune" or "prevalence heat"
- Graceful degradation: On low-end devices, disable heatmap animations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 60% of users select 2+ communes for comparison in their first session (validates feature discovery)
- **SC-002**: Average queries per session increases by 40% when multi-commune comparison is available (increased exploration)
- **SC-003**: Users identify regional patterns (>70% prevalence entities) 80% of the time when querying 5+ communes
- **SC-004**: Heatmap interaction rate >50% (users click at least one heatmap cell per comparison session)
- **SC-005**: CSV export used by 30% of users doing multi-commune analysis (validates reporting use case)
- **SC-006**: Average comparison includes 5-8 communes (validates UI supports comfortable multi-select without overwhelming)
- **SC-007**: Multi-commune query completion rate >75% (users don't abandon due to long wait times)

### Assumptions

- Entity deduplication and synonym grouping handled by backend MCP server (not frontend responsibility)
- Prevalence calculation uses simple frequency count (not weighted by population or contribution volume)
- Heatmap color scale normalized per query (not absolute across all possible queries)
- CSV export includes raw data only (no styling or charts)
- Partial failures show best-effort results (don't block entire comparison)
