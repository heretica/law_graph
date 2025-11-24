# Implementation Plan: Interactive GraphRAG Refinement System

**Branch**: `001-interactive-graphrag-refinement` | **Date**: 2025-11-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-interactive-graphrag-refinement/spec.md`

## Summary

Build an end-to-end interpretable GraphRAG system that enables users to trace answers back to source text chunks, allows administrators to add new books via the nano-graphRAG pipeline (admin-only, schema-consistent), enables interactive graph refinement by domain experts, and provides answer comparison after edits.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5.2.2 (frontend)
**Primary Dependencies**: Flask 3.0.0, neo4j 5.14.0, nano-graphrag >=0.0.4, Next.js 14.2.0, 3d-force-graph
**Storage**: Neo4j 5.14+ (graph), JSON KV stores (caches, embeddings), GraphML (book data)
**Testing**: pytest (backend), TypeScript strict mode (frontend type checking)
**Target Platform**: Web application (Vercel frontend, Railway backend)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Graph queries <2s, API responses <200ms, visualization ≥30fps for 500 nodes
**Constraints**: Book processing <10 minutes (300 pages), rollback <30 seconds
**Scale/Scope**: 8+ books, 10,000+ entities, multi-user concurrent access

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Implementation |
|-----------|-------------|--------|----------------|
| **I. End-to-end interpretability** | Navigation from chunks to RAG answers | ✅ PASS | US1: Provenance chains, click-through navigation |
| **II. Babel Library Mimetism** | Infinite exploration, progressive discovery | ✅ PASS | Progressive loading 300→500→1000 nodes, centrality-based |
| **III. No Orphan Nodes** | All displayed nodes have relationships | ✅ PASS | API filters exclude nodes with zero relationships |
| **IV. Book-centric Architecture** | Books as core entities in all queries | ✅ PASS | All queries anchor on book nodes |
| **V. Inter-book Exploration** | Prioritize cross-book relationships | ✅ PASS | Ranking weights favor inter-book connections |
| **VI. Extensible Literature Foundation** | nano-graphRAG foundation, easy book addition | ✅ PASS | US2: Admin-only CLI ingestion, schema consistency |

**All 6 constitutional principles satisfied.**

## Project Structure

### Documentation (this feature)

```text
specs/001-interactive-graphrag-refinement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API specifications)
│   ├── provenance-api.yaml
│   ├── edit-api.yaml
│   ├── pattern-api.yaml
│   ├── query-comparison-api.yaml
│   └── book-ingestion-api.yaml  # NEW: Admin book addition
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)

reconciliation-api/                  # Flask Backend
├── reconciliation_api.py            # Main Flask application
├── graphrag_interceptor.py          # GraphRAG query enrichment
├── endpoints/
│   ├── books.py                     # Book management (admin)
│   ├── provenance.py                # Provenance tracking
│   ├── edits.py                     # Graph edit operations
│   └── ingestion.py                 # NEW: Book ingestion (admin-only)
├── models/
│   ├── query.py                     # Query models
│   ├── graph_edit.py                # Edit models
│   ├── book_ingestion.py            # NEW: Ingestion job model
│   └── ontological_pattern.py       # Pattern models
├── services/
│   ├── neo4j_client.py              # Neo4j operations
│   ├── provenance_tracker.py        # Answer lineage
│   ├── book_ingestion_service.py    # NEW: nano-graphRAG pipeline
│   └── validation.py                # Data validation
├── cli/                             # NEW: Admin CLI commands
│   └── ingest_book.py               # Book ingestion CLI
└── test/

3_borges-interface/                  # Next.js Frontend
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── reconciliation/
│   │   │   ├── graphrag/
│   │   │   └── books/
│   │   └── page.tsx
│   ├── components/
│   │   ├── GraphVisualization3D.tsx
│   │   ├── ProvenancePanel.tsx      # US1: Provenance display
│   │   ├── EditModal.tsx            # US3: Relationship editing
│   │   ├── ComparisonView.tsx       # US4: Answer comparison
│   │   └── ...
│   ├── types/
│   │   ├── provenance.ts
│   │   ├── edit.ts
│   │   └── pattern.ts
│   └── hooks/
└── package.json

book_data/                           # Book storage (mounted volume)
├── [existing books]/
└── [new books added via US2]/
```

**Structure Decision**: Web application with Flask backend + Next.js frontend. Backend handles all nano-graphRAG integration, Neo4j queries, and admin operations. Frontend provides interactive visualization and user interactions.

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale |
|----------|-----------|
| Admin-only book ingestion | Protects graph integrity from public modifications (Constitution VI) |
| Schema consistency enforcement | Ensures new books match existing Neo4j model (Constitution VI) |
| CLI + API for book ingestion | Supports both manual admin use and automation workflows |

## User Story Mapping

| User Story | Priority | Key Components |
|------------|----------|----------------|
| US1: Trace graphRAG to source | P1 | Provenance API, click-through navigation, attribution graph |
| US2: Add new books (admin) | P1 | nano-graphRAG pipeline, CLI tool, schema validation |
| US3: Edit graph relationships | P1 | Edit API, modal UI, edit history, rollback |
| US4: Re-query after refinement | P1 | Query comparison API, diff visualization |

## Key Technical Decisions

### nano-graphRAG Integration (US2)

The book ingestion pipeline leverages nano-graphRAG for:
1. **Text chunking**: Split book content into semantic chunks
2. **Entity extraction**: Identify entities using LLM
3. **Relationship building**: Extract relationships between entities
4. **Community detection**: Build hierarchical communities
5. **Vector embeddings**: Generate entity embeddings for semantic search

**Schema Consistency Requirements**:
- Node labels: `Entity`, `Chunk`, `Book`, `Community`
- Relationship types: `RELATED_TO`, `MENTIONS`, `BELONGS_TO`, `PART_OF`
- Properties: Match existing Neo4j schema exactly
- Provenance: All new content links back to book source

### Admin Access Control (US2)

- Book ingestion endpoints require admin authentication
- No UI exposure of book addition to public users
- CLI tool for batch processing

### Graph Edit System (US3)

- Optimistic locking for concurrent edit handling
- Full audit trail with rollback capability
- Validation against graph consistency rules
