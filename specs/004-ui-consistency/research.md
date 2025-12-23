# Research: Grand Débat UI Consistency

**Feature**: 004-ui-consistency
**Date**: 2025-12-23

## Research Topics

### 1. GraphML Parsing in Browser

**Decision**: Use native DOMParser for GraphML parsing with type-safe wrapper utilities.

**Rationale**:
- GraphML is XML-based, and DOMParser is available in all modern browsers
- For ~8,000 nodes, in-memory parsing is feasible (estimated 5-10MB data)
- No additional dependencies required beyond existing xmldom types
- The existing codebase already references `graphml_source_chunks` properties, indicating GraphML metadata is already integrated via MCP server responses

**Alternatives Considered**:
- `fast-xml-parser`: Faster for large files but adds dependency; unnecessary for our scale
- `graphml-js`: Purpose-built but less maintained; DOMParser is sufficient
- Server-side pre-processing: Would add latency; client-side parsing is fast enough

**Implementation Approach**:
```typescript
// Type-safe GraphML parsing
interface GraphMLNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  commune?: string;
}

interface GraphMLEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

function parseGraphML(xml: string): { nodes: GraphMLNode[], edges: GraphMLEdge[] }
```

### 2. 3D Force Graph Physics Parameters

**Decision**: Replicate exact physics configuration from reference implementation.

**Rationale**:
- Visual consistency requires identical behavior
- Reference uses proven parameters for readable graph layouts
- Book/commune-centric topology already established

**Key Parameters from Reference** (GraphVisualization3DForce.tsx):
```typescript
// Charge force (node repulsion)
chargeForce.strength((node) => {
  if (isBook) return -200;      // Central entities (books → communes)
  if (degree > 10) return -400; // Hubs
  if (degree > 5) return -500;  // Sub-hubs
  return -600;                  // Regular nodes
});

// Link force (connection strength)
linkForce.distance((link) => {
  if (sourceIsBook || targetIsBook) return 400;
  if (sourceDegree > 10 && targetDegree > 10) return 500;
  if (sourceDegree > 5 && targetDegree > 5) return 450;
  return 550;
}).strength(0.7);

// Radial force (layer organization)
forceRadial((node) => {
  if (isBook) return 0;        // Center
  if (degree > 10) return 400; // Inner ring
  if (degree > 5) return 800;  // Middle ring
  return 1200;                 // Outer ring
}).strength(0.05);

// Center force
forceCenter(0, 0).strength(0.1);
```

**Adaptation for Communes**:
- Replace "book" detection logic with "commune" detection
- Node IDs starting with `COMMUNE_` instead of `LIVRE_`
- Maintain same physics parameters for consistent behavior

### 3. Visual Regression Testing

**Decision**: Use Playwright for visual regression testing with screenshot comparison.

**Rationale**:
- Playwright supports cross-browser screenshot comparison
- Can be integrated into CI/CD pipeline
- Allows per-component visual testing

**Alternatives Considered**:
- Percy.io: More features but paid service; overkill for this project
- Storybook + Chromatic: Requires Storybook setup; adds complexity
- Manual testing: Not scalable; difficult to maintain consistency

**Implementation Approach**:
```typescript
// playwright.config.ts
{
  testDir: './tests/visual',
  snapshotDir: './tests/visual/__snapshots__',
  expect: {
    toMatchSnapshot: { threshold: 0.1 } // Allow 10% pixel difference
  }
}

// tests/visual/ui-consistency.spec.ts
test('query interface matches reference', async ({ page }) => {
  await page.goto('/');
  expect(await page.screenshot()).toMatchSnapshot('query-interface.png');
});
```

### 4. Commune Attribution Display

**Decision**: Adapt existing book provenance patterns to commune context.

**Rationale**:
- Reference shows "LIVRE_" prefixed entities with book provenance
- Grand Débat uses "COMMUNE_" or commune-attributed entities
- Same UI patterns (modals, tooltips, provenance panel) with different labels

**Mapping from Book to Commune**:
| Reference (Book) | Grand Débat (Commune) |
|------------------|----------------------|
| `LIVRE_` prefix | `COMMUNE_` or commune attribute |
| Book name in tooltip | Commune name in tooltip |
| Book provenance in modal | Commune provenance in modal |
| `bookMapping` lookup table | `communeMapping` lookup table |

### 5. Design Token Verification

**Decision**: Ensure Tailwind config matches between interfaces.

**Rationale**:
- Both interfaces already use identical `tailwind.config.js`
- Borges design tokens are shared
- No changes needed to design system itself

**Verified Tokens**:
```javascript
// tailwind.config.js (identical in both projects)
colors: {
  'borges-dark': '#0a0a0a',
  'borges-light': '#f5f5f5',
  'borges-accent': '#7dd3fc',
  'borges-secondary': '#2a2a2a',
  'borges-muted': '#666666',
  'borges-dark-hover': '#1a1a1a',
  'borges-light-muted': '#a0a0a0',
  'borges-border': '#333333',
}
fontFamily: {
  'borges': ['Cormorant Garamond', 'Georgia', 'serif'],
}
```

## Implementation Priorities

1. **GraphML Loading Service** (NEW)
   - Create `lib/utils/graphml-parser.ts`
   - Type-safe parsing with commune attribution
   - Memory-efficient for ~8,000 nodes

2. **Physics Parameter Alignment** (MODIFY)
   - Update entity detection from `LIVRE_` to `COMMUNE_`
   - Keep all numeric parameters identical

3. **Provenance Adaptation** (MODIFY)
   - EntityDetailModal.tsx: Replace book mapping with commune mapping
   - ProvenancePanel.tsx: Update labels from "book" to "commune"

4. **Visual Regression Tests** (NEW)
   - Add Playwright visual tests
   - Create baseline screenshots from reference

## Dependencies

- No new npm packages required for core functionality
- Playwright (dev dependency) for visual testing
- Existing `@types/xmldom` sufficient for type checking

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| GraphML files too large | Implement lazy loading; start with 500-node subset |
| Physics behavior differs subtly | Side-by-side testing with reference interface |
| Mobile performance degraded | Profile 3D graph on mobile; consider 2D fallback |
| Visual regressions missed | Automate screenshot comparison in CI |
