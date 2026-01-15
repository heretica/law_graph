interface SearchPath {
  entities: Array<{
    id: string;
    score: number;
    order: number;
    type?: string;
    description?: string;
  }>;
  relations: Array<{
    source: string;
    target: string;
    traversalOrder: number;
    weight?: number;
    description?: string;
  }>;
  communities: Array<{
    id: string;
    relevance: number;
  }>;
}

interface D3Node {
  id: string;
  label: string;
  type: string;
  color: string;
  size: number;
  visible: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  degree: number;
  centrality_score: number;
  // Highlighting states
  highlighted?: boolean;
  dimmed?: boolean;
  searchOrder?: number;
  searchScore?: number;
  // NanoGraphRAG intelligence properties
  semanticScore?: number;
  reasoningImportance?: number;
  contextualRelevance?: number;
  pulseIntensity?: 'low' | 'medium' | 'high';
}

interface D3Link {
  id: string;
  source: string | number | D3Node;
  target: string | number | D3Node;
  relation: string;
  weight: number;
  // Highlighting states
  highlighted?: boolean;
  dimmed?: boolean;
  traversalOrder?: number;
  // NanoGraphRAG intelligence properties
  reasoningPriority?: number;
  strokeWidth?: number;
  strokeDashArray?: string;
  animationDelay?: number;
  opacity?: number;
  secondary?: boolean;
  contextual?: boolean;
}

export class GraphHighlighter {
  private originalNodeStates: Map<string, Partial<D3Node>> = new Map();
  private originalLinkStates: Map<string, Partial<D3Link>> = new Map();
  private highlightedNodes: Set<string> = new Set();
  private highlightedLinks: Set<string> = new Set();

  /**
   * Store original states before highlighting
   */
  private storeOriginalStates(nodes: D3Node[], links: D3Link[]) {
    // Store node states
    nodes.forEach(node => {
      this.originalNodeStates.set(node.id, {
        color: node.color,
        size: node.size,
        highlighted: node.highlighted || false,
        dimmed: node.dimmed || false
      });
    });

    // Store link states
    links.forEach(link => {
      this.originalLinkStates.set(link.id, {
        highlighted: link.highlighted || false,
        dimmed: link.dimmed || false
      });
    });
  }

  /**
   * Highlight nodes and relationships based on search path with nanographRAG intelligence visualization
   */
  highlightSearchPath(nodes: D3Node[], links: D3Link[], searchPath: SearchPath): {
    nodes: D3Node[];
    links: D3Link[];
  } {
    console.log('🧠 NanoGraphRAG Intelligence Highlighting:', searchPath);

    // Store original states
    this.storeOriginalStates(nodes, links);

    // Create lookup sets for fast checking
    const searchEntityIds = new Set(searchPath.entities.map(e => e.id));
    const searchEntityMap = new Map(searchPath.entities.map(e => [e.id, e]));

    // Enhanced fuzzy matching with nanographRAG semantic understanding
    const createSemanticMatcher = (searchEntities: any[], nodes: D3Node[]): { matches: Map<string, any>, semanticScores: Map<string, number> } => {
      const matches = new Map<string, any>();
      const semanticScores = new Map<string, number>();

      searchEntities.forEach(entity => {
        // Direct match first
        const directMatch = nodes.find(node => node.id === entity.id);
        if (directMatch) {
          matches.set(directMatch.id, entity);
          semanticScores.set(directMatch.id, 1.0);
          return;
        }

        // Multi-level semantic matching inspired by nanographRAG
        const entityTokens = this.tokenizeEntity(entity.id);
        let bestMatch: D3Node | null = null;
        let bestScore = 0;

        for (const node of nodes) {
          const nodeTokens = this.tokenizeEntity(node.id);
          const labelTokens = this.tokenizeEntity(node.label || '');

          // Calculate semantic similarity score
          const nameScore = this.calculateSemanticSimilarity(entityTokens, nodeTokens);
          const labelScore = this.calculateSemanticSimilarity(entityTokens, labelTokens);
          const maxScore = Math.max(nameScore, labelScore);

          if (maxScore > bestScore && maxScore > 0.3) { // Threshold for semantic relevance
            bestScore = maxScore;
            bestMatch = node;
          }
        }

        if (bestMatch !== null) {
          matches.set(bestMatch.id, entity);
          semanticScores.set(bestMatch.id, bestScore);
          console.log(`🧠 Semantic match: "${entity.id}" → "${bestMatch.id}" (score: ${bestScore.toFixed(2)})`);
        }
      });

      return { matches, semanticScores };
    };

    const { matches: fuzzyMatches, semanticScores } = createSemanticMatcher(searchPath.entities, nodes);

    // Create enhanced relation lookup with traversal intelligence
    const searchRelations = new Set();
    const searchRelationMap = new Map();
    const relationPriority = new Map();

    searchPath.relations.forEach((rel, index) => {
      const relKey = `${rel.source}-${rel.target}`;
      const reverseKey = `${rel.target}-${rel.source}`;
      searchRelations.add(relKey);
      searchRelations.add(reverseKey);
      searchRelationMap.set(relKey, rel);
      searchRelationMap.set(reverseKey, rel);
      // Higher priority for earlier traversal steps
      relationPriority.set(relKey, 1.0 - (index / searchPath.relations.length));
      relationPriority.set(reverseKey, 1.0 - (index / searchPath.relations.length));
    });

    console.log(`🧠 GraphRAG Analysis: ${searchEntityIds.size} entities, ${searchRelations.size} relations`);
    console.log(`🎯 Semantic matches: ${fuzzyMatches.size}`);

    // Process nodes with intelligence-based visual encoding
    const highlightedNodes = nodes.map(node => {
      const isInSearchPath = searchEntityIds.has(node.id) || fuzzyMatches.has(node.id);
      const searchEntity = searchEntityMap.get(node.id) || fuzzyMatches.get(node.id);
      const semanticScore = semanticScores.get(node.id) || 0;

      if (isInSearchPath && searchEntity) {
        // Node is part of GraphRAG reasoning path
        this.highlightedNodes.add(node.id);

        const intelligenceScore = searchEntity.score * (semanticScore || 1.0);
        const reasoningImportance = this.calculateReasoningImportance(searchEntity, searchPath);

        return {
          ...node,
          highlighted: true,
          dimmed: false,
          searchOrder: searchEntity.order,
          searchScore: searchEntity.score,
          semanticScore,
          reasoningImportance,
          // NanoGraphRAG-inspired visual encoding
          color: this.getIntelligenceColor(node.type, intelligenceScore, reasoningImportance),
          size: this.getIntelligenceSize(node.size, intelligenceScore, reasoningImportance),
          // Add pulsing effect for high-importance nodes
          pulseIntensity: (reasoningImportance > 0.8 ? 'high' : reasoningImportance > 0.5 ? 'medium' : 'low') as 'low' | 'medium' | 'high'
        };
      } else {
        // Node is not in reasoning path - apply contextual dimming
        const contextualRelevance = this.calculateContextualRelevance(node, fuzzyMatches);

        return {
          ...node,
          highlighted: false,
          dimmed: true,
          contextualRelevance,
          // Subtle context-based coloring
          color: this.getContextualColor(node.color, contextualRelevance),
          size: Math.max(node.size * (0.5 + contextualRelevance * 0.3), 3)
        };
      }
    });

    // Process links with traversal intelligence
    const highlightedLinks = links.map(link => {
      const sourceId = typeof link.source === 'string' ? link.source :
                       typeof link.source === 'number' ? link.source.toString() : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target :
                       typeof link.target === 'number' ? link.target.toString() : link.target.id;
      const relKey = `${sourceId}-${targetId}`;
      const reverseKey = `${targetId}-${sourceId}`;

      const isInSearchPath = searchRelations.has(relKey) || searchRelations.has(reverseKey);
      const searchRelation = searchRelationMap.get(relKey) || searchRelationMap.get(reverseKey);
      const priority = relationPriority.get(relKey) || relationPriority.get(reverseKey) || 0;

      if (isInSearchPath && searchRelation) {
        // Link is part of reasoning traversal
        this.highlightedLinks.add(link.id);

        return {
          ...link,
          highlighted: true,
          dimmed: false,
          traversalOrder: searchRelation.traversalOrder,
          reasoningPriority: priority,
          // Visual encoding of reasoning flow
          strokeWidth: 2 + (priority * 3),
          strokeDashArray: this.getReasoningPattern(priority),
          animationDelay: searchRelation.traversalOrder * 0.2
        };
      } else {
        // Check for secondary connections (GraphRAG context)
        const sourceHighlighted = this.highlightedNodes.has(sourceId);
        const targetHighlighted = this.highlightedNodes.has(targetId);

        if (sourceHighlighted && targetHighlighted) {
          // Secondary reasoning connection
          return {
            ...link,
            highlighted: true,
            dimmed: false,
            secondary: true,
            strokeWidth: 1.5,
            opacity: 0.7
          };
        } else if (sourceHighlighted || targetHighlighted) {
          // Contextual connection
          return {
            ...link,
            highlighted: false,
            dimmed: false,
            contextual: true,
            strokeWidth: 1,
            opacity: 0.4
          };
        } else {
          // Background connection
          return {
            ...link,
            highlighted: false,
            dimmed: true,
            strokeWidth: 0.5,
            opacity: 0.1
          };
        }
      }
    });

    console.log(`🧠 GraphRAG Intelligence: ${this.highlightedNodes.size} nodes, ${this.highlightedLinks.size} primary links highlighted`);

    return {
      nodes: highlightedNodes,
      links: highlightedLinks
    };
  }

  /**
   * Tokenize entity for semantic matching
   */
  private tokenizeEntity(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * Calculate semantic similarity between token sets
   */
  private calculateSemanticSimilarity(tokens1: string[], tokens2: string[]): number {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    // Jaccard similarity with substring matching
    let intersection = 0;
    let union = new Set([...tokens1, ...tokens2]).size;

    for (const token1 of tokens1) {
      for (const token2 of tokens2) {
        if (token1 === token2 ||
            token1.includes(token2) ||
            token2.includes(token1) ||
            this.levenshteinDistance(token1, token2) <= 1) {
          intersection++;
          break;
        }
      }
    }

    return intersection / Math.max(tokens1.length, tokens2.length);
  }

  /**
   * Calculate Levenshtein distance for fuzzy string matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate reasoning importance based on GraphRAG metrics
   */
  private calculateReasoningImportance(entity: any, searchPath: SearchPath): number {
    const orderImportance = 1.0 - (entity.order / searchPath.entities.length);
    const scoreImportance = entity.score || 0;
    const centralityBonus = searchPath.entities.length > 5 && entity.order <= 2 ? 0.3 : 0;

    return Math.min((orderImportance * 0.4 + scoreImportance * 0.6 + centralityBonus), 1.0);
  }

  /**
   * Calculate contextual relevance for non-highlighted nodes
   */
  private calculateContextualRelevance(node: D3Node, highlightedMatches: Map<string, any>): number {
    // Base relevance on centrality and degree
    const centralityRelevance = node.centrality_score || 0;
    const degreeRelevance = Math.min(node.degree / 10, 0.3);

    // Check if node is semantically related to highlighted nodes
    let semanticRelevance = 0;
    const nodeTokens = this.tokenizeEntity(node.id);

    highlightedMatches.forEach((entity, _) => {
      const entityTokens = this.tokenizeEntity(entity.id);
      const similarity = this.calculateSemanticSimilarity(nodeTokens, entityTokens);
      semanticRelevance = Math.max(semanticRelevance, similarity * 0.4);
    });

    return Math.min(centralityRelevance * 0.4 + degreeRelevance * 0.3 + semanticRelevance * 0.3, 0.8);
  }

  /**
   * Get intelligence-based color encoding
   */
  private getIntelligenceColor(nodeType: string, intelligenceScore: number, reasoningImportance: number): string {
    const baseColors = {
      'Personnes': { r: 255, g: 107, b: 107 },
      'Lieux': { r: 78, g: 205, b: 196 },
      'Événements': { r: 69, g: 183, b: 209 },
      'Concepts': { r: 150, g: 206, b: 180 },
      'Organisations': { r: 254, g: 202, b: 87 },
      'Livres': { r: 255, g: 159, b: 243 },
      'default': { r: 168, g: 168, b: 168 }
    };

    const baseColor = baseColors[nodeType as keyof typeof baseColors] || baseColors.default;

    // Enhance color based on intelligence metrics
    const intensityMultiplier = 0.7 + (intelligenceScore * 0.6);
    const brightnessBoost = reasoningImportance * 50;

    return `rgb(${Math.min(255, Math.floor(baseColor.r * intensityMultiplier + brightnessBoost))}, ${Math.min(255, Math.floor(baseColor.g * intensityMultiplier + brightnessBoost))}, ${Math.min(255, Math.floor(baseColor.b * intensityMultiplier + brightnessBoost))})`;
  }

  /**
   * Get intelligence-based size encoding
   */
  private getIntelligenceSize(baseSize: number, intelligenceScore: number, reasoningImportance: number): number {
    const sizeMultiplier = 1.2 + (intelligenceScore * 0.8) + (reasoningImportance * 0.5);
    return Math.max(baseSize * sizeMultiplier, 8);
  }

  /**
   * Get contextual color for dimmed nodes
   */
  private getContextualColor(originalColor: string, relevance: number): string {
    const dimFactor = 0.2 + (relevance * 0.3);
    return originalColor.replace(/rgb?\(([^)]+)\)/, (match, values) => {
      const [r, g, b] = values.split(',').map((v: string) => parseInt(v.trim()));
      return `rgb(${Math.floor(r * dimFactor)}, ${Math.floor(g * dimFactor)}, ${Math.floor(b * dimFactor)})`;
    });
  }

  /**
   * Get reasoning pattern for link visualization
   */
  private getReasoningPattern(priority: number): string {
    if (priority > 0.8) return 'none'; // Solid line for high priority
    if (priority > 0.5) return '5,2'; // Dashed for medium priority
    return '2,3'; // Dotted for low priority
  }

  /**
   * Get highlight color based on node type and relevance score (legacy method)
   */
  private getHighlightColor(nodeType: string, score: number): string {
    return this.getIntelligenceColor(nodeType, score, score);
  }

  /**
   * Get dimmed version of a color
   */
  private getDimmedColor(originalColor: string): string {
    // Convert to a muted version
    return originalColor.replace(/rgb?\(([^)]+)\)/, (match, values) => {
      const [r, g, b] = values.split(',').map((v: string) => parseInt(v.trim()));
      return `rgb(${Math.floor(r * 0.3)}, ${Math.floor(g * 0.3)}, ${Math.floor(b * 0.3)})`;
    });
  }

  /**
   * Brighten a hex color
   */
  private brightenColor(hex: string, factor: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Brighten
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor * 0.3));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor * 0.3));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor * 0.3));

    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  /**
   * Clear all highlighting and restore original states
   */
  clearHighlight(nodes: D3Node[], links: D3Link[]): {
    nodes: D3Node[];
    links: D3Link[];
  } {
    console.log('🧹 Clearing graph highlighting');

    // Restore nodes
    const restoredNodes = nodes.map(node => {
      const original = this.originalNodeStates.get(node.id);
      if (original) {
        return {
          ...node,
          ...original,
          highlighted: false,
          dimmed: false,
          searchOrder: undefined,
          searchScore: undefined
        };
      }
      return {
        ...node,
        highlighted: false,
        dimmed: false,
        searchOrder: undefined,
        searchScore: undefined
      };
    });

    // Restore links
    const restoredLinks = links.map(link => {
      const original = this.originalLinkStates.get(link.id);
      if (original) {
        return {
          ...link,
          ...original,
          highlighted: false,
          dimmed: false,
          traversalOrder: undefined
        };
      }
      return {
        ...link,
        highlighted: false,
        dimmed: false,
        traversalOrder: undefined
      };
    });

    // Clear internal state
    this.highlightedNodes.clear();
    this.highlightedLinks.clear();
    this.originalNodeStates.clear();
    this.originalLinkStates.clear();

    return {
      nodes: restoredNodes,
      links: restoredLinks
    };
  }

  /**
   * Get highlighting statistics
   */
  getHighlightStats(): {
    highlightedNodes: number;
    highlightedLinks: number;
    totalNodes: number;
    totalLinks: number;
  } {
    return {
      highlightedNodes: this.highlightedNodes.size,
      highlightedLinks: this.highlightedLinks.size,
      totalNodes: this.originalNodeStates.size,
      totalLinks: this.originalLinkStates.size
    };
  }
}

export const graphHighlighter = new GraphHighlighter();