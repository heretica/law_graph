# GraphML Schema Contract

**Feature**: 004-ui-consistency
**Date**: 2025-12-23

## Overview

This document defines the expected GraphML schema for the Grand Débat civic knowledge graph. The interface loads and parses GraphML files directly in the browser without requiring a Neo4j backend.

## GraphML Structure

### Expected File Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">

  <!-- Attribute Definitions -->
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="entity_type" for="node" attr.name="entity_type" attr.type="string"/>
  <key id="commune" for="node" attr.name="commune" attr.type="string"/>
  <key id="description" for="node" attr.name="description" attr.type="string"/>
  <key id="degree" for="node" attr.name="degree" attr.type="int"/>
  <key id="centrality_score" for="node" attr.name="centrality_score" attr.type="double"/>

  <key id="rel_type" for="edge" attr.name="type" attr.type="string"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <key id="source_chunks" for="edge" attr.name="source_chunks" attr.type="string"/>
  <key id="description" for="edge" attr.name="description" attr.type="string"/>

  <graph id="grand-debat" edgedefault="directed">
    <!-- Nodes -->
    <node id="node_001">
      <data key="label">Impôts locaux</data>
      <data key="entity_type">CONCEPT</data>
      <data key="commune">Rochefort</data>
      <data key="description">Préoccupations citoyennes sur la fiscalité locale</data>
      <data key="degree">15</data>
      <data key="centrality_score">0.85</data>
    </node>

    <!-- Edges -->
    <edge id="edge_001" source="node_001" target="node_002">
      <data key="rel_type">RELATED_TO</data>
      <data key="weight">0.9</data>
      <data key="source_chunks">Les impôts sont trop élevés...</data>
      <data key="description">Taxation concerns relate to service expectations</data>
    </edge>
  </graph>
</graphml>
```

## Node Attributes

### Required Attributes

| Key ID | Type | Description | Example |
|--------|------|-------------|---------|
| id | string | Unique node identifier | "node_001" |

### Optional Attributes

| Key ID | Type | Description | Default |
|--------|------|-------------|---------|
| label | string | Display name | Node ID |
| entity_type | string | Entity classification | "default" |
| commune | string | Source commune | null |
| description | string | Node description | null |
| degree | int | Connection count | 0 |
| centrality_score | double | Importance (0-1) | 0.5 |

### Supported Entity Types

```
PERSON      - Individual citizens, officials
GEO         - Geographic locations
LOCATION    - Specific places
EVENT       - Events, meetings
CONCEPT     - Themes, ideas, concerns
ORGANIZATION - Groups, institutions
COMMUNE     - Municipality nodes
Community   - Thematic clusters
```

## Edge Attributes

### Required Attributes

| Key ID | Type | Description | Example |
|--------|------|-------------|---------|
| source | string | Source node ID | "node_001" |
| target | string | Target node ID | "node_002" |

### Optional Attributes

| Key ID | Type | Description | Default |
|--------|------|-------------|---------|
| id | string | Edge identifier | auto-generated |
| rel_type | string | Relationship type | "RELATED_TO" |
| weight | double | Relationship strength | 1.0 |
| source_chunks | string | Original text | null |
| description | string | Relationship description | null |

### Supported Relationship Types

```
RELATED_TO        - General semantic relation
MENTIONS          - Entity mentions entity
OCCURS_IN         - Event occurs in location
BELONGS_TO        - Entity belongs to organization
CONCERNS          - Topic concerns theme
PART_OF           - Component of larger entity
SIMILAR_TO        - Semantic similarity
CONTRASTS_WITH    - Opposing viewpoints
```

## TypeScript Interfaces

```typescript
// graphml.ts - Type definitions for GraphML parsing

export interface GraphMLDocument {
  nodes: GraphMLNode[];
  edges: GraphMLEdge[];
  metadata: DocumentMetadata;
}

export interface GraphMLNode {
  id: string;
  labels: string[];
  properties: {
    label?: string;
    entity_type?: string;
    commune?: string;
    description?: string;
    degree?: number;
    centrality_score?: number;
    [key: string]: any;
  };
}

export interface GraphMLEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: {
    weight?: number;
    source_chunks?: string;
    description?: string;
    [key: string]: any;
  };
}

export interface DocumentMetadata {
  filename: string;
  loadedAt: Date;
  nodeCount: number;
  edgeCount: number;
  communeCount: number;
}

// Parsing function signature
export function parseGraphML(xmlString: string): GraphMLDocument;

// Validation function signature
export function validateGraphML(doc: GraphMLDocument): ValidationResult;

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  orphanNodes: string[]; // Nodes with degree 0
}

export interface ValidationError {
  type: 'missing_source' | 'missing_target' | 'invalid_id';
  message: string;
  context: Record<string, any>;
}

export interface ValidationWarning {
  type: 'orphan_node' | 'missing_commune' | 'self_loop';
  message: string;
  nodeId?: string;
  edgeId?: string;
}
```

## Parsing Contract

### Input
- Well-formed XML string conforming to GraphML specification
- UTF-8 encoding
- Maximum file size: 50MB

### Output
- Parsed `GraphMLDocument` object
- All orphan nodes flagged but not removed (removal happens at visualization layer)
- Edges with missing source/target generate errors

### Error Handling

| Error Type | Behavior |
|------------|----------|
| Invalid XML | Throw `GraphMLParseError` with line number |
| Missing required attribute | Include in `ValidationResult.errors` |
| Orphan node detected | Include in `ValidationResult.warnings` |
| Self-loop detected | Include in `ValidationResult.warnings` |

## Performance Requirements

| Metric | Target |
|--------|--------|
| Parse time (8,000 nodes) | < 500ms |
| Memory usage | < 50MB |
| Validation time | < 100ms |

## Example Usage

```typescript
import { parseGraphML, validateGraphML } from '@/lib/utils/graphml-parser';

async function loadCivicGraph(): Promise<GraphMLDocument> {
  const response = await fetch('/data/grand-debat.graphml');
  const xmlString = await response.text();

  const document = parseGraphML(xmlString);
  const validation = validateGraphML(document);

  if (!validation.valid) {
    console.error('GraphML validation failed:', validation.errors);
    throw new Error('Invalid GraphML document');
  }

  if (validation.orphanNodes.length > 0) {
    console.warn(`Filtering ${validation.orphanNodes.length} orphan nodes`);
  }

  return document;
}
```
