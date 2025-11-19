# Implementation Plan: Interactive GraphRAG Refinement System

**Branch**: `001-interactive-graphrag-refinement` | **Date**: 2025-11-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-interactive-graphrag-refinement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an end-to-end interpretable GraphRAG system where users can trace answers to source text chunks, interactively refine the knowledge graph by editing entities and relationships, discover cross-domain ontological patterns, and see the impact of graph refinements on answer quality through re-querying with before/after comparisons.

**Technical Approach**: Extend the existing Borges Library architecture (Next.js frontend on Vercel + Python Flask API on Railway + Neo4j database) with new features for provenance tracking, graph editing with versioning, pattern discovery algorithms, and query comparison interfaces. Leverage existing D3.js/3D-force-graph visualizations for edit interactions and existing nano-graphrag implementation for enhanced provenance capture.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.2.2 with Next.js 14.0.0
- Backend: Python 3.11+ with Flask 3.0.0

**Primary Dependencies**:
- Frontend: React 18.2, D3.js 7.8.5, 3D-force-graph 1.79.0, TailwindCSS 3.3.5
- Backend: Flask-CORS 4.0.0, neo4j 5.14.0, httpx 0.25.1, nano-graphrag (current version in repo)

**Storage**: Neo4j AURA Database (relationship edits, provenance chains, edit history), Railway data volume (book_data mounted from local)

**Testing**: - for testing, use pytest for backend, & React Testing Library for frontend. **No mock data should be generated for testing, use only read data**. Also use the Playwright MCP for interface testing. 

**Target Platform**:
- Frontend: Vercel (serverless deployment)
- Backend: Railway (containerized Python)
- Database: Neo4j AuraDB 

**Project Type**: Web application (frontend + backend)

**Performance Goals**:
- Provenance trace: <500ms to load full chain (answer → chunks)
- Graph edits: <1 second to persist and reflect in UI
- Re-query: <3 seconds to compare before/after answers
- Pattern discovery: <30 seconds for 10k entity graph
- Visualization: 30+ FPS for up to 1000 nodes

**Constraints**:
- Railway memory limits (~512MB-1GB per service)
- Vercel serverless function timeout (10s for hobby, 60s for pro)
- Neo4j query performance (<200ms for single-hop relationships)
- Book data volume size limits on Railway

**Scale/Scope**:
- Initial: 20-50 books in corpus
- Users: Research teams (10-100 concurrent users)
- Graph size: 10k-100k entities, 50k-500k relationships
- Edits: Support 1000+ manual edits with full history
- Patterns: Discover 10-50 meaningful cross-domain motifs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: End-to-End Interpretability ✅

**Status**: PASS - Core feature requirement

This feature is designed specifically to achieve principle I:
- FR-001: Display full provenance (answer → entities → relationships → text chunks)
- FR-007: Click-through navigation across entire pipeline
- User Story 1 (P1): Trace GraphRAG answer to source knowledge

**Implementation alignment**:
- Provenance Chain entity captures complete reasoning path
- Neo4j will store bidirectional links between chunks, entities, and answers
- UI will provide navigation from any answer element to its sources

### Principle II: Babel Library Mimetism (Infinite Exploration Architecture) ✅

**Status**: PASS - Enhanced by pattern discovery and graph editing

This feature extends principle II:
- Graph editing enables exploration through refinement (no dead ends)
- Pattern discovery surfaces emergent meaning from chaos
- Re-querying creates infinite exploration through iterative refinement
- User Story 4 (P2): Discover ontological patterns across domains

**Implementation alignment**:
- Pattern discovery (FR-006) identifies emergent thematic clusters
- Edit-requery loop creates progressive revelation through user interaction
- No terminal nodes: every entity can be edited → explored further

### Principle III: No Orphan Nodes ✅

**Status**: PASS - Enforced in existing system, maintained in edits

FR-010 validates graph consistency including no dangling references. When editing relationships, validation will ensure no nodes become orphaned.

**Implementation alignment**:
- Existing reconciliation API already filters orphan nodes
- Edit validation will check relationship count before allowing deletions
- Pattern discovery will ignore orphan nodes by definition (requires relationships)

### Principle IV: Book-Centric Architecture ✅

**Status**: PASS - Maintained through provenance links

All entities, relationships, and text chunks maintain book source attribution:
- Provenance Chain entity includes book_id for all source chunks
- Pattern discovery can group findings by source books
- Edit history records which books are affected by changes

**Implementation alignment**:
- Existing text chunk storage preserves book provenance (confirmed in architecture)
- FR-001 requires "book source and page location" for all chunks
- Pattern discovery will report cross-book frequency

### Principle V: Inter-Book Knowledge Exploration ✅

**Status**: PASS - Core value of pattern discovery

User Story 4 (P2) explicitly discovers cross-domain patterns:
- "recurring relationship structures across seemingly unrelated domains"
- FR-006: Pattern discovery across multiple books/disciplines
- SC-004: Identify patterns in corpus of 20+ books

**Implementation alignment**:
- Pattern discovery algorithm will prioritize cross-book relationships
- Ontological Pattern entity tracks cross_domain_count
- Visualizations will highlight inter-book bridges

### Gate Decision: ✅ PASS

All 5 constitutional principles are satisfied. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-interactive-graphrag-refinement/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── provenance-api.yaml
│   ├── edit-api.yaml
│   ├── pattern-api.yaml
│   └── query-comparison-api.yaml
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Selected Structure**: Web application (existing architecture)

```text
3_borges-interface/                    # Next.js frontend (Vercel)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── provenance/         # NEW: Provenance tracing endpoints
│   │   │   ├── edits/              # NEW: Graph edit operations
│   │   │   └── patterns/           # NEW: Pattern discovery
│   │   └── page.tsx
│   ├── components/
│   │   ├── BorgesLibrary.tsx       # EXISTING: Main interface
│   │   ├── GraphVisualization3DForce.tsx  # EXISTING: 3D graph
│   │   ├── ProvenancePanel.tsx     # NEW: Provenance display
│   │   ├── EditRelationshipModal.tsx  # NEW: Edit interface
│   │   ├── PatternDiscoveryPanel.tsx  # NEW: Pattern results
│   │   ├── QueryComparison.tsx     # NEW: Before/after diff
│   │   └── TextChunkModal.tsx      # EXISTING: Enhanced for provenance
│   ├── lib/
│   │   ├── services/
│   │   │   ├── reconciliation.ts   # EXISTING: Enhanced with edit/provenance
│   │   │   ├── provenance.ts       # NEW: Provenance tracing service
│   │   │   ├── edits.ts            # NEW: Edit operations service
│   │   │   └── patterns.ts         # NEW: Pattern discovery service
│   │   └── utils/
│   │       ├── colorService.ts     # EXISTING
│   │       ├── graphHighlight.ts   # EXISTING
│   │       └── diff.ts             # NEW: Answer comparison utility
│   └── types/
│       ├── provenance.ts           # NEW: Provenance types
│       ├── edit.ts                 # NEW: Edit operation types
│       └── pattern.ts              # NEW: Pattern types
└── package.json

reconciliation-api/                    # Python Flask API (Railway)
├── reconciliation_api.py           # EXISTING: Enhanced with new endpoints
├── endpoints/
│   ├── provenance.py               # NEW: Provenance tracking
│   ├── edits.py                    # NEW: Graph edit operations
│   ├── patterns.py                 # NEW: Pattern discovery
│   └── query_comparison.py         # NEW: Re-query comparison
├── services/
│   ├── neo4j_client.py             # EXISTING: Enhanced for edits
│   ├── provenance_tracker.py       # NEW: Provenance chain builder
│   ├── edit_manager.py             # NEW: Edit versioning & validation
│   ├── pattern_detector.py         # NEW: Ontological pattern discovery
│   └── query_comparator.py         # NEW: Answer comparison logic
├── models/
│   ├── provenance_chain.py         # NEW: Provenance data model
│   ├── graph_edit.py               # NEW: Edit history model
│   └── ontological_pattern.py      # NEW: Pattern model
├── graphrag_interceptor.py         # EXISTING: Enhanced for provenance capture
├── requirements.txt                # EXISTING: Add pattern matching libs
└── tests/
    ├── test_provenance.py          # NEW
    ├── test_edits.py               # NEW
    └── test_patterns.py            # NEW

book_data/                             # EXISTING: Mounted as Railway volume
└── [book_folders]/                    # Unchanged

.specify/
└── [configuration files]              # Project management

```

**Structure Decision**: Extend the existing web application architecture (3_borges-interface + reconciliation-api) rather than creating new services. This minimizes deployment complexity and leverages existing Neo4j connections, GraphRAG integration, and visualization components.

**Key Integration Points**:
1. Frontend makes API calls to new provenance/edit/pattern endpoints on Railway
2. Railway API extends existing Neo4j queries for edit storage and provenance
3. Existing D3.js/3D-force-graph components gain edit interaction handlers
4. Existing reconciliation layer enhanced to track provenance during queries

## Complexity Tracking

**No constitutional violations detected.**

Constitution Check passed all 5 principles. Proceed to Phase 0.
