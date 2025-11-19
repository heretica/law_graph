# Feature specification: interactive graphRAG refinement system

**Feature Branch**: `001-interactive-graphrag-refinement`

**Created**: 2025-11-18

**Status**: Draft

**Input**:  "Build a new knowledge system that permits to uncover new knowledge patterns between fields, discipline, or objects. This system enables the discovery of ontological patterns. This knowledge system is also built to provide the first end-to-end interpretable graphRAG, that is the user can see exactly what knowledge struture it used to answer its query. The dream here is to create a system where the user can refine the graphRAG structure after using it, giving it insight like 'no, this entity is related in this way with another entity', then seeing the impact of restructuring the graph on the answer structure."

## User scenarios & testing *(mandatory)*

### User story 1 - Trace graphRAG answer to source knowledge (Priority: P1)

A researcher queries the system about cross-disciplinary patterns (e.g., "How do concepts of entropy appear across physics, information theory, and literature?") and receives an answer. They want to understand exactly which entities, relationships, and community reports the system used to generate this answer, traceable all the way back to the original text chunks in source documents.

**Why this priority**: this is the foundation of interpretability. Without the ability to trace answers to their knowledge sources, users cannot trust or validate the system's reasoning. This delivers immediate value as a transparent GraphRAG that differentiates from black-box systems.

**Independent Test**: can be fully tested by submitting a query, receiving an answer, and clicking through the complete provenance chain: answer → entities used → relationships traversed → community reports referenced → original text chunks. Success means every step is visible and navigable.

**Acceptance scenarios**:

1. **Given** a query is submitted, **when** the system returns an answer, **then** the answer includes an attribution graph showing all entities, relationships, communities and chunks used in reasoning
2. **Given** an answer with attribution graph, **when** the user clicks on a node, **then** the system displays on the graph that node's details 
3. **Given** a displayed relationship on the attribution graph, **when** the user clicks on it, **then** the system shows the relationship's type, properties, source text evidence, and connected entities
4. **Given** a community node appears in the attribution graph, **when** the user clicks it, **then** the system displays the community members, summary, and relevance score
5. **Given** a text chunk node in the attribution graph, **when** the user clicks it, **Then** the system displays the original text with entity highlights, book source, and page location

---

### User story 2 - Correct graph relationships interactively (Priority: P1)

A domain expert notices that the GraphRAG made an incorrect assumption about how two entities are related (e.g., "This protein interacts with this gene, not regulates it"). They want to edit the relationship directly in the interface, specifying the correct relationship type and providing a justification.

**Why this priority**: human-in-the-loop refinement is the unique value proposition. Without the ability to correct the graph, interpretability alone is insufficient. This enables the system to learn from expert feedback and improve over time. The user must be able to intervene in the knowledge structure otherwise the user only understands the structure. 

**Independent Test**: can be fully tested by identifying a relationship in the graph visualization, clicking "Edit relationship," changing its type/properties, saving the change, and verifying the edit is reflected immediately in the graph and available for future queries.

**Acceptance Scenarios**:

1. **Given** a relationship is displayed in the attribution graph, **when** the user right-clicks or selects "Edit," **then** an edit modal appears with current relationship type, properties, and connected entities
2. **Given** the edit modal is open, **when** the user changes the relationship type and adds a justification note, **then** the system validates the new type and saves the change
3. **Given** a relationship is edited, **when** the user clicks "Save," **then** the graph updates immediately to reflect the new relationship
4. **Given** an edited relationship, **when** the system stores the change, **then** it records the editor's identity, timestamp, old value, new value, and justification
5. **Given** multiple edits to the same relationship, **when** the user views edit history, **Then** the system displays a chronological log of all changes with rollback options

---

### User story 3 - Re-query after graph refinement (priority: P1)

After correcting relationships in the graph, the user wants to re-run their original query to see how the answer changes based on the refined knowledge structure. They expect a side-by-side comparison of the original answer versus the new answer, with highlighted differences.

**Why this priority**: This closes the feedback loop, demonstrating the direct impact of graph refinements on system outputs. Users can empirically validate whether their corrections improved answer quality.

**Independent Test**: Can be fully tested by making a graph edit, clicking "Re-run query," and receiving a comparison view showing the original answer, new answer, and a diff highlighting which entities/relationships changed and how the answer evolved.

**Acceptance Scenarios**:

1. **Given** a query has been answered and graph edits have been made, **When** the user clicks "Re-run query," **Then** the system re-executes the query using the updated graph
2. **Given** a re-executed query, **When** results are returned, **Then** the system displays both the original answer and new answer side-by-side
3. **Given** a comparison view, **When** displayed, **Then** the system highlights textual differences and shows which edited relationships influenced the change
4. **Given** multiple query iterations, **When** the user views query history, **Then** they see a timeline of query versions with corresponding graph states
5. **Given** an improved answer after refinement, **When** the user confirms satisfaction, **Then** they can mark the refined graph structure as "validated" for future queries



---

### Edge Cases

- What happens when multiple users edit the same relationship concurrently? (Conflict resolution mechanism needed)
- How does the system handle circular relationship edits that could create logical contradictions?
- What if a user deletes an entity that is referenced in saved queries or pattern discoveries?
- How does re-querying scale if the graph has thousands of edits?
- What happens when a user's edit contradicts a high-confidence extraction from text?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display full provenance for every GraphRAG answer, including entities, relationships, community reports, and source text chunks
- **FR-002**: System MUST allow users to edit existing relationships by changing type, properties, or directionality
- **FR-003**: System MUST record edit history for all graph modifications, including editor identity, timestamp, old/new values, and justification
- **FR-004**: System MUST support re-running queries after graph edits and display before/after answer comparisons
- **FR-005**: System MUST enable users to add new entities and relationships manually with full provenance documentation
- **FR-006**: System MUST discover recurring ontological patterns across multiple books or disciplines
- **FR-007**: System MUST provide click-through navigation from answers → entities → relationships → text chunks
- **FR-008**: System MUST visually distinguish between automatically extracted and manually added/edited knowledge
- **FR-009**: System MUST support rollback of edits to previous graph states
- **FR-010**: System MUST validate that edited relationships maintain graph consistency (no dangling references)
- **FR-011**: System MUST highlight which graph edits influenced answer changes during re-query
- **FR-012**: System MUST allow users to save and name pattern discoveries for future reference
- **FR-013**: System MUST support conflict resolution when multiple users edit the same graph element
- **FR-014**: System MUST display pattern discovery results ranked by frequency, cross-domain coverage, and significance

### Key Entities

- **Entity**: A concept, person, place, event, or object extracted from text or manually added (properties: name, type, description, source_chunks, confidence_score, manual_flag, creator)
- **Relationship**: A directed or undirected connection between two entities (properties: type, source, target, properties, evidence_chunks, confidence_score, manual_flag, creator, edit_history)
- **Provenance Chain**: The complete traceable path from a RAG answer to source knowledge (properties: query, answer, entities_used, relationships_traversed, communities_cited, text_chunks)
- **Graph Edit**: A modification to the graph structure (properties: edit_type, target_id, old_value, new_value, justification, editor, timestamp)
- **Ontological Pattern**: A recurring relationship structure across domains (properties: pattern_name, motif_structure, instances, frequency, cross_domain_count, significance_score)
- **Query Iteration**: A versioned query execution with corresponding graph state (properties: query_text, graph_snapshot_id, answer, provenance, timestamp)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can trace 100% of answer elements to their source text chunks within 3 clicks
- **SC-002**: Graph edits take effect immediately (<1 second) and are reflected in the next query
- **SC-003**: Users successfully complete edit-requery-compare workflow in under 2 minutes for typical queries
- **SC-004**: Pattern discovery identifies at least 10 meaningful cross-domain patterns in a corpus of 20+ books
- **SC-005**: 80% of user-submitted edits include justification notes, indicating engaged human feedback
- **SC-006**: Re-query answer comparison highlights differences correctly in 95%+ of cases
- **SC-007**: The system maintains graph consistency (no broken references) through 1000+ edit operations
- **SC-008**: Users report increased trust in GraphRAG answers due to interpretability (measured via survey)
- **SC-009**: Expert users validate that graph refinements improve answer quality in 70%+ of test cases
- **SC-010**: Pattern discovery completes in under 30 seconds for graphs with up to 10,000 entities

## Assumptions *(optional)*

### Technology & Infrastructure

- The system builds on the existing Borges Library architecture (Neo4j, GraphRAG, reconciliation API)
- Users have domain expertise to make meaningful graph edits (not general public)
- The system operates on curated book corpora, not open-ended web data

### User Expectations

- Users understand basic graph concepts (nodes, edges, relationships)
- Users are willing to invest time in refining the graph for improved accuracy
- Users prefer transparency over black-box accuracy for research applications

### Data & Quality

- Source text chunks are accurately attributed to book sources
- Initial entity/relationship extraction has reasonable baseline quality (>70% precision)
- Books are properly formatted and structured for chunk extraction

### Scope Boundaries

- The system does not automatically validate the correctness of user edits (relies on expert judgment)
- Pattern discovery focuses on structural patterns, not semantic similarity
- The system does not handle real-time multi-user collaborative editing in the MVP

## Out of Scope *(optional)*

- Automatic graph correction based on machine learning
- Natural language edit interfaces ("make this relationship stronger")
- Multi-language support beyond the current corpus
- Integration with external knowledge bases (e.g., Wikidata, DBpedia)
- Mobile-optimized editing interfaces
- Fine-grained access control for graph editing permissions
- Automated pattern validation against ground-truth ontologies

## Dependencies *(optional)*

### Internal Dependencies

- Existing Borges Library infrastructure (Neo4j database, GraphRAG API, reconciliation layer)
- Current text chunk storage with book provenance
- 3D/2D graph visualization components
- Entity extraction and relationship detection pipelines

### External Dependencies

- None - this is a self-contained extension of the existing system

## Open Questions *(optional)*

- How do we handle contradictory edits from different domain experts? (Voting system? Trust scores?)
- Should pattern discovery use graph isomorphism algorithms or approximate pattern matching?
- What granularity of edit history should we store? (Every keystroke vs. committed changes only)
- Should re-querying create new query versions or overwrite previous results?
- How do we visualize complex ontological patterns in an intuitive way?
