# Quickstart: Grand Débat UI Consistency

**Feature**: 004-ui-consistency
**Date**: 2025-12-23

## Overview

This guide helps developers quickly implement UI consistency between the Grand Débat interface and the reference Borges Library interface. The key difference: Grand Débat uses GraphML files instead of Neo4j.

## Prerequisites

- Node.js 18+
- Existing `3_borges-interface` project in `law_graph` repository
- GraphML file with civic data (`grand-debat.graphml`)
- Reference interface at `nano-graphrag/3_borges-interface` for comparison

## Quick Setup

### 1. Verify Shared Design Tokens

Both interfaces should use identical Tailwind configuration:

```bash
# Compare tailwind configs
diff 3_borges-interface/tailwind.config.js \
     ../nano-graphrag/3_borges-interface/tailwind.config.js
```

If different, sync the Grand Débat config to match the reference.

### 2. Add GraphML Parser

Create the GraphML parsing utility:

```typescript
// src/lib/utils/graphml-parser.ts

import type { GraphMLDocument, GraphMLNode, GraphMLEdge } from '@/types/graphml';

export function parseGraphML(xmlString: string): GraphMLDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`GraphML parse error: ${parseError.textContent}`);
  }

  const nodes: GraphMLNode[] = [];
  const edges: GraphMLEdge[] = [];

  // Parse nodes
  doc.querySelectorAll('node').forEach(nodeEl => {
    const id = nodeEl.getAttribute('id') || '';
    const properties: Record<string, any> = {};

    nodeEl.querySelectorAll('data').forEach(dataEl => {
      const key = dataEl.getAttribute('key') || '';
      properties[key] = dataEl.textContent;
    });

    nodes.push({
      id,
      labels: [properties.entity_type || 'default'],
      properties,
    });
  });

  // Parse edges
  doc.querySelectorAll('edge').forEach(edgeEl => {
    const id = edgeEl.getAttribute('id') || `edge_${edges.length}`;
    const source = edgeEl.getAttribute('source') || '';
    const target = edgeEl.getAttribute('target') || '';
    const properties: Record<string, any> = {};

    edgeEl.querySelectorAll('data').forEach(dataEl => {
      const key = dataEl.getAttribute('key') || '';
      properties[key] = dataEl.textContent;
    });

    edges.push({
      id,
      source,
      target,
      type: properties.rel_type || 'RELATED_TO',
      properties,
    });
  });

  return {
    nodes,
    edges,
    metadata: {
      filename: 'grand-debat.graphml',
      loadedAt: new Date(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      communeCount: new Set(nodes.map(n => n.properties.commune).filter(Boolean)).size,
    },
  };
}
```

### 3. Update Entity Type Detection

In `GraphVisualization3DForce.tsx`, update the entity type detection to recognize communes:

```typescript
// Replace book detection with commune detection
const isCommune = (node: any) =>
  node.group === 'Communes' ||
  node.group === 'COMMUNE' ||
  String(node.id).startsWith('COMMUNE_');

// In charge force
chargeForce.strength((node: any) => {
  if (isCommune(node)) return -200;  // Communes stay central
  const degree = node.val || 1;
  if (degree > 10) return -400;
  if (degree > 5) return -500;
  return -600;
});

// In radial force
forceRadial((node: any) => {
  if (isCommune(node)) return 0;     // Communes at center
  const degree = node.val || 1;
  if (degree > 10) return 400;
  if (degree > 5) return 800;
  return 1200;
}).strength(0.05);
```

### 4. Update Provenance Labels

In `EntityDetailModal.tsx` and `ProvenancePanel.tsx`, replace book references with commune:

```typescript
// EntityDetailModal.tsx
// Change: "Source: {bookName}" to "Commune: {communeName}"

const communeMapping: Record<string, string> = {
  'rochefort': 'Rochefort',
  'andilly': 'Andilly',
  'surgeres': 'Surgères',
  // ... all 50 communes
};

function getCommuneDisplayName(node: GraphMLNode): string {
  const commune = node.properties.commune;
  if (!commune) return 'Source commune non disponible';
  return communeMapping[commune.toLowerCase()] || commune;
}
```

### 5. Load GraphML on Startup

In `BorgesLibrary.tsx`, add GraphML loading:

```typescript
import { parseGraphML } from '@/lib/utils/graphml-parser';

// In useEffect or initialization
useEffect(() => {
  async function loadGraph() {
    setIsLoadingGraph(true);
    try {
      const response = await fetch('/data/grand-debat.graphml');
      const xmlString = await response.text();
      const graphData = parseGraphML(xmlString);

      // Transform to reconciliation format for compatibility
      setReconciliationData({
        nodes: graphData.nodes.map(n => ({
          id: n.id,
          labels: n.labels,
          properties: n.properties,
          degree: n.properties.degree || 0,
          centrality_score: n.properties.centrality_score || 0.5,
        })),
        relationships: graphData.edges.map(e => ({
          id: e.id,
          type: e.type,
          source: e.source,
          target: e.target,
          properties: e.properties,
        })),
      });
    } catch (error) {
      console.error('Failed to load GraphML:', error);
    } finally {
      setIsLoadingGraph(false);
    }
  }

  loadGraph();
}, []);
```

### 6. Place GraphML File

Add your GraphML file to the public directory:

```bash
cp path/to/grand-debat.graphml 3_borges-interface/public/data/
```

## Verification Checklist

Run through these checks to verify UI consistency:

- [ ] Background color is `#0a0a0a` (borges-dark)
- [ ] Text color is `#f5f5f5` (borges-light)
- [ ] Accent color is `#7dd3fc` (borges-accent)
- [ ] Font is Cormorant Garamond (fallback: Georgia)
- [ ] Hexagonal loading animation displays
- [ ] Borges quote appears during loading
- [ ] 3D graph rotates/zooms smoothly
- [ ] Node tooltips appear on hover
- [ ] Link tooltips show relationship details
- [ ] Provenance panel shows commune attribution
- [ ] Mobile layout works (< 768px)
- [ ] Touch interactions work on tablet

## Testing

### Visual Regression Test (Manual)

1. Open reference interface: `nano-graphrag/3_borges-interface`
2. Open Grand Débat interface: `law_graph/3_borges-interface`
3. Compare side-by-side at each breakpoint
4. Screenshot and diff if needed

### Automated Visual Test (Playwright)

```typescript
// tests/visual/ui-consistency.spec.ts
import { test, expect } from '@playwright/test';

test('grand debat matches reference styling', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="graph-container"]');

  // Screenshot comparison
  expect(await page.screenshot()).toMatchSnapshot('grand-debat-main.png');
});

test('query interface styling', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const queryInput = page.locator('[data-testid="query-input"]');
  expect(await queryInput.screenshot()).toMatchSnapshot('query-input.png');
});
```

## Common Issues

### Issue: Fonts not loading

**Symptom**: Georgia font instead of Cormorant Garamond

**Solution**: Ensure Google Fonts import in `_document.tsx` or `layout.tsx`:
```tsx
<link
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
  rel="stylesheet"
/>
```

### Issue: 3D graph not rendering

**Symptom**: Blank canvas or error in console

**Solution**: Verify dynamic import for SSR compatibility:
```tsx
const GraphVisualization3DForce = dynamic(
  () => import('./GraphVisualization3DForce'),
  { ssr: false }
);
```

### Issue: Orphan nodes visible

**Symptom**: Isolated nodes with no connections

**Solution**: Filter before rendering:
```typescript
const filteredNodes = reconciliationData.nodes.filter(
  n => n.degree > 0
);
```

## Next Steps

After completing basic consistency:

1. Add visual regression tests to CI
2. Implement mobile-specific optimizations
3. Add commune search/filter functionality
4. Integrate with MCP server for AI queries
