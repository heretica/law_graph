# Implementation Plan: Grand Débat UI Consistency with Borges Interface

**Branch**: `004-ui-consistency` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ui-consistency/spec.md`

## Summary

Ensure the Grand Débat National interface maintains visual and behavioral consistency with the reference Borges Library interface (`nano-graphrag/3_borges-interface`), while using GraphML files instead of Neo4j for data loading. The implementation focuses on:
1. GraphML-based data loading (replacing Neo4j dependency)
2. Shared design system (Borges theme, colors, typography)
3. Identical 3D graph visualization behavior
4. Consistent query interface and provenance panel with civic context (commune attribution)

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.1, Next.js 16.0.7
**Primary Dependencies**: 3d-force-graph 1.79.0, Three.js 0.181.0, D3 7.8.5, Tailwind CSS 3.3.5
**Storage**: GraphML files (loaded into browser memory, no database required)
**Testing**: Visual regression testing, component testing with Jest/React Testing Library
**Target Platform**: Web (modern browsers), mobile-responsive
**Project Type**: Web application (frontend only, MCP server for AI queries)
**Performance Goals**: < 2s GraphML load, < 100ms graph interactions, 30fps minimum for 500 nodes
**Constraints**: < 3s FCP on 3G, 44px minimum touch targets, offline-capable after initial load
**Scale/Scope**: 50 communes, ~8,000+ entities, single-source interface

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. End-to-End Interpretability | PASS | Provenance panel with commune attribution maintains traceability |
| II. Civic Provenance Chain | PASS | Commune attribution replaces book attribution throughout |
| III. No Orphan Nodes | PASS | GraphML loading filters nodes without relationships |
| IV. Commune-Centric Architecture | PASS | GraphML structure preserves commune organization |
| V. Cross-Commune Civic Analysis | PASS | GraphML contains cross-commune data for regional patterns |
| VI. Single-Source Civic Data | PASS | GraphML files are the single data source (no Neo4j) |
| VII. Functional Civic Interface | PASS | Borges design system prioritizes content over chrome |
| VIII. Mobile-First Responsiveness | PASS | Responsive breakpoints and touch targets specified |
| IX. RAG Observability | PASS | Provenance panel exposes query tracing |

**Gate Status**: PASS - All principles satisfied. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/004-ui-consistency/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   └── graphml-schema.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
3_borges-interface/
├── src/
│   ├── app/                    # Next.js app router
│   │   └── api/
│   │       └── law-graphrag/   # MCP proxy route (existing)
│   ├── components/             # React components (19 existing)
│   │   ├── BorgesLibrary.tsx   # Main app component
│   │   ├── GraphVisualization3DForce.tsx  # 3D graph (key component)
│   │   ├── QueryInterface.tsx  # Query input/response
│   │   ├── ProvenancePanel.tsx # Provenance display
│   │   ├── EntityDetailModal.tsx  # Entity details with commune attribution
│   │   └── ...                 # Other components
│   ├── lib/
│   │   ├── services/           # Service layer
│   │   │   └── law-graphrag.ts # MCP client (existing)
│   │   └── utils/              # Utilities
│   │       └── graphml-parser.ts  # NEW: GraphML parsing
│   ├── types/                  # TypeScript types
│   │   └── graphml.ts          # NEW: GraphML type definitions
│   └── hooks/                  # React hooks
├── public/
│   └── data/                   # GraphML files
│       └── grand-debat.graphml # Civic data for 50 communes
├── tailwind.config.js          # Borges design tokens (existing)
└── package.json
```

**Structure Decision**: Web application with frontend-only architecture. GraphML files served as static assets, loaded and parsed in browser. MCP server used only for AI-powered queries.

## Complexity Tracking

> No violations requiring justification. Architecture is simpler than reference (GraphML vs Neo4j).

---

## Post-Design Constitution Re-Check

*Re-evaluation after Phase 1 design completion.*

| Principle | Status | Design Verification |
|-----------|--------|---------------------|
| I. End-to-End Interpretability | PASS | `data-model.md` defines ProvenanceChain with entities → relationships → chunks path |
| II. Civic Provenance Chain | PASS | GraphMLNode includes `commune` attribute; quickstart shows commune display |
| III. No Orphan Nodes | PASS | `graphml-schema.md` validation flags orphan nodes; filtered at visualization layer |
| IV. Commune-Centric Architecture | PASS | Physics parameters in research.md treat communes like books (central position) |
| V. Cross-Commune Civic Analysis | PASS | GraphMLDocument preserves multi-commune data for cross-reference |
| VI. Single-Source Civic Data | PASS | Storage defined as "GraphML files" - no Neo4j or alternative backends |
| VII. Functional Civic Interface | PASS | Design tokens verified identical; Borges system maintained |
| VIII. Mobile-First Responsiveness | PASS | Breakpoints, touch targets (44px) defined in data-model |
| IX. RAG Observability | PASS | ProvenanceChain entity exposes queryId, entities, relationships, chunks |

**Post-Design Gate Status**: PASS - Design artifacts comply with all constitution principles.

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | Complete |
| Data Model | [data-model.md](./data-model.md) | Complete |
| GraphML Contract | [contracts/graphml-schema.md](./contracts/graphml-schema.md) | Complete |
| Quickstart | [quickstart.md](./quickstart.md) | Complete |
| Tasks | [tasks.md](./tasks.md) | Pending `/speckit.tasks` |

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Review tasks and begin implementation
3. Add visual regression tests comparing to reference interface
