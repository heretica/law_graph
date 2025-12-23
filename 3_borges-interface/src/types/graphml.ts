// GraphML type definitions for Grand Débat civic knowledge graph
// Based on contracts/graphml-schema.md specification

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
    graphml_source_chunks?: string;
    graphml_weight?: number;
    graphml_description?: string;
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

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  orphanNodes: string[];
}

export interface ValidationError {
  type: 'missing_source' | 'missing_target' | 'invalid_id' | 'parse_error';
  message: string;
  context: Record<string, any>;
}

export interface ValidationWarning {
  type: 'orphan_node' | 'missing_commune' | 'self_loop';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

// Visualization state types
export interface VisualizationNode extends GraphMLNode {
  x?: number;
  y?: number;
  z?: number;
  color?: string;
  val?: number;
  group?: string;
  name?: string;
}

export interface VisualizationLink extends GraphMLEdge {
  color?: string;
  width?: number;
}

// Provenance chain types for civic context
export interface ProvenanceChain {
  queryId: string;
  query: string;
  entities: UsedEntity[];
  relationships: TraversedRelationship[];
  chunks: SourceChunk[];
  communes: string[];
}

export interface UsedEntity {
  id: string;
  name: string;
  type: string;
  relevanceScore: number;
  commune?: string;
}

export interface TraversedRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  traversalOrder: number;
}

export interface SourceChunk {
  chunkId: string;
  text: string;
  commune: string;
  contributionId?: string;
}
