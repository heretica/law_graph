# Implementation Plan: Basile Minimalism UI Redesign

**Branch**: `002-basile-ui-redesign` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-basile-ui-redesign/spec.md`

## Summary

Visual-only redesign of the Borges Library interface implementing Constitution Principle VII (Basile Minimalism). The redesign refines fonts, colors, buttons, and UI chrome styling while preserving 100% of existing functionality and all graph animations. Inspired by Jonathan Basile's libraryofbabel.info aesthetic: dark theme, restrained palette, typography-focused hierarchy.

## Technical Context

**Language/Version**: TypeScript 5.2.2, React 19.2.0, Next.js 16.0.4
**Primary Dependencies**: Tailwind CSS 3.3.5, 3d-force-graph 1.79.0, Three.js 0.181.0, D3 7.8.5
**Storage**: N/A (visual-only changes, no data layer modifications)
**Testing**: Manual visual testing, ESLint, TypeScript type-check (`tsc --noEmit`)
**Target Platform**: Web (desktop-first, responsive)
**Project Type**: Web application (frontend-only changes)
**Performance Goals**: No performance regression from current implementation
**Constraints**: Zero functionality changes, all graph animations preserved, WCAG AA compliance
**Scale/Scope**: 18 React components, 1 global CSS file, 1 Tailwind config

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. End-to-end interpretability | ✅ PASS | No changes to provenance navigation |
| II. Babel library mimetism | ✅ PASS | Enhances infinite exploration aesthetic |
| III. No orphan nodes | ✅ PASS | No graph logic changes |
| IV. Book-centric architecture | ✅ PASS | No query/visualization logic changes |
| V. Inter-book exploration | ✅ PASS | No RAG algorithm changes |
| VI. Extensible literature foundation | ✅ PASS | No ingestion pipeline changes |
| VII. Basile minimalism | ✅ IMPLEMENTS | Core principle being implemented |

**GATE RESULT**: ✅ PASS - No violations. Visual-only changes comply with all principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-basile-ui-redesign/
├── plan.md              # This file
├── research.md          # Phase 0: Design system research
├── data-model.md        # Phase 1: Design token definitions
├── quickstart.md        # Phase 1: Implementation guide
├── contracts/           # Phase 1: Design system contracts
│   └── design-tokens.json
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
3_borges-interface/
├── src/
│   ├── app/
│   │   └── globals.css          # Global styles (TO MODIFY)
│   ├── components/              # 18 React components (STYLING ONLY)
│   │   ├── BorgesLibrary.tsx
│   │   ├── BookSelector.tsx
│   │   ├── GraphVisualization3DForce.tsx
│   │   ├── QueryInterface.tsx
│   │   ├── EntityDetailModal.tsx
│   │   ├── TextChunkModal.tsx
│   │   ├── ProvenancePanel.tsx
│   │   └── ...
│   └── styles/                  # NEW: Design system (TO CREATE)
│       └── design-tokens.ts
├── tailwind.config.js           # Tailwind theme (TO MODIFY)
└── package.json                 # Dependencies (NO CHANGES)
```

**Structure Decision**: Frontend-only changes within existing Next.js application. No new directories required except optional `src/styles/` for design tokens.

## Complexity Tracking

> No violations - visual-only changes require no complexity justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Current State Analysis

### Existing Design System

**Colors** (from `globals.css` and `tailwind.config.js`):
- `--borges-dark`: #0a0a0a ✅ (already compliant with dark theme)
- `--borges-light`: #f5f5f5 ✅ (light text, compliant)
- `--borges-accent`: #d4af37 (gold accent)
- `--borges-secondary`: #2a2a2a (secondary dark)

**Typography**:
- Font: Inter (Google Fonts) - single font family ✅
- Weights: 300, 400, 500, 600, 700

**Current Compliance**:
- ✅ Dark background already in place
- ✅ Single font family (Inter)
- ⚠️ Color palette may need audit for additional colors in components
- ⚠️ Navigation elements need streamlining audit
- ⚠️ Decorative elements need purpose test

### Components Requiring Visual Updates

| Component | Priority | Changes Needed |
|-----------|----------|----------------|
| BorgesLibrary.tsx | P1 | Main layout, navigation streamlining |
| QueryInterface.tsx | P1 | Search styling, input fields |
| BookSelector.tsx | P1 | Dropdown styling |
| EntityDetailModal.tsx | P2 | Panel styling, typography |
| TextChunkModal.tsx | P2 | Modal styling |
| ProvenancePanel.tsx | P2 | Panel styling |
| GraphVisualization3DForce.tsx | P2 | Node/edge colors only (NO animation changes) |
| LoadingWheel3D.tsx | P2 | Minimal spinner styling |
| All others | P3 | Consistent styling pass |

---

## Phase 0: Research Outputs

See `research.md` for:
- Font pairing decision (Inter + optional heading font)
- Final 5-color palette definition
- libraryofbabel.info design pattern analysis
- Tailwind CSS theming best practices
- Accessibility (WCAG AA) verification approach

## Phase 1: Design Outputs

See `data-model.md` for:
- Color Token definitions
- Typography Scale definitions
- Spacing/sizing tokens
- Component styling patterns

See `contracts/design-tokens.json` for:
- Machine-readable design token export
- CSS custom properties mapping

See `quickstart.md` for:
- Step-by-step implementation guide
- Component update checklist
- Testing verification steps
