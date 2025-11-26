<!--
SYNC IMPACT REPORT
==================
Version Change: 1.4.1 → 1.5.0 (Minor - Added mobile responsiveness principle)

Modified Principles:
- None

Added Principles:
- Principle VIII - Mobile-First Responsiveness: Interface MUST be fully usable on mobile devices

Removed Principles:
- None removed

Clarifications Added:
- None

Templates Requiring Updates:
- spec.md template: Add responsive design section to UI specifications
- tasks.md: Include mobile testing tasks for UI changes

Follow-up TODOs:
- Audit current interface for mobile compatibility
- Add responsive breakpoints to design tokens
- Test graph interaction on touch devices

Change Rationale:
- MINOR version (1.5.0) because new principle added
- Many users will access the Borges Library on mobile devices
- Graph exploration should work seamlessly on touch interfaces
- Ensures accessibility across all device types
-->

# The Borges Library constitution

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

### VI. Extensible literature foundation

**The system MUST be built upon the nano-graphRAG library and designed for easy addition of new books or bodies of literature.**

The Borges Library originates from and builds upon the nano-graphRAG library as its
foundational knowledge extraction and retrieval layer. The architecture MUST prioritize
the seamless integration of new literary content:

- **nano-graphRAG foundation** : the system leverages nano-graphRAG for entity extraction, relationship building, and graph-based retrieval
- **Modular book ingestion** : adding new books MUST be a straightforward, standardized process
- **Scalable corpus expansion** : the system MUST handle growing collections without architectural changes
- **Literature-agnostic processing**: The ingestion pipeline MUST work with diverse literary formats and genres

**Rationale**: The value of the Borges Library grows with its literary corpus. By
building on nano-graphRAG and prioritizing extensibility, we ensure that:
1. The system inherits a proven, well-tested GraphRAG implementation
2. Users and administrators can expand the library with minimal friction
3. New bodies of literature integrate seamlessly with existing knowledge
4. The architecture remains adaptable to diverse literary traditions and formats

This principle ensures the Borges Library is not a static collection but a living,
growing repository that can incorporate world literature progressively.

**Implementation requirements**:
- Book ingestion MUST follow a documented, repeatable pipeline based on nano-graphRAG
- New book addition MUST NOT require code changes to core system components
- Configuration-driven book registration MUST specify metadata, source files, and processing parameters
- Ingestion pipelines MUST support batch processing for adding multiple books
- Progress tracking MUST provide visibility into book processing status
- Rollback mechanisms MUST allow removal of incorrectly processed books
- The system MUST validate new book integration against existing graph consistency rules
- Documentation MUST include step-by-step guides for adding new literary content
- API endpoints MUST support programmatic book addition for automation workflows

---

### VII. Basile minimalism (tribute to libraryofbabel.info)

**The interface MUST embody Jonathan Basile's minimalistic design philosophy from libraryofbabel.info: functional simplicity, content-centric layout, and restrained visual hierarchy.**

**SCOPE LIMITATION**: This principle applies to VISUAL STYLING ONLY (fonts, colors, buttons, panels).
Functionality MUST remain 100% unchanged. Graph animations MUST be fully preserved.

In tribute to Jonathan Basile's iconic digital implementation of Borges' vision, the Borges Library
adopts his design principles as its visual constitution:

- **Functional minimalism**: Every UI element MUST serve a clear purpose. Decorative elements
  are prohibited unless they reinforce the Library of Babel's thematic identity
- **Content-centric layout**: Text and knowledge exploration are the primary visual content.
  The interface exists to serve the literary content, not to showcase itself
- **Typography as visual anchor**: Text MUST be the dominant visual element. Font choices,
  spacing, and hierarchy communicate meaning through restraint
- **Restrained color palette**: A limited, muted color scheme that does not compete with content.
  Dark backgrounds with light text evoke the infinite galleries of Babel
- **Hexagonal/geometric symbolism**: Where visual accents are necessary, geometric forms
  (especially hexagons) reinforce the architectural metaphor of Borges' infinite library
- **No gratuitous animation** (UI chrome only): Motion in buttons, panels, and menus MUST be purposeful—indicating
  loading, transitions, or user feedback. **EXCEPTION**: Graph visualization animations (physics simulations,
  node expansion, zoom, pan, interactive motions) are ESSENTIAL for exploration and MUST be fully preserved

**Rationale**: Jonathan Basile's libraryofbabel.info (https://libraryofbabel.info/) stands as the
definitive digital interpretation of Borges' concept. By adopting his design philosophy, we honor
both the literary source material and its most faithful digital incarnation. Minimalism serves the
intellectual mission: users come to explore knowledge, not to admire interface design.

**Implementation requirements**:
- UI components MUST pass a "purpose test": if an element cannot justify its existence, remove it
- Color palette MUST be limited to 4-5 primary colors maximum
- Typography MUST use a maximum of 2 font families (one for body, one for accent/headings)
- White space MUST be used deliberately to separate content areas and reduce cognitive load
- Navigation MUST be streamlined: Browse, Search, Random, and contextual actions only
- Loading states MUST be minimal and non-distracting (subtle spinners, not elaborate animations)
- Error states MUST be informative but visually understated
- The graph visualization is the ONE exception where visual complexity is permitted—all physics
  simulations, node expansion, zoom, pan, and interactive animations MUST be preserved unchanged.
  Only node/edge styling (colors, sizes) follows minimalist rules; motion is essential for exploration
- Accessibility options (e.g., "Browse without JavaScript") MUST be provided for inclusive design
- All design decisions MUST be defensible by answering: "How does this serve knowledge exploration?"

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

### Defensive Type Conversion

**All type conversions MUST handle `None` values explicitly.**

Python's `dict.get('key', default)` only returns the default when the key is **missing**,
NOT when the value is `None`. This subtle behavior causes silent failures:

```python
# ❌ UNSAFE: Crashes when weight key exists with None value
float(data.get('weight', 1.0))  # TypeError: float() argument must be... not 'NoneType'

# ✅ SAFE: Handles both missing keys AND None values
float(data.get('weight') or 1.0)
```

**Implementation requirements**:
- Type conversions (`float()`, `int()`, `str()`) MUST use `value or default` pattern
- Code review MUST check for unsafe `.get('key', default)` before type conversion
- Dictionary values from external sources (Neo4j, GraphML, APIs) MUST be treated as potentially `None`
- Silent failures MUST be prevented - prefer explicit errors over corrupted data

**Rationale**: A single `float(None)` crash in the GraphRAG pipeline can silently break
entire features (like dynamic node visualization) while appearing to work. The
`value or default` pattern provides defense in depth against nullable data.

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

**Version**: 1.4.1 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-25
