'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GraphMLDocument, ValidationResult } from '@/types/graphml';
import { parseGraphML, validateGraphML, filterOrphanNodes } from '@/lib/utils/graphml-parser';

export interface UseGraphMLDataOptions {
  url?: string;
  filterOrphans?: boolean;
  onLoad?: (doc: GraphMLDocument) => void;
  onError?: (error: Error) => void;
}

export interface UseGraphMLDataReturn {
  document: GraphMLDocument | null;
  validation: ValidationResult | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

const DEFAULT_GRAPHML_URL = '/data/grand-debat.graphml';

/**
 * React hook for loading and managing GraphML data
 * Implements Constitution Principle III (No Orphan Nodes) via optional filtering
 *
 * @param options - Configuration options
 * @returns GraphML data, validation results, and loading state
 */
export function useGraphMLData(options: UseGraphMLDataOptions = {}): UseGraphMLDataReturn {
  const {
    url = DEFAULT_GRAPHML_URL,
    filterOrphans = true,
    onLoad,
    onError,
  } = options;

  const [document, setDocument] = useState<GraphMLDocument | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use refs for callbacks to avoid dependency issues causing infinite reloads
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const hasLoadedRef = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);

  const loadGraphML = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📊 Loading GraphML from ${url}...`);
      const startTime = performance.now();

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch GraphML: ${response.status} ${response.statusText}`);
      }

      const xmlString = await response.text();
      console.log(`📥 Fetched ${(xmlString.length / 1024).toFixed(1)}KB of GraphML data`);

      // Parse the GraphML
      let parsedDoc = parseGraphML(xmlString, url.split('/').pop() || 'unknown');
      console.log(`✅ Parsed ${parsedDoc.nodes.length} nodes and ${parsedDoc.edges.length} edges`);

      // Validate the document
      const validationResult = validateGraphML(parsedDoc);
      setValidation(validationResult);

      if (!validationResult.valid) {
        console.warn('⚠️ GraphML validation errors:', validationResult.errors);
      }

      if (validationResult.orphanNodes.length > 0) {
        console.warn(`⚠️ Found ${validationResult.orphanNodes.length} orphan nodes`);
      }

      // Filter orphan nodes if requested (Constitution Principle III)
      if (filterOrphans && validationResult.orphanNodes.length > 0) {
        console.log(`🔍 Filtering ${validationResult.orphanNodes.length} orphan nodes...`);
        parsedDoc = filterOrphanNodes(parsedDoc);
        console.log(`✅ Filtered to ${parsedDoc.nodes.length} nodes with connections`);
      }

      const loadTime = performance.now() - startTime;
      console.log(`⏱️ GraphML loaded in ${loadTime.toFixed(0)}ms`);

      setDocument(parsedDoc);
      onLoadRef.current?.(parsedDoc);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('❌ Failed to load GraphML:', error);
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [url, filterOrphans]);

  // Only load once on mount (or when url/filterOrphans change)
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadGraphML();
    }
  }, [loadGraphML]);

  return {
    document,
    validation,
    isLoading,
    error,
    reload: loadGraphML,
  };
}

/**
 * Transform GraphML document to reconciliation data format
 * Used for compatibility with existing visualization components
 */
export function transformToReconciliationData(doc: GraphMLDocument) {
  return {
    nodes: doc.nodes.map(node => ({
      id: node.id,
      labels: node.labels,
      properties: node.properties,
      degree: node.properties.degree || 0,
      centrality_score: node.properties.centrality_score || 0.5,
    })),
    relationships: doc.edges.map(edge => ({
      id: edge.id,
      type: edge.type,
      source: edge.source,
      target: edge.target,
      properties: edge.properties,
    })),
  };
}
