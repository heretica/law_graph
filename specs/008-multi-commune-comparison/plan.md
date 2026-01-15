# Implementation Plan: Multi-Commune Comparative Analysis

**Branch**: `008-multi-commune-comparison` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)

## Summary

Add multi-commune comparative analysis UI enabling selection of 2-50 communes, visualization of entity prevalence via heatmap (entities × communes), aggregate statistics dashboard, and prevalence-based filtering (regional >70%, local 20-70%, hyperlocal <20%) to unlock Constitution Principle V (Cross-Commune Civic Analysis).

**Primary Requirements**:
- FR-001: Multi-select commune picker with checkboxes for all 50 communes
- FR-004: Heatmap visualization (entities × communes) with color intensity for mention frequency
- FR-005: Calculate prevalence percentage: (communes mentioning entity) / (total selected) × 100
- FR-007: Export statistics as CSV (Entity, Type, Total Mentions, Commune Count, Prevalence %)
- FR-009: Classify entities: Regional (>70% prevalence), Local (20-70%), Hyperlocal (<20%)

**Technical Approach**:
- **Multi-select**: Checkbox list with chip display (max 50 chips, scrollable container)
- **Heatmap**: HTML canvas or SVG grid (entities rows, communes columns, color scale)
- **Aggregation**: Client-side merge of per-commune MCP responses with attribution preservation
- **Filtering**: Prevalence slider (0-100%) with real-time graph updates
- **Export**: CSV generation from aggregated statistics (browser download)

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 19.2.1, Next.js 16.0.7
**Primary Dependencies**: Existing + lightweight heatmap library (e.g., react-simple-heatmap or custom canvas rendering)
**Storage**: Browser session storage (selected communes persistence), no backend database
**Testing**: Jest + RTL for unit tests, Playwright for E2E multi-commune scenarios
**Target Platform**: Web (mobile-first responsive, touch-optimized heatmap with pinch-zoom)
**Project Type**: Web application (existing frontend codebase)
**Performance Goals**: Heatmap render <500ms for 50 entities × 10 communes, aggregation <2s for 10 communes
**Constraints**: Must preserve existing single-commune query flow, maintain MCP session pool (max 3), batched loading for >5 communes
**Scale/Scope**: Supports 2-50 communes, displays up to 100 entities in heatmap (pagination), CSV export <1MB

## Constitution Check

### ✅ Principle V: Cross-Commune Civic Analysis
**Status**: PASS - Feature IMPLEMENTS this principle directly (multi-commune queries, pattern discovery).

### ✅ Principle II: Civic Provenance Chain
**Status**: PASS - Heatmap cells show commune attribution, partial results indicate failed communes.

### ✅ Principle IV: Commune-Centric Architecture
**Status**: PASS - Communes are selection units and heatmap columns (organizational primary).

### ✅ Principle VIII: Mobile-First Responsiveness
**Status**: PASS - Heatmap horizontal scroll, 44x44px touch targets, bottom sheet statistics panel.

### ✅ Principle XI: Performance Optimization Architecture
**Status**: PASS - Batched loading (5 communes at a time), progressive rendering, client-side aggregation.

**Overall Gate Result**: ✅ **PASS**

## Project Structure

### Source Code

```text
3_borges-interface/
├── src/
│   ├── components/
│   │   ├── CommuneMultiSelect.tsx          # NEW: Checkbox list for 50 communes
│   │   ├── CommuneChips.tsx                # NEW: Dismissible chip display
│   │   ├── EntityHeatmap.tsx               # NEW: Canvas/SVG heatmap rendering
│   │   ├── AggregateStatsPanel.tsx         # NEW: Statistics dashboard
│   │   └── PrevalenceFilterSlider.tsx      # NEW: 0-100% prevalence slider
│   ├── hooks/
│   │   ├── useMultiCommuneQuery.ts         # NEW: Batched query aggregation
│   │   ├── useEntityPrevalence.ts          # NEW: Prevalence calculation
│   │   └── useCsvExport.ts                 # NEW: CSV generation hook
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── prevalence-calculator.ts    # NEW: Entity prevalence logic
│   │   │   ├── heatmap-color-scale.ts      # NEW: Color intensity mapping
│   │   │   └── csv-generator.ts            # NEW: CSV formatting
│   │   └── config/
│   │       └── commune-list.json           # EXISTING: 50 commune metadata
│   └── types/
│       └── multi-commune.ts                # NEW: EntityPrevalence, ComparisonHeatmap
└── tests/
    ├── unit/
    │   ├── prevalence-calculator.test.ts   # NEW: Classification tests (regional/local/hyperlocal)
    │   └── useMultiCommuneQuery.test.ts    # NEW: Aggregation logic tests
    └── e2e/
        ├── multi-select.spec.ts            # NEW: User Story 1 scenarios
        └── heatmap-interaction.spec.ts     # NEW: User Story 2 scenarios
```

## Phase 0: Research

1. **Heatmap Rendering**: Decision: Custom canvas rendering (no library) for performance <500ms
2. **Batching Strategy**: Decision: 5 communes per batch with 1500ms delay (matches Constitution progressive loading)
3. **Prevalence Thresholds**: Decision: 70% regional, 20-70% local, <20% hyperlocal (from spec)
4. **CSV Format**: Decision: Standard RFC 4180 with UTF-8 BOM for Excel compatibility
5. **Partial Failure Handling**: Decision: Display available results + warning banner with failed commune list

## Phase 1: Design & Contracts

### Data Model

```typescript
interface EntityPrevalence {
  entityId: string
  entityName: string
  entityType: string
  mentionsByCommune: Map<string, number>  // communeId → mention count
  totalMentions: number
  communeCount: number                    // How many communes mention this entity
  prevalencePercentage: number            // (communeCount / totalSelected) × 100
  classification: 'regional' | 'local' | 'hyperlocal'
}

interface ComparisonHeatmap {
  entities: string[]                       // Row labels
  communes: string[]                       // Column labels
  cells: number[][]                        // 2D array: cells[entityIdx][communeIdx] = mention count
  colorScale: { min: number; max: number } // For normalization
}

interface CommuneSelection {
  communeIds: string[]
  communeNames: string[]                   // For display
  selectionTimestamp: number
}
```

### Validation Rules
- Selected communes MUST be 2-50 (FR-001)
- Prevalence percentage MUST be exact: `(communeCount / totalSelected) × 100` (FR-005)
- Heatmap pagination triggers at >50 entities (FR-011)
- CSV export MUST include columns: Entity, Type, Total Mentions, Commune Count, Prevalence % (FR-007)

### Quickstart

```typescript
import { useMultiCommuneQuery, useEntityPrevalence } from '@/hooks'

function MultiCommuneAnalysis() {
  const { selectedCommunes, toggleCommune } = useCommuneSelection()
  const { data, loading } = useMultiCommuneQuery(selectedCommunes)
  const { prevalence, filterByPrevalence } = useEntityPrevalence(data)

  return (
    <>
      <CommuneMultiSelect onSelect={toggleCommune} />
      <EntityHeatmap entities={prevalence} communes={selectedCommunes} />
      <PrevalenceFilterSlider onChange={filterByPrevalence} />
    </>
  )
}
```

## Re-evaluated Constitution Check

✅ **PASS** - Phase 1 design preserves all Constitution principles. Ready for `/speckit.tasks`.

## Next Steps

1. Run `/speckit.tasks` to generate actionable task breakdown
2. Implement in order: Multi-select UI → Batched aggregation → Heatmap rendering → Statistics → CSV export
3. Test coverage: Unit tests (prevalence calculation, batching) + E2E (user stories 1-2)
4. Success Criteria: SC-001 (60% users select 2+ communes), SC-003 (80% identify regional patterns)
