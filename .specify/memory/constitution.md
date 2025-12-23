<!--
SYNC IMPACT REPORT
==================
Version Change: 2.0.0 → 3.0.0 (MAJOR - Single-purpose Grand Débat National interface)

Modified Principles:
- Title: Law GraphRAG Constitution → Grand Débat National GraphRAG Constitution
- Principle IV: Legal Document-Centric → Commune-Centric Architecture (refocused on civic data)
- Principle V: Cross-Document Legal Analysis → Cross-Commune Civic Analysis
- Principle VI: Extensible Legal Corpus → Single-Source Civic Data Foundation (scope narrowed)
- Principle VII: Functional Legal Interface → Functional Civic Interface

Scope Changes:
- REMOVED: Dual-source toggle (Borges/Law GraphRAG) - now single-purpose
- REMOVED: Generic "legal document" references - now specifically Grand Débat National data
- ADDED: Explicit MCP server specification (graphragmcp-production.up.railway.app)
- ADDED: Commune-based data model (50 communes, Cahiers de Doléances)

Domain Pivot:
- FROM: Generic legal knowledge graph interface with source selection
- TO: Single-purpose Grand Débat National citizen contribution explorer

Data Source:
- Single MCP Server: https://graphragmcp-production.up.railway.app
- Dataset: Grand Débat National 2019 "Cahiers de Doléances"
- Coverage: 50 communes in Charente-Maritime
- Entities: ~8,000+ extracted from citizen contributions

Templates Requiring Updates:
- specs/003-rag-observability-comparison/spec.md: ⚠ needs update to reflect single-purpose
- specs/003-rag-observability-comparison/plan.md: ⚠ needs update to remove source toggle
- specs/003-rag-observability-comparison/tasks.md: ⚠ needs update to remove RAGSourceSelector
- CLAUDE.md: ⚠ needs update to remove Borges references

Change Rationale:
- MAJOR version (3.0.0) because:
  1. Fundamental scope change from multi-source to single-source
  2. Domain pivot from generic legal to specific civic dataset
  3. Removal of source selection functionality
  4. Architecture simplification to single MCP server
-->

# Grand Débat National GraphRAG Constitution

**Single-Purpose Civic Knowledge Graph Interface**

This interface is exclusively designed for exploring citizen contributions from the
French Grand Débat National 2019 "Cahiers de Doléances" dataset. It connects to a
single GraphRAG backend and does NOT support multiple data sources.

**Data Source**: `https://graphragmcp-production.up.railway.app`
**Dataset**: 50 communes in Charente-Maritime, ~8,000+ entities

## Core Principles

### I. End-to-End Interpretability

**The system MUST enable navigation from text chunks to RAG answers through the civic knowledge graph.**

Users MUST be able to trace the complete reasoning path of the GraphRAG system:
- From original text chunks in citizen contributions (Cahiers de Doléances)
- Through extracted entities (themes, actors, concepts, proposals)
- Across graph traversal paths and community structures
- To final RAG-generated answers with source attribution

Every step of the knowledge extraction, storage, retrieval, and generation pipeline
MUST be inspectable and navigable.

**Rationale**: Citizens and researchers need to understand how answers were derived from
actual citizen contributions. Transparency in civic RAG systems builds trust and enables
validation of insights against source material.

**Implementation Requirements**:
- Text chunk storage MUST preserve source attribution (commune, contribution order)
- Entity extraction MUST maintain bidirectional links to source chunks
- Graph queries MUST return traversal paths, not just final results
- RAG responses MUST include provenance chains (answer → nodes → relationships → chunks)
- UI MUST provide click-through navigation across the entire pipeline
- Source quotes MUST link directly to original citizen text passages

---

### II. Civic Provenance Chain

**The system MUST maintain traceable attribution to citizen contributions.**

Every piece of information surfaced by the system MUST be traceable to its
source commune and original citizen text:

- **Source commune**: Which municipality contributed this insight
- **Original text**: Exact quotes from citizen contributions
- **Entity attribution**: How concepts were extracted from text
- **Community context**: Thematic clusters and their member entities

**Rationale**: Civic data demands transparency about origins. Users must be able to
verify that insights genuinely reflect citizen voices, not system artifacts.

**Implementation Requirements**:
- Every entity MUST store its source commune and chunk reference
- API responses MUST include source_quotes with commune attribution
- The UI MUST display commune origin for all entities and answers
- Query results MUST show which communes contributed to the answer

---

### III. No Orphan Nodes

**All nodes displayed in the interface MUST have at least one relationship.**

Orphan nodes (isolated entities without connections) are prohibited in the visualization
layer. This principle ensures that:
- Every entity shown provides relational context
- Graph visualizations maintain semantic coherence
- Users always see how civic entities connect to the broader knowledge graph
- Query results filter out disconnected nodes before rendering

**Rationale**: The GraphRAG system is fundamentally about exploring relationships and
connections between civic themes. Orphan nodes provide no navigational value and
clutter the interface with isolated facts that cannot be explored.

**Implementation Requirements**:
- API endpoints MUST filter query results to exclude nodes with zero relationships
- Graph visualizations MUST validate node connectivity before rendering
- Backend queries MUST include relationship count validation
- Frontend components MUST display relationship counts for transparency

---

### IV. Commune-Centric Architecture

**Communes MUST be the primary organizational units in all graph queries and visualizations.**

The knowledge graph is organized around communes as the source containers for citizen
contributions. All queries, visualizations, and explorations contextualize data by commune:
- Search queries can filter by commune or span all communes
- Graph traversals show commune attribution for entities
- Entity relationships are contextualized through their commune origins
- Visualization can highlight which communes contributed to an answer

**Commune Data Model**:
- 50 communes in Charente-Maritime (Rochefort, Andilly, Surgères, etc.)
- Each commune contains: entities, communities, contributions
- Cross-commune analysis reveals regional patterns

**Rationale**: The Grand Débat National organized citizen participation by commune.
Preserving this structure enables geographic analysis and local-vs-regional comparison.

**Implementation Requirements**:
- Queries MUST support commune-level filtering
- Multi-commune queries MUST aggregate results with commune attribution
- API responses MUST include commune metadata for all entities
- Visualization MUST support commune-based coloring/grouping

---

### V. Cross-Commune Civic Analysis

**Graph exploration MUST enable discovering patterns across multiple communes.**

The most valuable civic insights emerge from comparing citizen voices across different
communes. The system MUST support cross-commune analysis:
- Query all 50 communes simultaneously
- Aggregate and compare responses by commune
- Identify common themes and regional variations
- Surface entities that appear in multiple communes

**Key Analysis Capabilities**:
- "What do citizens across all communes say about X?"
- "How do concerns differ between coastal and inland communes?"
- "Which themes appear most frequently across communes?"

**Rationale**: While single-commune queries are useful, the unique value of this
dataset lies in revealing patterns across the region's citizen voices.

**Implementation Requirements**:
- `grand_debat_query_all` tool MUST query across all communes
- Results MUST include per-commune breakdown
- Aggregated provenance MUST combine quotes from multiple communes
- Rate limiting MUST prevent API overload on multi-commune queries

---

### VI. Single-Source Civic Data Foundation

**The system connects EXCLUSIVELY to the Grand Débat National MCP server.**

This interface is single-purpose and does NOT support:
- Multiple data sources or backends
- Source selection or toggle functionality
- Alternative GraphRAG implementations
- Generic legal document queries

**Single MCP Server**:
```
URL: https://graphragmcp-production.up.railway.app/mcp
Protocol: MCP (Model Context Protocol) over HTTP
Transport: Streamable HTTP with JSON-RPC
```

**Available Tools**:
- `grand_debat_list_communes`: List all 50 communes with statistics
- `grand_debat_query`: Query single commune with local/global mode
- `grand_debat_query_all`: Query across all communes
- `grand_debat_search_entities`: Search entities by pattern
- `grand_debat_get_communities`: Get thematic community reports
- `grand_debat_get_contributions`: Get original citizen texts

**Rationale**: A single-purpose interface is simpler, more reliable, and better
optimized for its specific dataset. Multi-source flexibility adds complexity
without benefit for this focused civic exploration tool.

**Implementation Requirements**:
- NO source selection UI components
- NO alternative backend configuration
- API proxy MUST connect ONLY to graphragmcp-production
- Environment variables for URL are for deployment flexibility only, not multi-source

---

### VII. Functional Civic Interface

**The interface MUST prioritize clarity, efficiency, and civic exploration workflows.**

The interface is designed for researchers, journalists, and citizens exploring
Grand Débat contributions. The design philosophy emphasizes:

- **Functional clarity**: Every UI element MUST serve civic exploration
- **Content-centric layout**: Citizen quotes and themes are the primary content
- **Readable typography**: Optimized for reading citizen contributions
- **Restrained color palette**: Does not compete with content
- **Efficient navigation**: Quick access to search and commune exploration

**SCOPE LIMITATION**: This principle applies to VISUAL STYLING ONLY.
Graph animations and 3D visualizations MUST be fully preserved.

**Rationale**: Users come to explore citizen voices, not interface design.
Minimalism serves the civic mission.

**Implementation Requirements**:
- UI components MUST pass a "purpose test"
- Color palette limited to 4-5 primary colors
- Typography: maximum 2 font families
- Navigation: Search by query, explore by commune
- Graph visualization is the ONE exception for visual complexity

---

### VIII. Mobile-First Responsiveness

**The interface MUST be fully functional on mobile devices.**

Given that users may access this civic data from various devices, the interface
MUST provide a seamless experience across all screen sizes:

- **Touch-optimized interactions**: All graph interactions work with touch gestures
- **Responsive layout**: Adapts from 320px to desktop
- **Mobile-first design**: Prioritize mobile, enhance for desktop
- **Performance on mobile**: Remain performant on limited devices

**Rationale**: Civic data access should not be confined to desktop computers.
Users may explore during meetings, research sessions, or community discussions.

**Implementation Requirements**:
- CSS responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Touch targets at least 44x44 pixels
- Graph: tap (select), pinch (zoom), drag (pan), double-tap (focus)
- Collapsible navigation for mobile
- Minimum body text 16px on mobile
- Target < 3s First Contentful Paint on 3G

---

### IX. RAG Observability

**The system MUST provide visibility into GraphRAG operations.**

Users and developers MUST be able to observe how the GraphRAG system processes queries:

- **Query tracing**: Every query traceable through retrieval and generation
- **Provenance visibility**: Which entities, relationships, and quotes contributed
- **Processing phases**: Entity selection, community analysis, text synthesis
- **Performance metrics**: Query latency and commune coverage

**Rationale**: Transparency in RAG operations enables debugging, validation, and trust.

**Implementation Requirements**:
- Every query MUST return provenance data
- Debug mode MUST show processing phases
- API MUST expose entity selection rationale
- Performance timing MUST be available for optimization

---

## Data Integrity & Quality

### Graph Consistency

- Relationship directionality MUST be semantically meaningful
- Entity deduplication MUST occur before visualization
- Dangling references MUST be prevented
- Commune attribution MUST be consistent

### Source Fidelity

- Text chunks MUST maintain exact provenance to source contributions
- Entity extractions MUST link back to originating chunks
- Source texts MUST remain immutable
- Commune metadata MUST be accurate

### Defensive Type Conversion

**All type conversions MUST handle `None` values explicitly.**

```python
# SAFE: Handles both missing keys AND None values
float(data.get('weight') or 1.0)
```

---

## User Experience Standards

### Performance

- Graph queries MUST complete within 2 seconds
- Visualizations MUST render at ≥30 fps for up to 500 nodes
- API response times MUST stay under 200ms for single-hop queries
- Progressive loading for large result sets

### Accessibility

- Graph visualizations MUST provide text-based alternatives
- Color schemes MUST maintain WCAG AA contrast
- Keyboard navigation MUST be supported
- Screen reader compatibility maintained

### Error Handling

- Empty results MUST provide suggestions (try different commune, broader query)
- Graph failures MUST degrade gracefully to list views
- MCP connection errors MUST show clear status
- System state MUST be recoverable

---

## Governance

**This constitution supersedes all other development practices.**

### Amendment Procedure

1. Amendments MUST document:
   - Rationale for change
   - Impact analysis
   - Migration plan

2. Semantic versioning:
   - **MAJOR**: Scope changes, principle removals
   - **MINOR**: New principles, material expansions
   - **PATCH**: Clarifications, wording improvements

### Compliance Review

- Features MUST include Constitution Check
- PRs MUST verify compliance
- Deviations MUST be justified

### Living Document

Maintained at `.specify/memory/constitution.md`.

**Version**: 3.0.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-12-23
