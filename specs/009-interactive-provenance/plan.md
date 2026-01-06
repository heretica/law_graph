# Implementation Plan: Interactive Provenance Chain Navigation

**Branch**: `009-interactive-provenance` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)

## Summary

Add interactive provenance chain navigation enabling bidirectional tracing from RAG answers to source citizen quotes through graph entities and relationships, implementing Constitution Principles I (End-to-End Interpretability) and II (Civic Provenance Chain) with click-through breadcrumb trail (Query → Entities → Relationships → Source Chunks).

**Primary Requirements**:
- FR-001: Interactive breadcrumb trail: Query → Entities → Relationships → Source Chunks
- FR-003: Highlight selected entity in 3D graph when clicked from provenance panel
- FR-004: Show reverse provenance ("Used in answers") when entity clicked in graph
- FR-005: Display source chunks with: commune name, contribution date, text excerpt, entity annotations
- FR-006: Export provenance as JSON with all required fields

**Technical Approach**:
- **Breadcrumb**: Clickable navigation chain with step counts ("5 Entities", "12 Relationships")
- **Graph Highlighting**: Sync `highlightedEntityId` state between provenance panel and 3D graph
- **Reverse Navigation**: Build entity → answer index from MCP provenance data
- **Source Display**: Text chunks with entity highlighting (CSS mark tag or custom highlighting)
- **JSON Export**: Browser download with complete provenance chain structure

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 19.2.1, Next.js 16.0.7
**Primary Dependencies**: Existing (uses 3d-force-graph highlighting infrastructure)
**Storage**: In-memory provenance cache (query → provenance mapping), no persistence required
**Testing**: Jest + RTL for unit tests, Playwright for E2E breadcrumb/highlighting scenarios
**Target Platform**: Web (mobile-first responsive, full-screen provenance panel on mobile)
**Project Type**: Web application (existing frontend codebase)
**Performance Goals**: Breadcrumb render <100ms, entity highlighting <50ms (synchronous), JSON export <500ms
**Constraints**: Must preserve existing 3D graph highlighting, MCP provenance data structure, mobile swipe gestures
**Scale/Scope**: Handles up to 100 entities per query, 50 relationships, 20 source chunks (typical GraphRAG response)

## Constitution Check

### ✅ Principle I: End-to-End Interpretability
**Status**: PASS - Feature IMPLEMENTS this principle directly (complete navigation pipeline).

### ✅ Principle II: Civic Provenance Chain
**Status**: PASS - Source chunks display commune attribution, contribution date, original citizen text.

### ✅ Principle VIII: Mobile-First Responsiveness
**Status**: PASS - Full-screen provenance panel on mobile, swipe-to-close, accordion source chunks.

### ✅ Principle IX: RAG Observability
**Status**: PASS - Breadcrumb shows processing phases, entity selection rationale visible.

**Overall Gate Result**: ✅ **PASS**

## Project Structure

### Source Code

```text
3_borges-interface/
├── src/
│   ├── components/
│   │   ├── ProvenancePanel.tsx              # NEW: Main provenance UI container
│   │   ├── ProvenanceBreadcrumb.tsx         # NEW: Interactive trail navigation
│   │   ├── EntityList.tsx                   # NEW: Used entities with click-to-highlight
│   │   ├── RelationshipPathViewer.tsx       # NEW: Traversed relationships display
│   │   ├── SourceChunkList.tsx              # NEW: Citizen quote display
│   │   └── GraphVisualization3DForce.tsx    # MODIFY: Add provenance entity highlighting
│   ├── hooks/
│   │   ├── useProvenanceNavigation.ts       # NEW: Breadcrumb state management
│   │   ├── useReverseProvenance.ts          # NEW: Entity → answers mapping
│   │   └── useProvenanceExport.ts           # NEW: JSON export hook
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── provenance-indexer.ts        # NEW: Build entity → answer index
│   │   │   └── entity-highlighter.ts        # NEW: Text chunk entity annotation
│   │   └── types/
│   │       └── provenance.ts                # NEW: ProvenanceChain, UsedEntity, SourceChunk
│   └── types/
│       └── provenance-chain.ts              # NEW: Complete provenance data model
└── tests/
    ├── unit/
    │   ├── provenance-indexer.test.ts       # NEW: Reverse index tests
    │   └── useProvenanceNavigation.test.ts  # NEW: Breadcrumb state tests
    └── e2e/
        ├── answer-to-source.spec.ts         # NEW: User Story 1 scenarios
        ├── breadcrumb-navigation.spec.ts    # NEW: User Story 2 scenarios
        └── reverse-provenance.spec.ts       # NEW: User Story 3 scenarios
```

## Phase 0: Research

1. **Graph Highlighting Synchronization**: Decision: Use existing `highlightedEntityId` state in BorgesLibrary.tsx (already implemented)
2. **Breadcrumb Step Counts**: Decision: Parse from MCP provenance data (`usedEntities.length`, `traversedRelationships.length`)
3. **Entity Annotation**: Decision: CSS `<mark>` tag with custom styling for highlighted entities in text chunks
4. **JSON Export Format**: Decision: Raw provenance structure from MCP (no transformation) with download via Blob URL
5. **Reverse Index Strategy**: Decision: Build Map<entityId, answerIds[]> on provenance data load (O(n) preprocessing)

## Phase 1: Design & Contracts

### Data Model

```typescript
interface ProvenanceChain {
  queryText: string
  answerText: string
  usedEntities: UsedEntity[]
  traversedRelationships: TraversedRelationship[]
  sourceChunks: SourceChunk[]
  timestamp: number
}

interface UsedEntity {
  entityId: string
  entityName: string
  entityType: string
  relevanceScore: number  // From MCP importance_score
  commune: string
}

interface TraversedRelationship {
  sourceEntity: string
  targetEntity: string
  relationshipType: string
  hopDistance: number     // 1 = direct, 2 = second-order, 3 = third-order
  weight: number
}

interface SourceChunk {
  chunkText: string
  commune: string
  contributionDate?: string  // Optional: may not be available for all chunks
  highlightedEntities: string[]  // Entity IDs to highlight in text
}
```

### Validation Rules
- Breadcrumb MUST show counts: "5 Entities", "12 Relationships", "8 Source Chunks" (FR-007)
- Entity highlighting MUST sync with 3D graph highlighting (FR-003)
- Reverse provenance index MUST map entity ID → answer IDs (FR-004)
- Source chunks MUST display commune name (FR-005, Constitution Principle II)
- JSON export MUST include all ProvenanceChain fields (FR-006)

### Quickstart

```typescript
import { useProvenanceNavigation, useReverseProvenance } from '@/hooks'

function ProvenanceUI({ answer }) {
  const { breadcrumb, navigateTo } = useProvenanceNavigation(answer.provenance)
  const { getAnswersUsingEntity } = useReverseProvenance()

  const handleEntityClick = (entityId: string) => {
    navigateTo('entities')
    highlightEntity(entityId)  // Sync with 3D graph
  }

  const handleGraphEntityClick = (entityId: string) => {
    const answers = getAnswersUsingEntity(entityId)
    // Show "Used in 3 answers" panel
  }

  return (
    <>
      <ProvenanceBreadcrumb breadcrumb={breadcrumb} onNavigate={navigateTo} />
      <EntityList entities={answer.provenance.usedEntities} onClick={handleEntityClick} />
      <SourceChunkList chunks={answer.provenance.sourceChunks} />
    </>
  )
}
```

## Re-evaluated Constitution Check

✅ **PASS** - Phase 1 design implements Constitution Principles I & II directly. Ready for `/speckit.tasks`.

## Next Steps

1. Run `/speckit.tasks` to generate actionable task breakdown
2. Implement in order: Breadcrumb UI → Entity highlighting sync → Reverse index → Source chunk display → JSON export
3. Test coverage: Unit tests (indexer, navigation state) + E2E (user stories 1-3)
4. Success Criteria: SC-001 (70% click provenance panel), SC-006 (85% trace answer to source quote)
