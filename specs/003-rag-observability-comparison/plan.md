# Implementation Plan: Legal Graph Interface for RAG Observability

**Branch**: `003-rag-observability-comparison` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-rag-observability-comparison/spec.md`

## Summary

Build an interactive interface for exploring legal knowledge graph data, extending the existing 3_borges-interface to connect to the Law GraphRAG API. This enables users to:
- Query legal documents and visualize them in the 3D graph
- Select between different RAG backends (Dust vs Law GraphRAG)
- Trace provenance from RAG answers back to source legal documents

**Scope Note**: The RAG comparison/evaluation engine (OPIK experiments, metrics, LLM judge) is being developed separately in the `law-graphRAG-reconciliation-api` repository. This plan focuses **only on the interface (User Story 0)**.

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 19.2.0, Next.js 16

**Primary Dependencies**:
- Tailwind CSS 3.3.5
- 3d-force-graph 1.79.0
- Three.js 0.181.0
- D3 7.8.5

**Storage**: None (interface only - data from external APIs)

**Testing**: Vitest (TypeScript)

**Target Platform**: Web (Desktop + Mobile responsive)

**Project Type**: Frontend extension of existing 3_borges-interface

**Performance Goals**:
- Interface responsiveness: 30fps graph rendering
- Query response display: <2 seconds

**Constraints**:
- Must reuse existing 3_borges-interface architecture
- Must integrate with law-graphRAG-reconciliation-api
- Must maintain mobile-first responsive design

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. End-to-End Interpretability | ✅ Pass | Interface enables query→graph→source tracing |
| III. No Orphan Nodes | ✅ Pass | Graph filter inherited from 3_borges-interface |
| IV. Legal Document-Centric | ✅ Pass | Documents anchor graph queries |
| VII. Functional Legal Interface | ✅ Pass | Minimalist design inherited |
| VIII. Mobile-First | ✅ Pass | Responsive design inherited |
| IX. RAG Observability | ✅ Pass | Interface supports observability via backend selection |

**Gate Status**: ✅ PASSED

## Project Structure

### Documentation (this feature)

```text
specs/003-rag-observability-comparison/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Frontend (extend existing 3_borges-interface)
3_borges-interface/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── law-graphrag/       # NEW: Law GraphRAG API proxy
│   │           └── route.ts
│   ├── components/
│   │   ├── BorgesLibrary.tsx       # MODIFY: Add RAG source selector state
│   │   ├── QueryInterface.tsx      # MODIFY: Add Law GraphRAG toggle
│   │   └── RAGSourceSelector.tsx   # NEW: Backend selector UI component
│   ├── lib/
│   │   └── services/
│   │       └── law-graphrag.ts     # NEW: Law GraphRAG API client
│   └── types/
│       └── law-graphrag.ts         # NEW: Law GraphRAG types
└── .env.local                      # Add LAW_GRAPHRAG_API_URL
```

**Structure Decision**: Minimal frontend extension. Reuse existing graph visualization, add API proxy and source selector. No backend changes needed in this repo - the Law GraphRAG API is external.

## Out of Scope (Handled Elsewhere)

The following are being developed in `law-graphRAG-reconciliation-api`:
- OPIK experiment framework
- Dust API integration for comparison
- Heuristic metrics (Contains, Equals, RegexMatch)
- LLM-as-judge evaluation
- Experiment dashboard

## Complexity Tracking

> **No violations requiring justification** - Minimal scope.

| Concern | Resolution |
|---------|------------|
| API configuration | Environment variable for Law GraphRAG API URL |
| Existing component modifications | Minimal changes - add state and toggle |
