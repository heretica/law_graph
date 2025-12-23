# Feature Specification: Grand Débat National Civic Knowledge Graph Interface

**Feature Branch**: `003-rag-observability-comparison`
**Created**: 2025-12-23
**Updated**: 2025-12-23
**Status**: Draft
**Constitution Version**: 3.0.0
**Input**: Single-purpose interface for exploring citizen contributions from the French Grand Débat National 2019 "Cahiers de Doléances" dataset via GraphRAG MCP server.

## Constitution Check

*This feature implements the **Grand Débat National GraphRAG Constitution v3.0.0** - a single-purpose civic knowledge graph interface.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. End-to-End Interpretability | **Primary** | Users trace from text chunks → entities → RAG answers |
| II. Civic Provenance Chain | **Primary** | All data traceable to source commune and citizen text |
| III. No Orphan Nodes | Applies | Graph visualization filters orphan nodes |
| IV. Commune-Centric Architecture | **Primary** | Communes are organizational units for all queries |
| V. Cross-Commune Civic Analysis | Supports | Multi-commune query aggregation enabled |
| VI. Single-Source Civic Data | **Enforced** | NO source selection - single MCP server only |
| VII. Functional Civic Interface | Applies | Minimalist design focused on content |
| VIII. Mobile-First Responsiveness | Applies | Touch-optimized, responsive layout |
| IX. RAG Observability | Supports | Query tracing and provenance visibility |

---

## User Scenarios & Testing *(mandatory)*

### User Story 0 - Explore Grand Débat Citizen Contributions (Priority: P0)

A researcher, journalist, or citizen wants to explore the Grand Débat National 2019 "Cahiers de Doléances" from 50 communes in Charente-Maritime through an interactive knowledge graph interface, allowing them to query citizen contributions, view extracted entities and relationships, and understand civic concerns expressed by citizens.

**Why this priority**: This is the foundational interface for civic data exploration. Users need to query and explore citizen contributions to understand the themes, concerns, and proposals from the Grand Débat National. This directly implements Constitution Principles I (End-to-End Interpretability) and II (Civic Provenance Chain).

**Data Source**: Single MCP server at `https://graphragmcp-production.up.railway.app/mcp`

**Independent Test**: Load the interface, query "What do citizens say about taxes?", verify the graph displays civic entities with commune attribution and source quotes.

**Acceptance Scenarios**:

1. **Given** the interface is loaded, **When** the user enters a civic query (e.g., "What are the main concerns about public services?"), **Then** the system displays relevant civic entities and their relationships in the 3D graph
2. **Given** the civic graph is displayed, **When** the user clicks on an entity node, **Then** they see entity details including source quotes and commune attribution
3. **Given** the user is exploring the graph, **When** they navigate to connected entities, **Then** they can trace the provenance chain from RAG answers back to original citizen contributions (per Constitution Principle I)
4. **Given** a query returns results, **When** the user views source quotes, **Then** each quote shows which commune contributed it (per Constitution Principle II)
5. **Given** the graph visualization renders, **When** nodes are displayed, **Then** no orphan nodes (nodes without relationships) appear (per Constitution Principle III)

---

### User Story 1 - Query Specific Commune Contributions (Priority: P1)

A user wants to explore citizen contributions from a specific commune to understand local concerns and compare them with regional patterns.

**Why this priority**: Commune-level exploration is central to the Constitution Principle IV (Commune-Centric Architecture). Users need to filter by commune to understand local vs regional perspectives.

**Independent Test**: Select a commune from the list, query about local concerns, verify results are scoped to that commune.

**Acceptance Scenarios**:

1. **Given** the commune list is displayed, **When** the user selects "Rochefort", **Then** subsequent queries are scoped to that commune's citizen contributions
2. **Given** a commune is selected, **When** the user queries "What are local priorities?", **Then** results only include entities and quotes from that commune
3. **Given** commune-scoped results are displayed, **When** the user views the graph, **Then** entities show the commune attribution clearly

---

### User Story 2 - Cross-Commune Thematic Analysis (Priority: P1)

A researcher wants to query across all 50 communes to identify regional patterns and common themes in citizen contributions.

**Why this priority**: Constitution Principle V (Cross-Commune Civic Analysis) emphasizes that the unique value lies in comparing citizen voices across communes.

**Independent Test**: Run a query without commune filter, verify results aggregate from multiple communes with per-commune attribution.

**Acceptance Scenarios**:

1. **Given** no commune filter is selected, **When** the user queries "What do citizens say about transportation?", **Then** results aggregate contributions from multiple communes
2. **Given** cross-commune results are displayed, **When** the user views the response, **Then** they see which communes contributed to the answer
3. **Given** aggregated results include source quotes, **When** the user inspects quotes, **Then** each quote shows its source commune

---

### User Story 3 - Explore Thematic Communities (Priority: P2)

A user wants to explore the thematic community structure identified by the GraphRAG system to understand how civic concerns cluster together.

**Why this priority**: Community reports provide high-level synthesis of civic themes, supporting the interpretability goals of Constitution Principle I.

**Independent Test**: Request community reports, verify they show thematic clusters with member entities.

**Acceptance Scenarios**:

1. **Given** the user requests community analysis, **When** the system retrieves community reports, **Then** thematic clusters are displayed with descriptions
2. **Given** a community is selected, **When** the user explores it, **Then** they see member entities and their relationships
3. **Given** community data is displayed, **When** entities are shown, **Then** each entity links back to source quotes and communes

---

### Edge Cases

- What happens when the MCP server is unavailable? → System displays a clear error message with connection status
- What happens when a query returns no results? → System suggests alternative queries or broader search terms
- What happens when a commune has very few contributions? → System displays available data with a note about limited coverage
- What happens when graph visualization has too many nodes? → System applies progressive loading and allows filtering
- What happens when source quotes are unavailable for an entity? → Entity is still displayed but marked with "no source available"

## Requirements *(mandatory)*

### Functional Requirements

**Interface Requirements (Core)**:
- **FR-001**: System MUST provide a web-based interface for exploring the Grand Débat National civic knowledge graph
- **FR-002**: Interface MUST connect EXCLUSIVELY to the single MCP server at `https://graphragmcp-production.up.railway.app/mcp`
- **FR-003**: Interface MUST NOT provide any source selection or toggle functionality (Constitution Principle VI)
- **FR-004**: Interface MUST display query results in a 3D graph visualization
- **FR-005**: Interface MUST allow users to click on entity nodes to view details and source quotes

**Commune-Centric Requirements (Constitution Principle IV)**:
- **FR-010**: System MUST support listing all 50 communes with statistics via `grand_debat_list_communes` tool
- **FR-011**: System MUST support single-commune queries via `grand_debat_query` tool
- **FR-012**: System MUST support cross-commune queries via `grand_debat_query_all` tool
- **FR-013**: All query results MUST include commune attribution for entities and quotes

**Provenance Requirements (Constitution Principle II)**:
- **FR-020**: Every entity displayed MUST show its source commune
- **FR-021**: Every source quote MUST include commune attribution
- **FR-022**: RAG answers MUST include provenance data linking to source material

**Graph Visualization Requirements (Constitution Principle III)**:
- **FR-030**: Graph visualization MUST filter out orphan nodes (nodes with zero relationships)
- **FR-031**: Graph visualization MUST maintain at least 30fps for up to 500 nodes
- **FR-032**: Nodes MUST be visually spaced to show relationships clearly

**Responsiveness Requirements (Constitution Principle VIII)**:
- **FR-040**: Interface MUST be fully functional on mobile devices (320px to desktop)
- **FR-041**: Touch interactions MUST be supported: tap (select), pinch (zoom), drag (pan)
- **FR-042**: Touch targets MUST be at least 44x44 pixels

### Key Entities

- **Commune**: A municipality in Charente-Maritime that contributed citizen texts. Contains id, name, entity count, contribution count.
- **CivicEntity**: An extracted concept from citizen contributions (theme, actor, proposal, concern). Contains name, type, description, source commune, source quotes.
- **Relationship**: A connection between two civic entities showing how concepts relate.
- **SourceQuote**: Original text from a citizen contribution with commune attribution.
- **Community**: A thematic cluster of related entities identified by the GraphRAG system.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can query and receive civic data results within 3 seconds
- **SC-002**: All displayed entities include commune attribution (100% provenance)
- **SC-003**: Graph visualization renders at 30fps with up to 500 nodes
- **SC-004**: No orphan nodes appear in the visualization (0% orphan rate)
- **SC-005**: Interface is fully functional on mobile devices (320px minimum width)
- **SC-006**: Users can trace any answer back to source citizen quotes
- **SC-007**: MCP connection health is visible to users
- **SC-008**: Cross-commune queries return results from at least 3 communes when data exists

## Assumptions

- The MCP server at `https://graphragmcp-production.up.railway.app/mcp` is operational and accessible
- The Grand Débat National dataset covers 50 communes in Charente-Maritime with ~8,000+ entities
- The MCP protocol follows the 2024-11-05 specification with JSON-RPC over HTTP
- Session management is handled by the MCP server via `mcp-session-id` header
- The dataset is the "Cahiers de Doléances" from Grand Débat National 2019
- Available MCP tools: `grand_debat_list_communes`, `grand_debat_query`, `grand_debat_query_all`, `grand_debat_search_entities`, `grand_debat_get_communities`, `grand_debat_get_contributions`
