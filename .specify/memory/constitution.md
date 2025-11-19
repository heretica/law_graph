<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0 (Minor - Added Babel Library Mimetism Principle)

Modified Principles:
- REORDERED: Principle I - End-to-End Interpretability (was V, now I)
- REORDERED: Principle III - No Orphan Nodes (was I, now III)
- REORDERED: Principle IV - Book-Centric Architecture (was II, now IV)
- REORDERED: Principle V - Inter-Book Knowledge Exploration (was III, now V)

Added Principles:
- NEW: Principle II - Babel Library Mimetism (Infinite Exploration Architecture)

Removed Principles:
- REMOVED: Principle IV - Relationship Visibility (user decision)

Added Sections:
- Principle II now formalizes the Borges/Babel Library philosophical foundation

Templates Requiring Updates:
✅ plan-template.md - Constitution Check section will reference 5 principles (I-V)
✅ spec-template.md - User stories must consider infinite exploration and progressive discovery
✅ tasks-template.md - Tasks must validate against Babel Library mimetism requirements

Follow-up TODOs:
- None - all placeholders have been filled

Change Rationale:
- MINOR version (1.1.0) because new principle added without breaking existing ones
- Babel Library Mimetism formalizes the infinite exploration concept from Borges' story
- This principle ties together progressive loading, reconciliation, and multi-book exploration
- The reordering prioritizes end-to-end interpretability as the foundational principle
- Implementation requirements align with existing codebase (progressive loading 300→500→1000,
  reconciliation API, Neo4j + GraphRAG merge, centrality-based prioritization)
-->

# Borges Library constitution

## Core principles

### I. End-to-end interpretability

**The system MUST enable navigation from text chunks to RAG answers through graph.**

Users MUST be able to trace the complete reasoning path of the GraphRAG system:
- From original text chunks in source books
- Through extracted entities and relationships
- Across graph traversal paths
- To final RAG-generated answers

Every step of the knowledge extraction, storage, retrieval, and generation pipeline
MUST be inspectable and navigable.

**Rationale**: Interpretability is essential for trust, debugging, and learning. Users
need to understand how answers were derived, validate the reasoning, and explore
alternative paths through the knowledge graph. This transparency distinguishes the
Borges Library from black-box RAG systems.

**Implementation requirements**:
- Text chunk storage MUST preserve source attribution (book, page, section)
- Entity extraction MUST maintain bidirectional links to source chunks
- Graph queries MUST return traversal paths, not just final results
- RAG responses MUST include provenance chains (answer → nodes → relationships → chunks)
- UI MUST provide click-through navigation across the entire pipeline
- All intermediate representations MUST be accessible via API and interface

---

### II. Babel library mimetism (infinite exploration architecture)

**The system MUST embody Borges' Library of Babel principles: infinite exploration, emergent meaning, and progressive discovery.**

Like Borges' infinite library of hexagonal galleries, this system architecture mirrors the philosophical concepts from "The Library of Babel":

- **Infinite exploration**: Users can navigate endlessly through the knowledge graph without artificial limits or dead ends
- **Emergent meaning from chaos**: Insights arise from connection patterns across seemingly disparate entities, not from isolated facts
- **Progressive revelation**: Knowledge unfolds in layers, presenting the most central/relevant nodes first while allowing unlimited depth
- **Relational truth**: Meaning emerges from the web of relationships between books, entities, and concepts

**Rationale**: The Library of Babel represents a universe containing all possible books, where meaning is rare but discoverable through navigation. Our system mirrors this by creating an explorable knowledge space where every visible node opens pathways to further discovery. The graph is not a static document but a living space users inhabit and navigate, revealing "sense" hidden within apparent information chaos.

**Implementation Requirements**:
- Graph navigation MUST support recursive expansion from any node (no terminal points)
- Progressive loading MUST enable gradual exploration: 300→500→1000 most central nodes
- Community detection MUST identify emergent thematic clusters across books
- Recommendation algorithms MUST surface non-obvious but high-value cross-book connections
- Search MUST support both precise queries and exploratory "wandering"
- The reconciliation layer MUST merge Neo4j + GraphRAG to reveal patterns invisible in either alone
- Visualizations MUST highlight structural patterns (hubs, bridges, communities)
- The UI MUST provide "related paths" and "alternative routes" through the graph
- Loading states MUST indicate "more to explore" vs "fully loaded"
- Centrality metrics (degree, betweenness, PageRank) MUST guide progressive loading priorities

---

### III. No orphan nodes

**All nodes displayed in the interface MUST have at least one relationship.**

Orphan nodes (isolated entities without connections) are prohibited in the visualization
layer. This principle ensures that:
- every entity shown provides relational context
- graph visualizations maintain semantic coherence
- users always see how entities connect to the broader knowledge graph
- query results filter out disconnected nodes before rendering

**Rationale**: The Borges Library is fundamentally about exploring relationships and
connections between literary entities. Orphan nodes provide no navigational value and
clutter the interface with isolated facts that cannot be explored.

**Implementation Requirements**:
- API endpoints MUST filter query results to exclude nodes with zero relationships
- Graph visualizations MUST validate node connectivity before rendering
- Backend queries MUST include relationship count validation
- Frontend components MUST display relationship counts for transparency

---

### IV. Book-centric architecture

**Books MUST be the core entities in all graph queries and visualizations.**

The knowledge graph is organized around books as primary entities. All queries,
visualizations, and explorations MUST treat books as the central organizing principle:
- search queries prioritize book-entity relationships
- graph traversals anchor on book nodes
- entity relationships are contextualized through their connections to books
- visualization layouts position books as structural hubs

**Rationale**: books are the fundamental units of knowledge in the Borges Library. By
making them the architectural center, we ensure that all knowledge exploration remains
grounded in the source literary works, enabling users to trace insights back to their
origins.

**Implementation requirements**:
- GraphRAG queries MUST start from or include book nodes
- Database indexes MUST optimize for book-centered queries
- API responses MUST include book context for all entities
- Visualization algorithms MUST calculate layouts with books as anchor points

---

### V. Inter-book knowledge exploration

**Graph exploration MUST prioritize relationships that span multiple books.**

The most valuable insights emerge from connections across different literary works.
The system MUST favor discovering, surfacing, and visualizing inter-book relationships:
- graphRAG search prioritizes multi-book relationship paths
- query ranking weights cross-book connections higher
- visualizations highlight bridges between different books
- relationship types that connect books are given higher importance

**Rationale**: while intra-book relationships are important, the unique value of a
knowledge graph lies in revealing how concepts, themes, characters, and ideas connect
across different works. These cross-pollinations generate novel insights impossible
to discover through single-book analysis.

**Implementation requirements**:
- GraphRAG algorithms MUST include inter-book relationship scoring
- Query expansion MUST traverse book boundaries
- Relationship weights MUST account for cross-book connections
- Analytics MUST track and report inter-book coverage metrics

---


---

## Data Integrity & Quality

### Graph Consistency

- Relationship directionality MUST be semantically meaningful and consistent
- Relationship types MUST follow a controlled vocabulary
- Entity deduplication MUST occur before visualization
- Dangling references MUST be prevented through referential integrity checks

### Source Fidelity

- Text chunks MUST maintain exact provenance to source books
- Entity extractions MUST link back to originating chunks
- Modifications to the graph MUST preserve audit trails
- Source texts MUST remain immutable; annotations are separate layers

---

## User Experience Standards

### Performance

- Graph queries MUST complete within 2 seconds for typical exploration tasks
- Visualizations MUST render smoothly (≥30 fps) for graphs up to 500 nodes
- API response times MUST stay under 200ms for single-hop relationship queries
- Progressive loading MUST be implemented for large result sets

### Accessibility

- Graph visualizations MUST provide alternative text-based navigation modes
- Color schemes MUST maintain WCAG AA contrast ratios
- Keyboard navigation MUST be fully supported
- Screen reader compatibility MUST be maintained for all interactive elements

### Error Handling

- Empty query results MUST provide actionable suggestions
- Graph rendering failures MUST gracefully degrade to list views
- API errors MUST include context and recovery guidance
- System state MUST be recoverable after errors without data loss

---

## Governance

**This constitution supersedes all other development practices and design decisions.**

### Amendment Procedure

1. Proposed amendments MUST be documented with:
   - Rationale for the change
   - Impact analysis on existing principles
   - Migration plan for affected components
   - Approval from project maintainers

2. Amendments follow semantic versioning:
   - **MAJOR**: Principle removals, redefinitions, or backwards-incompatible changes
   - **MINOR**: New principles added or material expansions to existing guidance
   - **PATCH**: Clarifications, wording improvements, non-semantic refinements

### Compliance Review

- All feature specifications MUST include a Constitution Check section
- Pull requests MUST verify compliance with applicable principles
- Design deviations MUST be explicitly justified in plan.md Complexity Tracking
- Automated tests SHOULD validate constitutional requirements where feasible

### Living Document

This constitution is maintained in version control at `.specify/memory/constitution.md`.
For development workflow guidance, consult the runtime documentation in `README.md`
and project-specific instructions in `CLAUDE.md`.

**Version**: 1.1.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-18
