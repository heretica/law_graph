# Data Model: Interactive GraphRAG Refinement System

**Feature**: 001-interactive-graphrag-refinement
**Date**: 2025-11-18
**Status**: In Progress - Revised with actual Neo4j schema

## Overview

This document defines the Neo4j graph schema extensions for provenance tracking, graph editing, pattern discovery, and query versioning. Builds on the existing Borges Library schema retrieved from the live Neo4j database.

---

## Neo4j Schema

### Node Labels

#### Existing Nodes (from Live Neo4j Database)

**Note**: Schema retrieved via MCP neo4j-cypher tool on 2025-11-18.

```cypher
// Core Entity Node (21,923 nodes)
(:Entity {
  id: string,                  // Unique entity identifier (indexed)
  name: string,                // Entity name (indexed)
  entity_type: string,         // Type: PERSON, CONCEPT, EVENT, GEO, ORGANIZATION,
                               // TECHNOLOGY, LOCATION, FOOD, ROLE, etc. (indexed)
  description: string,         // Entity description
  source_id: string,           // Source identifier
  book_dir: string,            // Book directory (indexed)
  observations: [string],      // List of observations about entity
  clusters: string             // Cluster information (JSON string)
})

// Specific Entity Type Labels (inherit Entity properties)
(:PERSON), (:CONCEPT), (:EVENT), (:GEO), (:ORGANIZATION), (:TECHNOLOGY),
(:LOCATION), (:FOOD), (:ROLE), (:UNKNOWN), (:ANIMAL), (:NATURE), etc.

// Book Node (labeled as BOOK, not Book)
(:BOOK {
  id: string,                  // Book identifier
  name: string,                // Full book name (e.g., "LIVRE_Premier de cordée")
  title: string,               // Book title
  author: string,              // Author name
  entity_type: "BOOK",         // Always "BOOK"
  description: string,         // Book description
  working_dir: string,         // Working directory path
  book_dir: string,            // Book directory name
  source_id: string,           // Source identifier
  migrated_at: datetime,       // Migration timestamp
  observations: [string],      // Observations list
  clusters: string             // Cluster information
})

// Community Node (354 nodes)
(:Community {
  id: string,                  // Community identifier (indexed)
  title: string,               // Community title (indexed)
  level: int,                  // Hierarchy level (indexed)
  report: string,              // Community summary report
  full_content: string,        // Full community content
  full_content_json: string,   // JSON representation
  rank: float,                 // Community rank score
  rank_explanation: string,    // Explanation of ranking
  observations: [string]       // Observations list
})
```

**Important**: No Chunk nodes exist in the current schema. Text chunks are not stored as separate nodes.

#### New Nodes for Interactive Refinement

```cypher
(:Query {
  id: string,                // "query-<uuid>"
  question: string,          // User's original question
  answer_text: string,       // GraphRAG generated answer
  timestamp: datetime,       // When query was executed
  version: int,              // Query version number (1, 2, 3...)
  parent_query_id: string,   // Previous version ID (null for v1)
  mode: string,              // "local" or "global" GraphRAG mode
  book_context: [string],    // Books queried
  user_id: string,           // User who submitted query
  status: string             // "active", "superseded", "archived"
})

(:QueryResult {
  id: string,                // "result-<uuid>"
  query_id: string,          // Link to Query node
  timestamp: datetime,       // When result was generated
  execution_time_ms: int,    // Query execution duration
  entity_count: int,         // Number of entities used
  relationship_count: int,   // Number of relationships traversed
  community_count: int       // Number of communities referenced
})

(:GraphEdit {
  id: string,                // "edit-<uuid>"
  edit_type: string,         // "entity_add", "entity_delete", "relationship_add",
                             // "relationship_modify", "relationship_delete"
  target_id: string,         // ID of entity/relationship being edited
  old_value: string,         // JSON of previous state
  new_value: string,         // JSON of new state
  justification: string,     // User's explanation for edit
  editor_id: string,         // User who made edit
  timestamp: datetime,       // When edit was made
  applied: boolean,          // Whether edit is currently active
  validation_status: string  // "valid", "conflict", "rolled_back"
})

(:OntologicalPattern {
  id: string,                // "pattern-<uuid>"
  pattern_name: string,      // Human-readable name
  motif_structure: string,   // Pattern signature (e.g., "PERSON-INFLUENCES->CONCEPT-APPEARS_IN->BOOK")
  frequency: int,            // Total occurrences across all books
  cross_domain_count: int,   // Number of different books containing pattern
  significance_score: float, // Statistical significance (0.0-1.0)
  discovered_at: datetime,   // When pattern was discovered
  saved_by: string,          // User who saved pattern (if saved)
  description: string        // Pattern description/interpretation
})

(:PatternInstance {
  id: string,                // "instance-<uuid>"
  pattern_id: string,        // Link to OntologicalPattern
  book_id: string,           // Book where instance appears
  entity_ids: [string],      // List of entity IDs in this instance
  subgraph_hash: string,     // Hash of subgraph structure
  context: string            // Text context around pattern
})
```

---

### Relationship Types

#### Existing Relationships (from Live Neo4j Database)

**Note**: Relationship schema retrieved via MCP neo4j-cypher tool on 2025-11-18.

```cypher
// Book to Entity (primary containment relationship)
(BOOK)-[:CONTAINS_ENTITY {
  description: string,         // Description of entity in book context
  weight: float,               // Importance weight
  source_id: string            // Source reference
}]->(Entity)

// Entity to Entity (main relationship type)
(Entity)-[:RELATED_TO {
  description: string,         // Relationship description
  weight: float,               // Relationship strength
  book_dir: string,            // Book directory where relationship appears
  source_id: string,           // Source reference
  mentioned_in_report: boolean,// Whether mentioned in community report
  order: int,                  // Order in sequence
  // Additional French properties used in some cases:
  élément_clé: string,        // Key element
  entity_name: string,         // Entity name reference
  author: string,              // Author
  résultat: string,           // Result
  découverte: string,         // Discovery
  impact: string,              // Impact
  rôle: string,               // Role
  méthode: string,            // Method
  contexte: string,            // Context
  paragraphe: string          // Paragraph reference
}]->(Entity)

// Also: (Entity)-[:RELATED_TO]->(BOOK) exists for some entities

// Community to Entity
(Community)-[:CONTAINS {
  mentioned_in_report: boolean,// Whether entity mentioned in community report
  entity_name: string          // Entity name
}]->(Entity)
```

**Important**:
- No EXTRACTED_FROM relationships to Chunk nodes (Chunk nodes don't exist)
- No FROM_BOOK relationships (no Chunk nodes)
- Books are connected to entities directly via CONTAINS_ENTITY

#### New Relationships for Provenance & Editing

```cypher
// Query Provenance Chain
(Query)-[:PRODUCED_RESULT]->(QueryResult)

(QueryResult)-[:USED_ENTITY {
  rank: int,                 // Entity importance rank (1, 2, 3...)
  relevance_score: float,    // Relevance to query (0.0-1.0)
  order: int,                // Order entity was accessed
  contribution: string       // How entity contributed ("direct_match", "context", "community_member")
}]->(Entity)

(QueryResult)-[:TRAVERSED_RELATIONSHIP {
  order: int,                // Traversal order
  weight: float,             // Relationship weight in query
  hop_distance: int          // Distance from query seed entities (1, 2, 3...)
}]->(Entity)
// Note: TRAVERSED_RELATIONSHIP points to source entity;
// actual relationship is the existing edge between entities

(QueryResult)-[:CITED_COMMUNITY {
  relevance_score: float,    // Community relevance to query
  summary_used: string       // Which part of summary was used
}]->(Community)

(QueryResult)-[:SOURCED_FROM_BOOK {
  book_relevance: float,     // Book relevance to query
  section_referenced: string // Which section/part was most relevant
}]->(BOOK)

// Query Versioning & Edit History
(Query)-[:REVISED_TO {
  edit_type: string,         // "manual_refinement", "pattern_applied", "rollback"
  timestamp: datetime,
  change_summary: string,    // High-level description of changes
  changed_by: string         // User ID
}]->(Query)

(Query)-[:INFLUENCED_BY_EDIT {
  applied_at: datetime,
  impact_level: string       // "major", "minor", "none"
}]->(GraphEdit)

// Graph Edit Relationships
(GraphEdit)-[:MODIFIES_ENTITY]->(Entity)

(GraphEdit)-[:MODIFIES_RELATIONSHIP]->(Entity)
// Points to source entity of the modified relationship

(GraphEdit)-[:CONFLICTS_WITH]->(GraphEdit)
// When multiple edits conflict

// Pattern Discovery Relationships
(OntologicalPattern)-[:HAS_INSTANCE]->(PatternInstance)

(PatternInstance)-[:CONTAINS_ENTITY]->(Entity)

(PatternInstance)-[:IN_BOOK]->(Book)

(OntologicalPattern)-[:DISCOVERED_IN_QUERY]->(Query)
// If pattern was discovered during query analysis

// User Annotations
(Entity)-[:MANUALLY_ADDED {
  added_by: string,
  timestamp: datetime,
  justification: string
}]->(Entity)
// For user-created entities

(Entity)-[:MANUALLY_LINKED {
  added_by: string,
  timestamp: datetime,
  relationship_type: string,
  justification: string
}]->(Entity)
// For user-created relationships
```

---

## Indexes & Constraints

```cypher
// Primary Key Constraints
CREATE CONSTRAINT query_id_unique IF NOT EXISTS FOR (q:Query) REQUIRE q.id IS UNIQUE;
CREATE CONSTRAINT query_result_id_unique IF NOT EXISTS FOR (qr:QueryResult) REQUIRE qr.id IS UNIQUE;
CREATE CONSTRAINT graph_edit_id_unique IF NOT EXISTS FOR (ge:GraphEdit) REQUIRE ge.id IS UNIQUE;
CREATE CONSTRAINT pattern_id_unique IF NOT EXISTS FOR (op:OntologicalPattern) REQUIRE op.id IS UNIQUE;
CREATE CONSTRAINT pattern_instance_id_unique IF NOT EXISTS FOR (pi:PatternInstance) REQUIRE pi.id IS UNIQUE;

// Performance Indexes
CREATE INDEX query_timestamp_idx IF NOT EXISTS FOR (q:Query) ON (q.timestamp);
CREATE INDEX query_user_idx IF NOT EXISTS FOR (q:Query) ON (q.user_id);
CREATE INDEX query_version_idx IF NOT EXISTS FOR (q:Query) ON (q.version);
CREATE INDEX query_status_idx IF NOT EXISTS FOR (q:Query) ON (q.status);

CREATE INDEX result_query_idx IF NOT EXISTS FOR (qr:QueryResult) ON (qr.query_id);
CREATE INDEX result_timestamp_idx IF NOT EXISTS FOR (qr:QueryResult) ON (qr.timestamp);

CREATE INDEX edit_timestamp_idx IF NOT EXISTS FOR (ge:GraphEdit) ON (ge.timestamp);
CREATE INDEX edit_editor_idx IF NOT EXISTS FOR (ge:GraphEdit) ON (ge.editor_id);
CREATE INDEX edit_applied_idx IF NOT EXISTS FOR (ge:GraphEdit) ON (ge.applied);
CREATE INDEX edit_target_idx IF NOT EXISTS FOR (ge:GraphEdit) ON (ge.target_id);

CREATE INDEX pattern_frequency_idx IF NOT EXISTS FOR (op:OntologicalPattern) ON (op.frequency);
CREATE INDEX pattern_significance_idx IF NOT EXISTS FOR (op:OntologicalPattern) ON (op.significance_score);
CREATE INDEX pattern_cross_domain_idx IF NOT EXISTS FOR (op:OntologicalPattern) ON (op.cross_domain_count);

CREATE INDEX instance_pattern_idx IF NOT EXISTS FOR (pi:PatternInstance) ON (pi.pattern_id);
CREATE INDEX instance_book_idx IF NOT EXISTS FOR (pi:PatternInstance) ON (pi.book_id);

// Composite Indexes for Common Queries
CREATE INDEX query_user_timestamp_idx IF NOT EXISTS FOR (q:Query) ON (q.user_id, q.timestamp);
CREATE INDEX edit_editor_timestamp_idx IF NOT EXISTS FOR (ge:GraphEdit) ON (ge.editor_id, ge.timestamp);
```

---

## Entity Relationships (from Feature Spec)

Mapping feature spec entities to Neo4j schema:

| Feature Spec Entity | Neo4j Implementation | Key Properties |
|---------------------|---------------------|----------------|
| **Entity** | `(:Entity)` | Existing + `manual_flag: boolean` added |
| **Relationship** | Edge with properties + `(:GraphEdit)` for history | `edit_history` stored in GraphEdit nodes |
| **Provenance Chain** | `(:Query)-[:PRODUCED_RESULT]->(:QueryResult)` + provenance edges | Complete chain via USED_ENTITY, TRAVERSED_RELATIONSHIP |
| **Graph Edit** | `(:GraphEdit)` | Full edit history with old/new values |
| **Ontological Pattern** | `(:OntologicalPattern)` + `(:PatternInstance)` | Pattern definition + concrete instances |
| **Query Iteration** | `(:Query)` with versioning | `version`, `parent_query_id` for iteration tracking |

---

## State Transitions

### Query Lifecycle

```
[User submits query]
      ↓
(:Query {version: 1, status: "active"})
      ↓
[:PRODUCED_RESULT]
      ↓
(:QueryResult)
      ↓
[:USED_ENTITY, :TRAVERSED_RELATIONSHIP, :CITED_COMMUNITY]
      ↓
(Provenance graph built)
      ↓
[User edits graph]
      ↓
(:GraphEdit {applied: true})
      ↓
[User re-runs query]
      ↓
(:Query {version: 2, parent_query_id: v1_id, status: "active"})
[:REVISED_TO]
      ↓
(Previous query status → "superseded")
```

### Edit Lifecycle

```
[User initiates edit]
      ↓
(:GraphEdit {validation_status: "pending"})
      ↓
[Validation checks: consistency, no orphans]
      ↓
{valid} → (:GraphEdit {applied: true, validation_status: "valid"})
          [:MODIFIES_ENTITY] or [:MODIFIES_RELATIONSHIP]
          ↓
          (Graph structure updated)

{conflict} → (:GraphEdit {applied: false, validation_status: "conflict"})
             [:CONFLICTS_WITH]->(Other :GraphEdit)

[User rolls back]
      ↓
(:GraphEdit {applied: false, validation_status: "rolled_back"})
```

### Pattern Discovery Lifecycle

```
[User requests pattern discovery]
      ↓
(Analyze graph for recurring motifs)
      ↓
(:OntologicalPattern {frequency: N, cross_domain_count: M})
      ↓
[:HAS_INSTANCE]
      ↓
(:PatternInstance) for each occurrence
[:CONTAINS_ENTITY]->(Entity)
[:IN_BOOK]->(Book)
      ↓
[User saves pattern]
      ↓
(:OntologicalPattern {saved_by: user_id})
```

---

## Validation Rules

### Graph Consistency (FR-010)

1. **No Orphan Nodes** (Constitutional Principle III):
   ```cypher
   // Before deleting relationship, check entity degree
   MATCH (e:Entity {id: $entity_id})
   RETURN size((e)-[]-()) as degree
   // If degree would become 0, reject deletion
   ```

2. **No Dangling References**:
   ```cypher
   // Validate edit target exists
   MATCH (target) WHERE target.id = $target_id
   // If not found, reject edit
   ```

3. **Relationship Consistency**:
   ```cypher
   // Ensure relationship source and target are valid entities
   MATCH (source:Entity {id: $source_id})
   MATCH (target:Entity {id: $target_id})
   // Both must exist before creating relationship
   ```

### Edit Conflict Detection (FR-013)

```cypher
// Check for concurrent edits to same entity/relationship
MATCH (edit1:GraphEdit {target_id: $target_id, applied: true})
WHERE edit1.timestamp > $last_sync_timestamp
  AND edit1.id <> $current_edit_id
RETURN edit1
// If found, flag as conflict
```

---

## Query Patterns

### Common Read Operations

#### 1. Get Full Provenance for Query
```cypher
MATCH (q:Query {id: $query_id})-[:PRODUCED_RESULT]->(qr:QueryResult)
MATCH (qr)-[ue:USED_ENTITY]->(e:Entity)
OPTIONAL MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e)
OPTIONAL MATCH (qr)-[:CITED_COMMUNITY]->(comm:Community)
RETURN q.question, q.answer_text,
       collect(DISTINCT {
         entity: e.name,
         entity_type: e.entity_type,
         entity_id: e.id,
         rank: ue.rank,
         description: e.description,
         book_title: b.title,
         book_author: b.author,
         book_id: b.id
       }) as entities,
       collect(DISTINCT {
         community: comm.id,
         title: comm.title,
         summary: comm.report
       }) as communities
```

#### 2. Get Query Version History
```cypher
MATCH path = (current:Query {id: $query_id})-[:REVISED_TO*0..]->(ancestor:Query)
RETURN nodes(path) as version_chain,
       [r IN relationships(path) | properties(r)] as edits_between
ORDER BY ancestor.version
```

#### 3. Get Edit History for Entity
```cypher
MATCH (e:Entity {id: $entity_id})<-[:MODIFIES_ENTITY]-(edit:GraphEdit)
WHERE edit.applied = true
RETURN edit
ORDER BY edit.timestamp DESC
```

#### 4. Find Patterns Containing Entity
```cypher
MATCH (e:Entity {id: $entity_id})<-[:CONTAINS_ENTITY]-(pi:PatternInstance)
MATCH (pi)-[:HAS_INSTANCE]-(pattern:OntologicalPattern)
RETURN pattern.pattern_name,
       pattern.frequency,
       pattern.cross_domain_count,
       collect(pi.book_id) as books_where_appears
```

### Common Write Operations

#### 1. Create Query with Provenance
```cypher
// Create query and result
CREATE (q:Query {
  id: $query_id,
  question: $question,
  answer_text: $answer,
  timestamp: datetime(),
  version: 1,
  mode: $mode,
  user_id: $user_id,
  status: "active"
})
CREATE (qr:QueryResult {
  id: $result_id,
  query_id: $query_id,
  timestamp: datetime(),
  entity_count: $entity_count,
  relationship_count: $rel_count
})
CREATE (q)-[:PRODUCED_RESULT]->(qr)

// Link to used entities (batch)
UNWIND $used_entities as ue
MATCH (e:Entity {id: ue.entity_id})
CREATE (qr)-[:USED_ENTITY {
  rank: ue.rank,
  relevance_score: ue.score,
  order: ue.order
}]->(e)
```

#### 2. Apply Graph Edit
```cypher
// Create edit record
CREATE (edit:GraphEdit {
  id: $edit_id,
  edit_type: $edit_type,
  target_id: $target_id,
  old_value: $old_value,
  new_value: $new_value,
  justification: $justification,
  editor_id: $editor_id,
  timestamp: datetime(),
  applied: true,
  validation_status: "valid"
})

// Modify target (example: relationship type change)
MATCH (source:Entity {id: $source_id})-[r]->(target:Entity {id: $target_id})
WHERE type(r) = $old_relationship_type
CREATE (source)-[new_r:NEW_TYPE]->(target)
SET new_r = properties(r)
DELETE r
CREATE (edit)-[:MODIFIES_RELATIONSHIP]->(source)
```

#### 3. Save Discovered Pattern
```cypher
CREATE (pattern:OntologicalPattern {
  id: $pattern_id,
  pattern_name: $name,
  motif_structure: $structure,
  frequency: $frequency,
  cross_domain_count: $domain_count,
  significance_score: $significance,
  discovered_at: datetime(),
  saved_by: $user_id
})

// Create instances
UNWIND $instances as inst
CREATE (pi:PatternInstance {
  id: inst.id,
  pattern_id: $pattern_id,
  book_id: inst.book_id,
  entity_ids: inst.entity_ids,
  subgraph_hash: inst.hash
})
CREATE (pattern)-[:HAS_INSTANCE]->(pi)
WITH pi, inst
UNWIND inst.entity_ids as eid
MATCH (e:Entity {id: eid})
CREATE (pi)-[:CONTAINS_ENTITY]->(e)
```

---

## Performance Considerations

1. **Provenance Retrieval**: Use composite indexes on (query_id, timestamp) for fast version chains
2. **Edit History**: Denormalize frequently accessed data (e.g., store entity names on USED_ENTITY relationship)
3. **Pattern Discovery**: Pre-compute pattern frequencies during off-peak hours
4. **Query Caching**: Cache recent queries in Redis for <100ms retrieval
5. **Pagination**: Limit provenance depth to 3 hops from Query node to prevent graph explosion

---

## Migration from Existing Schema

The data model extends the existing Borges Library schema without breaking changes:

1. **Backward Compatible**: All existing nodes (Entity, Chunk, Book, Community) unchanged
2. **Additive Only**: New nodes (Query, QueryResult, GraphEdit, OntologicalPattern) added
3. **Relationship Extensions**: New relationship types do not conflict with existing ones
4. **Index Addition**: New indexes created without modifying existing ones

### Migration Script Outline

```cypher
// Step 1: Create constraints
[Run all CREATE CONSTRAINT statements]

// Step 2: Create indexes
[Run all CREATE INDEX statements]

// Step 3: No data migration needed (additive schema)
// Existing Entity, Chunk, Book, Community nodes remain unchanged

// Step 4: Verify schema
CALL db.schema.visualization()
```

---

## Next Steps

With data model complete:
1. Generate API contracts (OpenAPI specs)
2. Create quickstart.md for developers
3. Update agent context with new schema
