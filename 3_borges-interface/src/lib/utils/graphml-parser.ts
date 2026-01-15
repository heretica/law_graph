// GraphML parser for Grand Débat civic knowledge graph
// Uses native DOMParser for browser-based XML parsing

import type {
  GraphMLDocument,
  GraphMLNode,
  GraphMLEdge,
  DocumentMetadata,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/types/graphml';

export class GraphMLParseError extends Error {
  constructor(message: string, public lineNumber?: number) {
    super(message);
    this.name = 'GraphMLParseError';
  }
}

/**
 * Parse a GraphML XML string into a structured document
 * @param xmlString - The GraphML XML content as a string
 * @param filename - Optional filename for metadata
 * @returns Parsed GraphMLDocument
 * @throws GraphMLParseError if XML is malformed
 */
export function parseGraphML(xmlString: string, filename: string = 'unknown'): GraphMLDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for XML parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new GraphMLParseError(
      `Invalid XML: ${parseError.textContent?.substring(0, 200)}`,
      undefined
    );
  }

  const nodes: GraphMLNode[] = [];
  const edges: GraphMLEdge[] = [];
  const communeSet = new Set<string>();

  // Parse key definitions for attribute mapping
  const keyMap = new Map<string, { name: string; for: string }>();
  doc.querySelectorAll('key').forEach(keyEl => {
    const id = keyEl.getAttribute('id');
    const name = keyEl.getAttribute('attr.name') || id;
    const forAttr = keyEl.getAttribute('for') || 'all';
    if (id) {
      keyMap.set(id, { name: name || id, for: forAttr });
    }
  });

  // Parse nodes
  doc.querySelectorAll('node').forEach(nodeEl => {
    const id = nodeEl.getAttribute('id');
    if (!id) return;

    const properties: Record<string, any> = {};

    nodeEl.querySelectorAll('data').forEach(dataEl => {
      const key = dataEl.getAttribute('key');
      if (key) {
        const keyDef = keyMap.get(key);
        const propName = keyDef?.name || key;
        const value = dataEl.textContent;

        // Parse numeric values
        if (propName === 'degree' || propName === 'centrality_score' || propName === 'weight') {
          properties[propName] = value ? parseFloat(value) : undefined;
        } else {
          properties[propName] = value;
        }
      }
    });

    // Track commune for metadata
    if (properties.commune) {
      communeSet.add(properties.commune);
    }

    // Determine labels from entity_type
    const labels: string[] = ['Entity'];
    if (properties.entity_type) {
      labels.push(properties.entity_type);
    }

    nodes.push({
      id,
      labels,
      properties,
    });
  });

  // Parse edges
  let edgeIndex = 0;
  doc.querySelectorAll('edge').forEach(edgeEl => {
    const id = edgeEl.getAttribute('id') || `edge_${edgeIndex++}`;
    const source = edgeEl.getAttribute('source');
    const target = edgeEl.getAttribute('target');

    if (!source || !target) return;

    const properties: Record<string, any> = {};

    edgeEl.querySelectorAll('data').forEach(dataEl => {
      const key = dataEl.getAttribute('key');
      if (key) {
        const keyDef = keyMap.get(key);
        const propName = keyDef?.name || key;
        const value = dataEl.textContent;

        if (propName === 'weight') {
          properties[propName] = value ? parseFloat(value) : undefined;
        } else {
          properties[propName] = value;
        }

        // Also map to graphml_* prefixed properties for compatibility
        if (propName === 'source_chunks') {
          properties.graphml_source_chunks = value;
        }
        if (propName === 'weight') {
          properties.graphml_weight = properties[propName];
        }
        if (propName === 'description') {
          properties.graphml_description = value;
        }
      }
    });

    const type = properties.type || properties.rel_type || 'RELATED_TO';

    edges.push({
      id,
      source,
      target,
      type,
      properties,
    });
  });

  const metadata: DocumentMetadata = {
    filename,
    loadedAt: new Date(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    communeCount: communeSet.size,
  };

  return { nodes, edges, metadata };
}

/**
 * Validate a parsed GraphML document
 * @param doc - The parsed GraphMLDocument
 * @returns ValidationResult with errors, warnings, and orphan nodes
 */
export function validateGraphML(doc: GraphMLDocument): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const orphanNodes: string[] = [];

  // Build node ID set for quick lookup
  const nodeIds = new Set(doc.nodes.map(n => n.id));

  // Calculate degree for each node
  const nodeDegrees = new Map<string, number>();
  doc.nodes.forEach(n => nodeDegrees.set(n.id, 0));

  // Validate edges and count degrees
  doc.edges.forEach(edge => {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        type: 'missing_source',
        message: `Edge ${edge.id} references non-existent source node: ${edge.source}`,
        context: { edgeId: edge.id, source: edge.source },
      });
    } else {
      nodeDegrees.set(edge.source, (nodeDegrees.get(edge.source) || 0) + 1);
    }

    if (!nodeIds.has(edge.target)) {
      errors.push({
        type: 'missing_target',
        message: `Edge ${edge.id} references non-existent target node: ${edge.target}`,
        context: { edgeId: edge.id, target: edge.target },
      });
    } else {
      nodeDegrees.set(edge.target, (nodeDegrees.get(edge.target) || 0) + 1);
    }

    // Check for self-loops
    if (edge.source === edge.target) {
      warnings.push({
        type: 'self_loop',
        message: `Edge ${edge.id} is a self-loop on node ${edge.source}`,
        edgeId: edge.id,
        nodeId: edge.source,
      });
    }
  });

  // Check for orphan nodes (degree 0) and missing commune
  doc.nodes.forEach(node => {
    const degree = nodeDegrees.get(node.id) || 0;
    if (degree === 0) {
      orphanNodes.push(node.id);
      warnings.push({
        type: 'orphan_node',
        message: `Node ${node.id} has no connections (degree 0)`,
        nodeId: node.id,
      });
    }

    if (!node.properties.commune) {
      warnings.push({
        type: 'missing_commune',
        message: `Node ${node.id} has no commune attribution`,
        nodeId: node.id,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    orphanNodes,
  };
}

/**
 * Filter out orphan nodes from a GraphML document
 * Implements Constitution Principle III: No Orphan Nodes
 * @param doc - The GraphMLDocument to filter
 * @returns New GraphMLDocument with orphan nodes removed
 */
export function filterOrphanNodes(doc: GraphMLDocument): GraphMLDocument {
  const validation = validateGraphML(doc);
  const orphanSet = new Set(validation.orphanNodes);

  const filteredNodes = doc.nodes.filter(n => !orphanSet.has(n.id));

  return {
    nodes: filteredNodes,
    edges: doc.edges,
    metadata: {
      ...doc.metadata,
      nodeCount: filteredNodes.length,
    },
  };
}
