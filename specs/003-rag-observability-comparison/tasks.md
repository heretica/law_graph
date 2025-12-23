# Tasks: Grand Débat National Civic Knowledge Graph Interface

**Feature**: 003-rag-observability-comparison
**Input**: Design documents from `/specs/003-rag-observability-comparison/`
**Scope**: Single-purpose interface for Grand Débat National GraphRAG (Constitution v3.0.0)

**Organization**: Tasks focused on extending 3_borges-interface for single-purpose civic data exploration.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US0]**: User Story 0 (Core Interface)
- Include exact file paths in descriptions

## Path Conventions

Based on Constitution v3.0.0, this is a **single-purpose civic interface**:

```
3_borges-interface/
├── src/
│   ├── app/api/
│   │   └── law-graphrag/route.ts     # MCP proxy (DONE)
│   ├── components/
│   │   ├── BorgesLibrary.tsx         # SIMPLIFY: Remove source toggle
│   │   ├── QueryInterface.tsx        # SIMPLIFY: Single source only
│   │   └── RAGSourceSelector.tsx     # DELETE: No source selection
│   ├── lib/services/
│   │   └── law-graphrag.ts           # DONE: MCP client
│   └── types/
│       └── law-graphrag.ts           # DONE: Type definitions
└── .env.local                        # DONE: LAW_GRAPHRAG_API_URL
```

---

## Phase 1: Setup (COMPLETED)

**Purpose**: Environment configuration and type definitions

- [X] T001 Add LAW_GRAPHRAG_API_URL to 3_borges-interface/.env.local
- [X] T002 [P] Create type definitions in 3_borges-interface/src/types/law-graphrag.ts
- [X] T003 [P] Add LAW_GRAPHRAG_API_URL to 3_borges-interface/.env.example

---

## Phase 2: API Layer (COMPLETED)

**Purpose**: MCP proxy route for Grand Débat National GraphRAG

- [X] T004 [P] Create MCP proxy route in 3_borges-interface/src/app/api/law-graphrag/route.ts
- [X] T005 [P] Create MCP service client in 3_borges-interface/src/lib/services/law-graphrag.ts

---

## Phase 3: Simplification for Single-Purpose (Constitution v3.0.0) - COMPLETED

**Purpose**: Remove dual-mode functionality and simplify to single MCP source

### 3.1 Remove Dual-Mode Components

- [X] T006 [US0] DELETE 3_borges-interface/src/components/RAGSourceSelector.tsx - no source selection needed (Constitution Principle VI)
- [X] T007 [US0] Remove RAGSourceSelector import and usage from 3_borges-interface/src/components/BorgesLibrary.tsx
- [X] T008 [US0] Remove ragSource state and setRagSource from BorgesLibrary.tsx - always use Grand Débat MCP

### 3.2 Simplify Query Logic

- [X] T009 [US0] Update handleSimpleQuery in BorgesLibrary.tsx to ONLY call Law GraphRAG MCP (remove Borges conditional)
- [X] T010 [US0] Remove ragSource prop from QueryInterface.tsx if present
- [X] T011 [US0] Update QueryInterface.tsx to always use lawGraphRAGService (no source branching)

### 3.3 Update Types

- [X] T012 [P] [US0] Remove RAGSource type from types/law-graphrag.ts (only one source exists)
- [X] T013 [P] [US0] Update type exports in 3_borges-interface/src/types/index.ts if needed

### 3.4 Update UI Text

- [X] T014 [US0] Update interface title/branding to reflect "Grand Débat National" civic data focus
- [X] T015 [US0] Update placeholder text in search input to suggest civic queries

---

## Phase 4: Polish & Validation

**Purpose**: Final improvements and validation

- [ ] T016 Verify graph rendering performance (30fps target) with Grand Débat data
- [ ] T017 Test mobile responsiveness on iOS/Android
- [ ] T018 Verify no orphan nodes displayed per Constitution Principle III
- [ ] T019 Update 3_borges-interface/README.md with Grand Débat configuration
- [ ] T020 Run TypeScript build to verify no type errors

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) - DONE
    ↓
Phase 2 (API Layer) - DONE
    ↓
Phase 3 (Simplification) - IN PROGRESS
    ↓
Phase 4 (Polish)
```

### Parallel Opportunities

**Phase 3**:
```
T006, T007, T008 must run sequentially (file dependencies)
T012, T013 can run in parallel with T006-T008
T014, T015 can run after T006-T011 complete
```

---

## Implementation Strategy

### Single-Source Architecture (Constitution v3.0.0)

This interface connects ONLY to the Grand Débat National MCP server:
- **URL**: `https://graphragmcp-production.up.railway.app/mcp`
- **Protocol**: MCP (Model Context Protocol) over HTTP
- **Tools**: `grand_debat_query`, `grand_debat_query_all`, `grand_debat_list_communes`

### Task Count Summary

| Phase | Task Count | Status |
|-------|------------|--------|
| Phase 1 (Setup) | 3 | DONE |
| Phase 2 (API Layer) | 2 | DONE |
| Phase 3 (Simplification) | 10 | PENDING |
| Phase 4 (Polish) | 5 | PENDING |
| **Total** | **20** | |

### MVP Definition

Complete Phases 1-3 for functional single-purpose MVP:
- User can query Grand Débat National civic data
- NO source selection (single MCP server)
- Results display in existing 3D graph

### Verification Checklist

After implementation, verify:
- [ ] NO RAGSourceSelector component exists
- [ ] Interface connects ONLY to graphragmcp-production
- [ ] 3D visualization renders civic entities
- [ ] Mobile-responsive design maintained
- [ ] No orphan nodes displayed
- [ ] Error states handled gracefully

---

## Notes

- Constitution v3.0.0 mandates single-purpose interface (Principle VI)
- All Borges/literary references must be removed
- The MCP server handles Grand Débat National 2019 "Cahiers de Doléances" data
- 50 communes in Charente-Maritime, ~8,000+ entities
