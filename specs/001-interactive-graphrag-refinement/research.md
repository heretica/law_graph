# Research: Interactive GraphRAG Refinement System

**Feature**: 001-interactive-graphrag-refinement
**Date**: 2025-11-18
**Status**: Complete

## Overview

This document resolves technical clarifications identified in the Technical Context section of plan.md. Research covers testing frameworks, pattern discovery algorithms, provenance storage patterns, and answer comparison approaches.

## 1. Testing Framework

**Decision**: Jest + React Testing Library for frontend, pytest + testcontainers for backend

**Rationale**:
- **Frontend**: Jest and React Testing Library are the official Next.js recommendations with excellent ecosystem support for Next.js 14
- **Backend**: pytest is the Python standard with mature async support, and testcontainers-python provides containerized Neo4j instances for isolated testing
- Both frameworks have strong community support and align with existing TypeScript/Python ecosystem

**Implementation Details**:

### Frontend (3_borges-interface):
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom jest-canvas-mock canvas
```

### Backend (reconciliation-api):
```bash
pip install pytest pytest-asyncio pytest-flask testcontainers[neo4j] pytest-cov httpx
```

**Key considerations**:
- D3.js/3D visualization testing: Test DOM output, mock WebGL/Canvas context
- Neo4j testing: Use testcontainers for integration tests, mock neo4j.Driver for unit tests
- Flask async testing: Use pytest-asyncio with httpx.AsyncClient

**Alternatives Considered**:
- **Vitest**: Faster than Jest but less mature for complex WebGL mocking
- **unittest**: pytest has superior fixture system and async support

---

## 2. Pattern Discovery Algorithm

**Decision**: Custom Cypher queries + Python NetworkX for ontological pattern mining

**Rationale**:
- Neo4j APOC lacks dedicated frequent subgraph mining algorithms
- Scale (10k-100k entities across ~10 books) is manageable with targeted Cypher queries
- Custom approach leverages existing Neo4j property graph structure and book organization
- NetworkX provides in-memory pattern analysis and graph isomorphism

**Implementation Details**:

### Library/tool:
- **Neo4j APOC**: `apoc.path.subgraphAll`, `apoc.meta.subGraph` for subgraph extraction
- **Python**: NetworkX for pattern analysis
- **Optional**: Python gSpan for discovering completely novel patterns

### Pattern discovery approach:

1. **Extract book-specific subgraphs** per book using Cypher
2. **Find cross-book recurring patterns** (2-3 hop motifs)
3. **Rank by frequency and cross-domain coverage**

### Example Cypher query:
```cypher
// Find common 2-hop patterns across multiple books
MATCH (e1:Entity)-[r1]->(e2:Entity)-[r2]->(e3:Entity)
WITH e1.entity_type as t1, type(r1) as rel1,
     e2.entity_type as t2, type(r2) as rel2,
     e3.entity_type as t3,
     collect(DISTINCT e1.source_id) as books
WHERE size(books) >= 3  // Pattern appears in 3+ books
RETURN t1, rel1, t2, rel2, t3,
       size(books) as book_count,
       books
ORDER BY book_count DESC
```

**Performance**: Expected query time <5 seconds for 100k entities with proper indexing

**Alternatives Considered**:
- **VF2 graph isomorphism**: Good for exact matching but doesn't scale to frequent pattern mining
- **Pure gSpan**: Requires converting single large graph into transaction format
- **Neo4j GDS library**: Lacks motif discovery as of 2025

---

## 3. Provenance Storage

**Decision**: Hybrid approach with dedicated Query nodes linked to provenance chains

**Rationale**:
- Supports fast retrieval (<500ms) through indexed Query nodes
- Enables rollback by versioning query-entity relationships
- Maintains edit history through temporal properties
- Aligns with Neo4j best practices for data lineage

**Implementation Details**:

### Node types:
```cypher
(:Query {
  id: "query-<uuid>",
  question: "User's question",
  timestamp: datetime(),
  answer_text: "GraphRAG response",
  version: 1,
  parent_query_id: null  // For edited versions
})

(:QueryResult {
  id: "result-<uuid>",
  query_id: "query-<uuid>",
  timestamp: datetime()
})
```

### Relationship types:
```cypher
(Query)-[:PRODUCED_RESULT]->(QueryResult)
(QueryResult)-[:USED_ENTITY {
  rank: 1,
  relevance_score: 0.95,
  timestamp: datetime()
}]->(Entity)

(QueryResult)-[:TRAVERSED_RELATIONSHIP {
  order: 1,
  weight: 0.8
}]->(Entity)-[actual_rel]->(Entity)

(Entity)-[:EXTRACTED_FROM]->(Chunk)
(Chunk)-[:FROM_BOOK]->(Book)

// Edit history
(Query)-[:REVISED_TO {
  edit_type: "entity_added|relationship_modified",
  timestamp: datetime(),
  changed_by: "user_id"
}]->(Query)
```

### Fast retrieval query:
```cypher
// Single query retrieves entire chain
MATCH (q:Query {id: $query_id})-[:PRODUCED_RESULT]->(qr:QueryResult)
MATCH (qr)-[ue:USED_ENTITY]->(e:Entity)
OPTIONAL MATCH (e)-[ef:EXTRACTED_FROM]->(c:Chunk)
OPTIONAL MATCH (c)-[:FROM_BOOK]->(b:Book)
RETURN q.question, q.answer_text,
       collect({
         entity: e.name,
         chunk: c.content,
         book: b.title
       }) as provenance_chain
```

### Required indexes:
```cypher
CREATE INDEX query_id_idx FOR (q:Query) ON (q.id);
CREATE INDEX query_timestamp_idx FOR (q:Query) ON (q.timestamp);
CREATE INDEX result_query_idx FOR (qr:QueryResult) ON (qr.query_id);
```

**Performance**: <500ms retrieval with proper indexing

**Alternatives Considered**:
- **Embedded properties on relationships**: Faster but no versioning
- **Temporal graph with all-time properties**: More complex queries, harder rollback
- **Event sourcing with append-only log**: Better audit trail but slower query reconstruction

---

## 4. Answer Comparison

**Decision**: Hybrid approach: diff-match-patch for textual diff + sentence-transformers for semantic highlighting

**Rationale**:
- GraphRAG answers are natural language text where both surface-level and semantic changes matter
- diff-match-patch provides precise word/character-level diffs for display
- Semantic embeddings identify which entity/relationship edits caused meaningful answer changes
- Combination enables both syntactic diff display and causal attribution

**Implementation Details**:

### Libraries:
```bash
# Frontend
npm install diff-match-patch @types/diff-match-patch --save-dev

# Backend (for semantic analysis)
pip install sentence-transformers scikit-learn diff-match-patch
```

### Algorithm components:

1. **Textual diff** (Frontend - TypeScript):
   - Use diff-match-patch for word-level diff
   - Cleanup semantic noise with `diff_cleanupSemantic`
   - Identify changed entities from provenance

2. **Semantic comparison** (Backend - Python):
   - Use sentence-transformers (model: `all-MiniLM-L6-v2`) for sentence embeddings
   - Find semantically changed sentences (similarity < 0.8 threshold)
   - Attribute changes to entity/relationship edits
   - Compute overall answer similarity

3. **UI display**:
   - Side-by-side view for before/after comparison
   - Inline view with colored diff markers
   - Entity impact panel showing which edits caused which changes

**Performance**: <200ms for typical answers (5-10 sentences)

**Alternatives Considered**:
- **Pure Myers diff**: Fast but doesn't capture semantic meaning
- **Pure semantic similarity**: Doesn't show specific textual changes
- **GPT-4 for comparison**: Too slow and expensive for real-time comparison

---

## Summary Table

| Decision Area | Choice | Key Library/Tool | Scalability |
|--------------|--------|------------------|-------------|
| **Frontend Testing** | Jest + RTL | `@testing-library/react`, `jest-canvas-mock` | Good for 100s of tests |
| **Backend Testing** | pytest + testcontainers | `testcontainers[neo4j]`, `pytest-asyncio` | Excellent for integration tests |
| **Pattern Discovery** | Custom Cypher + NetworkX | `networkx`, `apoc.path.subgraphAll` | 10k-100k entities |
| **Provenance Storage** | Dedicated Query nodes | Native Neo4j with temporal properties | <500ms retrieval |
| **Answer Comparison** | diff-match-patch + sentence-transformers | `diff-match-patch`, `all-MiniLM-L6-v2` | <200ms for typical answers |

---

## Technology Stack Resolution

Based on research findings, the Technical Context "NEEDS CLARIFICATION" items are resolved:

**Testing**:
- Frontend: Jest 29+ with React Testing Library 14+, jest-canvas-mock for visualizations
- Backend: pytest 7+ with testcontainers-python 4+, pytest-asyncio for async tests

**Additional Dependencies**:
- Frontend: diff-match-patch 1.0.5
- Backend: sentence-transformers 2.3+, networkx 3.2+, diff-match-patch 20230430

These align with the existing technology stack (TypeScript 5.2.2, Python 3.11+, Neo4j 5.14+) and deployment targets (Vercel, Railway).

---

## Next Steps

Proceed to Phase 1: Design & Contracts
- Generate data-model.md with Neo4j schema
- Create API contracts for provenance, edit, pattern, and comparison endpoints
- Update agent context with new technologies
