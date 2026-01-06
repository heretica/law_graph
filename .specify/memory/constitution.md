<!--
SYNC IMPACT REPORT
==================
Version Change: 3.0.0 → 3.1.0 (MINOR - Code Quality & Performance Principles Added)

Modified Principles:
- Principle VI: Single-Source Civic Data Foundation → Updated to reflect inline cache implementation
- NEW Principle X: Code Quality & Maintainability (added after dead code cleanup)
- NEW Principle XI: Performance Optimization Architecture (codifies Feature 006 patterns)

Additions:
- Added Data Integrity & Quality section with Defensive Type Conversion guidance
- Added Performance section with specific targets from Feature 006
- Codified caching architecture (client, session, backend layers)
- Added memoization patterns from BorgesLibrary.tsx
- Documented LOD (Level of Detail) system for 3D visualization

Technical Updates:
- Inline cache implementation in law-graphrag.ts (replaces deleted query-cache.ts)
- Dead code cleanup removed 6,024 lines (21 files deleted, 3 modified)
- Zero breaking changes maintained (ISO-functionality with Vercel deployment)

Templates Requiring Updates:
- ✅ plan-template.md: Constitution Check section verified
- ✅ spec-template.md: Responsive Design section verified (Principle VIII)
- ✅ tasks-template.md: Mobile Responsiveness Testing phase verified
- ⚠️ CLAUDE.md: Should reference latest constitution version

Change Rationale:
- MINOR version (3.1.0) because:
  1. New principles added (Code Quality, Performance) without breaking existing ones
  2. Material expansion of caching and performance guidance
  3. No removal of existing principles or scope changes
  4. Backward compatible with 3.0.0 governance model

Follow-up TODOs:
- None - all placeholders filled

Last Major Cleanup: 2026-01-06 (removed 6,024 lines dead code, maintained ISO-functionality)
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
- `highlightedEntityId` state synchronizes highlighting across components

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
- `commune-mapping.ts` maintains canonical mapping for all 50 communes
- `getCommuneDisplayName()` provides consistent commune name formatting

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
- `filterOrphanNodes()` in `graphml-parser.ts` enforces this at data load time
- GraphML validation detects and reports orphan node count before filtering

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
- Queries MUST support commune-level filtering via `commune_ids` parameter
- Multi-commune queries MUST aggregate results with commune attribution
- API responses MUST include commune metadata for all entities
- Visualization MUST support commune-based coloring/grouping
- `isCommune()` detection in `GraphVisualization3DForce.tsx` for special rendering
- Communes rendered with gold color (#ffd700) and central positioning

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
- `CommuneFilterChips` component enables multi-select commune filtering
- Progressive loading for large multi-commune result sets

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
- Inline cache implementation in `law-graphrag.ts` (5-min TTL, SHA-256 keys)
- Simple LRU eviction (100 entries max) prevents memory bloat

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
- No decorative UI elements that don't serve exploration workflow

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
- `CommuneSelectorMobile` component for touch-optimized commune selection
- Mobile-first CSS in all components (base mobile styles, desktop enhancements)

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
- Console logging for cache hits/misses in `law-graphrag.ts`
- Processing phase state tracking in `BorgesLibrary.tsx`

---

### X. Code Quality & Maintainability

**The codebase MUST remain clean, maintainable, and free of dead code.**

Code quality is a constitutional principle because unclear, bloated codebases
hinder feature development, introduce bugs, and make onboarding difficult.

**Code Quality Standards**:
- **Zero dead code**: No unused imports, functions, components, or files
- **Single responsibility**: Each module serves one clear purpose
- **Type safety**: Full TypeScript strict mode enforcement
- **Explicit dependencies**: No hidden coupling between modules
- **Self-documenting code**: Variable/function names explain intent
- **Minimal comments**: Code structure should be self-evident; comments explain "why" not "what"

**Rationale**: Professional codebases require ongoing maintenance. Dead code creates
confusion, unused dependencies slow builds, and unclear architecture makes changes risky.

**Implementation Requirements**:
- Regular dead code audits before company submissions or major releases
- TypeScript strict mode MUST be enabled (`tsconfig.json`)
- Lint rules MUST catch unused variables, imports, and unreachable code
- Component imports MUST be verified as actually rendered in UI
- Service methods MUST be verified as actually called
- Git history preserves all deleted code (no need for commented code)
- Pre-commit hooks SHOULD run linters and type checks

**Recent Cleanup (2026-01-06)**:
- Removed 6,024 lines of dead code (21 files deleted, 3 modified)
- Eliminated duplicates, unused debug components, legacy clients
- Maintained ISO-functionality with Vercel production deployment
- Inline cache implementation replaced deleted `query-cache.ts` module

---

### XI. Performance Optimization Architecture

**The system MUST meet defined performance targets through architectural patterns.**

Performance is a constitutional principle because slow interfaces frustrate users and
limit dataset scale. Optimization must be architectural, not ad-hoc.

**Performance Targets (Feature 006)**:
- **Startup**: <3s fresh load, <1s cached GraphML
- **Single query**: <10s
- **15-commune query**: <30s
- **50-commune query**: <90s
- **Graph interaction**: ≥30 fps stable for up to 500 nodes

**Architectural Patterns**:

1. **Three-Layer Caching**:
   - **Client (5 min TTL)**: Inline cache in `law-graphrag.ts` with SHA-256 keys
   - **Session Pool**: Frontend API route connection reuse
   - **Backend**: LRU cache for commune initialization + LLM/embedding caches

2. **Progressive Loading**:
   - GraphML displays instantly (browser cache)
   - MCP queries batched (5 communes at a time with proportional delays)
   - Visual feedback during background fetching
   - Tutorial overlay for first-time users during load

3. **Memoization** (O(n) transformations):
   - `useMemo(() => normalizeGraphNodes)` → Add default properties
   - `useMemo(() => mapNodesToColorEntities)` → Node → visualization format
   - `useMemo(() => createQueryMatcher)` → Query keyword filtering

4. **Level of Detail (LOD)** for 3D visualization:
   - High detail (<200 units): Full resolution, particles enabled
   - Medium detail (200-500): Reduced resolution, no particles
   - Low detail (>500): Minimal resolution, maintains visibility
   - Configurable via `lod-config.ts` with tunable distance thresholds

**Rationale**: Users abandon slow interfaces. Large datasets (50 communes, 8,000+ entities)
require optimization at the architectural level, not post-hoc performance fixes.

**Implementation Requirements**:
- All data transformations MUST use single-pass algorithms where possible
- Cache keys MUST be deterministic (SHA-256 of query + communes)
- Progressive loading MUST provide visual feedback (progress indicators)
- LOD MUST adapt automatically based on camera distance
- Geometry simplification at distance MUST maintain visual coherence
- Performance profiling MUST be done before optimizing
- No premature optimization; measure first, then optimize bottlenecks

---

## Data Integrity & Quality

### Graph Consistency

- Relationship directionality MUST be semantically meaningful
- Entity deduplication MUST occur before visualization
- Dangling references MUST be prevented
- Commune attribution MUST be consistent
- `validateGraphML()` enforces node/relationship schema compliance

### Source Fidelity

- Text chunks MUST maintain exact provenance to source contributions
- Entity extractions MUST link back to originating chunks
- Source texts MUST remain immutable
- Commune metadata MUST be accurate
- `getCommuneDisplayName()` provides canonical commune name formatting

### Defensive Type Conversion

**All type conversions MUST handle `None` values explicitly.**

```python
# SAFE: Handles both missing keys AND None values
float(data.get('weight') or 1.0)

# UNSAFE: Fails on None values even if key exists
float(data.get('weight', 1.0))
```

**Rationale**: GraphRAG APIs may return `None` for optional fields. Type conversions
must handle both missing keys and null values to prevent runtime crashes.

---

## User Experience Standards

### Performance

- Graph queries MUST complete within 2 seconds (single-commune local mode)
- Visualizations MUST render at ≥30 fps for up to 500 nodes
- API response times MUST stay under 200ms for single-hop queries
- Progressive loading for large result sets (>15 communes)
- LOD system maintains ≥30 fps at all zoom levels
- Cache hit rate SHOULD exceed 40% for typical usage patterns

### Accessibility

- Graph visualizations MUST provide text-based alternatives
- Color schemes MUST maintain WCAG AA contrast
- Keyboard navigation MUST be supported
- Screen reader compatibility maintained
- Entity click handlers work with keyboard (Enter/Space)

### Error Handling

- Empty results MUST provide suggestions (try different commune, broader query)
- Graph failures MUST degrade gracefully to list views
- MCP connection errors MUST show clear status
- System state MUST be recoverable
- Error boundaries prevent component tree crashes
- User-friendly error messages (no stack traces in production)

---

## Governance

**This constitution supersedes all other development practices.**

### Amendment Procedure

1. Amendments MUST document:
   - Rationale for change
   - Impact analysis on existing principles
   - Migration plan for affected code
   - Template updates required

2. Semantic versioning:
   - **MAJOR**: Scope changes, principle removals, incompatible governance changes
   - **MINOR**: New principles, material expansions, non-breaking additions
   - **PATCH**: Clarifications, wording improvements, typo fixes

3. Sync Impact Report MUST be prepended as HTML comment after each amendment

### Compliance Review

- Features MUST include Constitution Check in plan.md
- PRs MUST verify compliance with affected principles
- Deviations MUST be justified in Complexity Tracking table
- Constitution violations MUST be documented and approved before merge

### Living Document

Maintained at `.specify/memory/constitution.md`.

**Version**: 3.1.0
**Ratified**: 2025-11-18
**Last Amended**: 2026-01-06
**Last Major Cleanup**: 2026-01-06 (removed 6,024 lines dead code)
