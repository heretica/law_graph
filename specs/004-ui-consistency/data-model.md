# Data Model: Grand Débat UI Consistency

**Feature**: 004-ui-consistency
**Date**: 2025-12-23

## Overview

This data model defines the entities and relationships for the GraphML-based Grand Débat interface, ensuring visual and behavioral consistency with the reference Borges Library interface.

## Core Entities

### GraphMLDocument

Represents a parsed GraphML file containing the civic knowledge graph.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| nodes | GraphMLNode[] | All parsed nodes | Non-empty array |
| edges | GraphMLEdge[] | All parsed edges | Array (can be empty) |
| metadata | DocumentMetadata | File-level metadata | Required |

### GraphMLNode

Represents an entity from the civic knowledge graph.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | string | Unique node identifier | Required, non-empty |
| labels | string[] | Entity type labels (e.g., ["Entity", "CONCEPT"]) | At least one label |
| properties | Record<string, any> | Arbitrary node properties | Optional |
| commune | string | Source commune attribution | Optional but preferred |
| degree | number | Number of connections | Calculated, ≥ 0 |
| centrality_score | number | Node importance metric | Calculated, 0-1 |

**Validation Rules**:
- `id` must be unique within the document
- Nodes with `degree === 0` are filtered from visualization (No Orphan Nodes principle)

### GraphMLEdge

Represents a relationship between two nodes.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | string | Unique edge identifier | Auto-generated if missing |
| source | string | Source node ID | Must exist in nodes |
| target | string | Target node ID | Must exist in nodes |
| type | string | Relationship type | Required |
| properties | Record<string, any> | Edge metadata | Optional |
| graphml_source_chunks | string | Source text chunks | Optional |
| graphml_weight | number | Relationship strength | Optional, ≥ 0 |
| graphml_description | string | Human-readable description | Optional |

**Validation Rules**:
- `source` and `target` must reference existing node IDs
- Self-loops (`source === target`) are allowed but flagged

### DocumentMetadata

File-level information about the GraphML document.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| filename | string | Source filename | Required |
| loadedAt | Date | Parse timestamp | Auto-generated |
| nodeCount | number | Total nodes parsed | Calculated |
| edgeCount | number | Total edges parsed | Calculated |
| communeCount | number | Distinct communes | Calculated |

## UI State Entities

### GraphVisualizationState

State management for the 3D force graph.

| Field | Type | Description |
|-------|------|-------------|
| nodes | VisualizationNode[] | Rendered nodes with positions |
| links | VisualizationLink[] | Rendered links with source/target refs |
| selectedNodeId | string | null | Currently selected node |
| hoveredLinkId | string | null | Currently hovered link |
| pinnedLinkId | string | null | Pinned tooltip link |
| isLoading | boolean | Graph loading state |
| isGraphReady | boolean | Graph initialization complete |

### VisualizationNode

Extended node with 3D positioning and visual state.

| Field | Type | Description |
|-------|------|-------------|
| ...GraphMLNode | - | All GraphMLNode fields |
| x | number | 3D x position |
| y | number | 3D y position |
| z | number | 3D z position |
| color | string | Computed node color |
| val | number | Node size multiplier |
| group | string | Entity type for coloring |

### VisualizationLink

Extended link with visual state.

| Field | Type | Description |
|-------|------|-------------|
| ...GraphMLEdge | - | All GraphMLEdge fields |
| color | string | Link color |
| width | number | Link width |

### ProvenanceChain

Tracks the source attribution for query results.

| Field | Type | Description |
|-------|------|-------------|
| queryId | string | Unique query identifier |
| query | string | Original user query |
| entities | UsedEntity[] | Entities contributing to answer |
| relationships | TraversedRelationship[] | Relationships traversed |
| chunks | SourceChunk[] | Source text chunks |
| communes | string[] | Communes represented in answer |

### UsedEntity

An entity that contributed to a query answer.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Node ID |
| name | string | Display name |
| type | string | Entity type |
| relevanceScore | number | Contribution score (0-1) |
| commune | string | Source commune |

### TraversedRelationship

A relationship traversed during graph query.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Edge ID |
| source | string | Source entity name |
| target | string | Target entity name |
| type | string | Relationship type |
| traversalOrder | number | Order in traversal path |

### SourceChunk

Original text contributing to an answer.

| Field | Type | Description |
|-------|------|-------------|
| chunkId | string | Chunk identifier |
| text | string | Original citizen text |
| commune | string | Source commune |
| contributionId | string | Cahier de Doléances ID |

## Design Token Entities

### ColorToken

Design system color values.

| Token Name | Value | Usage |
|------------|-------|-------|
| borges-dark | #0a0a0a | Background |
| borges-light | #f5f5f5 | Primary text |
| borges-accent | #7dd3fc | Interactive elements |
| borges-secondary | #2a2a2a | Secondary backgrounds |
| borges-muted | #666666 | Muted text |
| borges-dark-hover | #1a1a1a | Hover states |
| borges-light-muted | #a0a0a0 | Secondary text |
| borges-border | #333333 | Borders |

### EntityTypeColor

Entity type to color mapping for graph visualization.

| Entity Type | French Label | Color |
|-------------|--------------|-------|
| PERSON | Personnes | #ff4757 |
| GEO/LOCATION | Lieux | #00d2d3 |
| EVENT | Événements | #5352ed |
| CONCEPT | Concepts | #7bed9f |
| ORGANIZATION | Organisations | #ffa502 |
| COMMUNE | Communes | #ffd700 |
| Community | Communautés | #ff69b4 |
| default | - | #dfe4ea |

## Relationships Diagram

```
┌─────────────────┐        ┌─────────────────┐
│  GraphMLNode    │◄───────│  GraphMLEdge    │
│                 │ source │                 │
│  id             │◄───────│  source         │
│  labels[]       │ target │  target         │
│  properties     │        │  type           │
│  commune        │        │  properties     │
│  degree         │        │  graphml_*      │
└─────────────────┘        └─────────────────┘
        │                          │
        │ transforms to            │ transforms to
        ▼                          ▼
┌─────────────────┐        ┌─────────────────┐
│VisualizationNode│        │VisualizationLink│
│                 │        │                 │
│  + x, y, z      │        │  + color        │
│  + color        │        │  + width        │
│  + val          │        │                 │
│  + group        │        │                 │
└─────────────────┘        └─────────────────┘
```

## State Transitions

### Graph Loading States

```
[idle] ─load()─> [loading] ─success─> [ready]
                    │
                    └──error──> [error]
```

### Node Selection States

```
[unselected] ─click─> [selected] ─click─> [unselected]
                          │
                          └─hover─> [selected+hovered]
```

### Link Interaction States

```
[default] ─hover─> [hovered] ─mouseout─> [default]
              │
              └──click──> [pinned] ─click─> [default]
```
