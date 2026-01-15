# Agent GraphRAG Search Integration for Borges Library Web

## 🎯 Mission Overview

Integrate a GraphRAG-powered search bar into the Borges Library Web interface (https://borges-library-web.vercel.app/) that allows users to query the knowledge graph using natural language, providing answers similar to what developers get using the nano-graphrag repository directly.

## 📌 Context

### Current Architecture

1. **Backend Systems**:
   - **GraphRAG API** (`/nano-graphrag/graphrag_api.py`): Flask API with `/query`, `/books`, `/health` endpoints
   - **Neo4j Database**: Main graph database storing entities, relationships, and communities
   - **nano-graphrag**: Python library for RAG queries on the graph

2. **Frontend** (`/borges-library-web`):
   - Next.js application with TypeScript
   - 3D/2D graph visualization 
   - Neo4j integration via `/lib/neo4j/queries.ts`
   - Entity types: Personnes (persons), Lieux (places), Événements (events), Concepts, Organisations, Livres (books), Communautés (communities)
   - Currently displays 499 entities and 1976 connections

3. **Data Flow**:
   - Books stored as folders with GraphRAG data (text chunks, entities, relations, community reports)
   - Graph visualization shows interconnected literary concepts from various works
   - Each book has its own GraphRAG instance

## 🛠️ Implementation Plan

### Phase 1: Backend API Integration

1. **Deploy/Connect GraphRAG API**:
   ```bash
   cd /Users/arthursarazin/Documents/nano-graphrag
   python graphrag_api.py  # Runs on port 5001
   ```

2. **Update CORS Configuration** (`graphrag_api.py`):
   ```python
   CORS(app, origins=[
       "http://localhost:3000",
       "http://localhost:3001", 
       "https://borges-library-web.vercel.app",
       "https://*.vercel.app"  # For preview deployments
   ])
   ```

3. **Environment Variables** (`.env.local`):
   ```
   NEXT_PUBLIC_GRAPHRAG_API_URL=http://localhost:5001
   # or production URL when deployed
   ```

### Phase 2: Create Search Service

Create `/borges-library-web/lib/services/graphrag.ts`:

```typescript
interface SearchResult {
  success: boolean;
  answer: string;
  searchPath: {
    entities: Array<{
      id: string;
      type: string;
      description: string;
      rank: number;
      order: number;
      score: number;
    }>;
    relations: Array<{
      source: string;
      target: string;
      description: string;
      weight: number;
      rank: number;
      traversalOrder: number;
    }>;
    communities: Array<{
      id: string;
      content: string;
      relevance: number;
    }>;
  };
  book_id: string;
  mode: 'local' | 'global';
  query: string;
}

export class GraphRAGService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_GRAPHRAG_API_URL || 'http://localhost:5001';
  }

  async query(
    text: string, 
    mode: 'local' | 'global' = 'local', 
    bookId?: string
  ): Promise<SearchResult> {
    const response = await fetch(`${this.apiUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: text, 
        mode, 
        book_id: bookId 
      })
    });
    
    if (!response.ok) {
      throw new Error('Query failed');
    }
    
    return response.json();
  }

  async getBooks(): Promise<{ books: Array<{ id: string; name: string; has_data: boolean }> }> {
    const response = await fetch(`${this.apiUrl}/books`);
    return response.json();
  }
}
```

### Phase 3: Create Search Component

Create `/borges-library-web/components/GraphRAGSearch.tsx`:

```tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Sparkles, Book, X, ChevronDown, Loader2 } from 'lucide-react';
import { GraphRAGService } from '@/lib/services/graphrag';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export interface GraphRAGSearchProps {
  onSearchResult?: (result: any) => void;
  onHighlightPath?: (path: any) => void;
  onClearHighlight?: () => void;
}

const graphRAGService = new GraphRAGService();

export const GraphRAGSearch: React.FC<GraphRAGSearchProps> = ({
  onSearchResult,
  onHighlightPath,
  onClearHighlight
}) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'local' | 'global'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sample queries for inspiration
  const sampleQueries = [
    "Quels sont les thèmes principaux de cette œuvre ?",
    "Analyse les personnages et leurs relations",
    "Quelle est la structure narrative ?",
    "Comment les concepts philosophiques sont-ils interconnectés ?",
    "Explore les lieux et leur symbolisme"
  ];

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setShowResults(false);
    
    try {
      const result = await graphRAGService.query(query, mode);
      setSearchResult(result);
      setShowResults(true);
      
      if (onSearchResult) {
        onSearchResult(result);
      }
      
      if (onHighlightPath && result.searchPath) {
        onHighlightPath(result.searchPath);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResult({
        success: false,
        answer: "Désolé, une erreur s'est produite lors de la recherche.",
        searchPath: { entities: [], relations: [], communities: [] }
      });
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  }, [query, mode, onSearchResult, onHighlightPath]);

  const handleClear = () => {
    setQuery('');
    setSearchResult(null);
    setShowResults(false);
    if (onClearHighlight) {
      onClearHighlight();
    }
  };

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Search Bar */}
      <div 
        ref={searchRef}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4"
      >
        <motion.div
          animate={{
            width: isExpanded ? '100%' : '300px'
          }}
          className="mx-auto"
        >
          <div className="relative">
            {/* Main Search Input */}
            <div className="relative bg-black/80 backdrop-blur-xl border border-amber-500/30 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center p-3">
                <Search className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsExpanded(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Explorez le graphe de connaissances..."
                  className="flex-1 bg-transparent text-amber-100 placeholder-amber-500/50 outline-none text-sm"
                />
                {query && (
                  <button
                    onClick={handleClear}
                    className="p-1 hover:bg-amber-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-amber-500" />
                  </button>
                )}
                {isLoading && (
                  <Loader2 className="w-5 h-5 text-amber-500 ml-2 animate-spin" />
                )}
              </div>

              {/* Mode Toggle and Search Button */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="border-t border-amber-500/20 p-3 flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMode('local')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            mode === 'local' 
                              ? 'bg-amber-500 text-black' 
                              : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          Local
                        </button>
                        <button
                          onClick={() => setMode('global')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            mode === 'global' 
                              ? 'bg-amber-500 text-black' 
                              : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                          }`}
                        >
                          <Book className="w-3 h-3 inline mr-1" />
                          Global
                        </button>
                      </div>
                      <button
                        onClick={handleSearch}
                        disabled={!query.trim() || isLoading}
                        className="px-4 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-lg text-xs hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Rechercher
                      </button>
                    </div>

                    {/* Sample Queries */}
                    <div className="border-t border-amber-500/20 p-3">
                      <div className="text-amber-500/50 text-xs mb-2">Essayez :</div>
                      <div className="space-y-1">
                        {sampleQueries.slice(0, 3).map((sample, idx) => (
                          <button
                            key={idx}
                            onClick={() => setQuery(sample)}
                            className="block w-full text-left text-xs text-amber-400/70 hover:text-amber-400 transition-colors truncate"
                          >
                            → {sample}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Results Panel */}
      <AnimatePresence>
        {showResults && searchResult && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-black/90 backdrop-blur-xl border-l border-amber-500/30 z-40 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-amber-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-amber-500 mb-2">Résultats GraphRAG</h2>
                    <p className="text-xs text-amber-500/50">Mode: {mode} | Livre: {searchResult.book_id || 'Tous'}</p>
                  </div>
                  <button
                    onClick={() => setShowResults(false)}
                    className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-amber-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Answer */}
                <div className="prose prose-amber prose-invert max-w-none">
                  <h3 className="text-amber-500 text-sm font-semibold mb-3">Réponse</h3>
                  <div className="text-amber-100/90 text-sm leading-relaxed">
                    <ReactMarkdown>{searchResult.answer}</ReactMarkdown>
                  </div>
                </div>

                {/* Search Path Visualization */}
                {searchResult.searchPath && (
                  <>
                    {/* Entities Traversed */}
                    {searchResult.searchPath.entities.length > 0 && (
                      <div>
                        <h3 className="text-amber-500 text-sm font-semibold mb-3">
                          Entités Explorées ({searchResult.searchPath.entities.length})
                        </h3>
                        <div className="space-y-2">
                          {searchResult.searchPath.entities.slice(0, 5).map((entity: any, idx: number) => (
                            <div 
                              key={idx}
                              className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-amber-400 text-sm">{entity.id}</div>
                                  <div className="text-xs text-amber-500/50 mt-1">{entity.type}</div>
                                  {entity.description && (
                                    <div className="text-xs text-amber-100/60 mt-1">{entity.description}</div>
                                  )}
                                </div>
                                <div className="ml-3 text-xs text-amber-500/70">
                                  #{entity.order}
                                </div>
                              </div>
                              {/* Relevance score bar */}
                              <div className="mt-2 h-1 bg-amber-500/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                                  style={{ width: `${entity.score * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Relations */}
                    {searchResult.searchPath.relations.length > 0 && (
                      <div>
                        <h3 className="text-amber-500 text-sm font-semibold mb-3">
                          Relations Parcourues ({searchResult.searchPath.relations.length})
                        </h3>
                        <div className="space-y-2">
                          {searchResult.searchPath.relations.slice(0, 5).map((rel: any, idx: number) => (
                            <div 
                              key={idx}
                              className="flex items-center gap-2 text-xs text-amber-100/70"
                            >
                              <span className="text-amber-400">{rel.source}</span>
                              <span className="text-amber-500/50">→</span>
                              <span className="text-amber-400">{rel.target}</span>
                              {rel.description && (
                                <span className="text-amber-500/50 italic">({rel.description})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Communities */}
                    {searchResult.searchPath.communities && searchResult.searchPath.communities.length > 0 && (
                      <div>
                        <h3 className="text-amber-500 text-sm font-semibold mb-3">
                          Communautés Identifiées
                        </h3>
                        <div className="space-y-2">
                          {searchResult.searchPath.communities.map((community: any, idx: number) => (
                            <div 
                              key={idx}
                              className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3"
                            >
                              <div className="text-xs text-purple-400">{community.content}</div>
                              <div className="mt-1 text-xs text-purple-500/50">
                                Pertinence: {(community.relevance * 100).toFixed(0)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Query Info */}
                <div className="pt-4 border-t border-amber-500/20">
                  <div className="text-xs text-amber-500/50">
                    <div>Question: "{searchResult.query}"</div>
                    <div className="mt-1">Temps de traitement: ~2s</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GraphRAGSearch;
```

### Phase 4: Graph Highlighting Integration

Create `/borges-library-web/lib/utils/graphHighlight.ts`:

```typescript
interface SearchPath {
  entities: Array<{ id: string; score: number; order: number }>;
  relations: Array<{ source: string; target: string; traversalOrder: number }>;
  communities: Array<{ id: string; relevance: number }>;
}

export class GraphHighlighter {
  private originalNodeStates: Map<string, any> = new Map();
  private originalEdgeStates: Map<string, any> = new Map();

  highlightSearchPath(graphData: any, searchPath: SearchPath) {
    // Store original states
    this.storeOriginalStates(graphData);

    // Create lookup sets
    const entityIds = new Set(searchPath.entities.map(e => e.id));
    const relationPairs = new Set(
      searchPath.relations.map(r => `${r.source}-${r.target}`)
    );

    // Update nodes
    graphData.nodes.forEach((node: any) => {
      if (entityIds.has(node.id)) {
        const entity = searchPath.entities.find(e => e.id === node.id);
        if (entity) {
          // Highlight matched nodes
          node.highlighted = true;
          node.searchScore = entity.score;
          node.searchOrder = entity.order;
          
          // Visual enhancements
          node.color = this.interpolateColor(entity.score);
          node.size = (node.size || 1) * (1 + entity.score * 0.5);
          node.opacity = 1;
          node.glow = true;
        }
      } else {
        // Fade non-matching nodes
        node.highlighted = false;
        node.opacity = 0.2;
        node.color = this.fadeColor(node.color || '#666666');
      }
    });

    // Update edges
    graphData.edges.forEach((edge: any) => {
      const key = `${edge.source}-${edge.target}`;
      const reverseKey = `${edge.target}-${edge.source}`;
      
      if (relationPairs.has(key) || relationPairs.has(reverseKey)) {
        const relation = searchPath.relations.find(
          r => (r.source === edge.source && r.target === edge.target) ||
               (r.source === edge.target && r.target === edge.source)
        );
        
        if (relation) {
          edge.highlighted = true;
          edge.traversalOrder = relation.traversalOrder;
          edge.opacity = 1;
          edge.width = 3;
          edge.animated = true;
        }
      } else {
        edge.highlighted = false;
        edge.opacity = 0.1;
        edge.width = 1;
      }
    });

    return graphData;
  }

  clearHighlight(graphData: any) {
    // Restore original states
    graphData.nodes.forEach((node: any) => {
      const original = this.originalNodeStates.get(node.id);
      if (original) {
        Object.assign(node, original);
      }
    });

    graphData.edges.forEach((edge: any) => {
      const key = `${edge.source}-${edge.target}`;
      const original = this.originalEdgeStates.get(key);
      if (original) {
        Object.assign(edge, original);
      }
    });

    this.originalNodeStates.clear();
    this.originalEdgeStates.clear();
    
    return graphData;
  }

  private storeOriginalStates(graphData: any) {
    graphData.nodes.forEach((node: any) => {
      this.originalNodeStates.set(node.id, { ...node });
    });

    graphData.edges.forEach((edge: any) => {
      const key = `${edge.source}-${edge.target}`;
      this.originalEdgeStates.set(key, { ...edge });
    });
  }

  private interpolateColor(score: number): string {
    // Gradient from yellow to red based on score
    const r = 255;
    const g = Math.floor(255 * (1 - score * 0.5));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }

  private fadeColor(color: string): string {
    // Convert to RGBA with low opacity
    return color + '33'; // Add 20% opacity
  }

  animateTraversal(graphData: any, searchPath: SearchPath, onFrame: (data: any) => void) {
    const animationSteps = searchPath.entities.length + searchPath.relations.length;
    let currentStep = 0;

    const animate = () => {
      if (currentStep >= animationSteps) return;

      // Animate entities
      if (currentStep < searchPath.entities.length) {
        const entity = searchPath.entities[currentStep];
        const node = graphData.nodes.find((n: any) => n.id === entity.id);
        if (node) {
          node.pulsing = true;
          setTimeout(() => { node.pulsing = false; }, 500);
        }
      }

      // Animate relations
      else {
        const relIndex = currentStep - searchPath.entities.length;
        const relation = searchPath.relations[relIndex];
        const edge = graphData.edges.find((e: any) => 
          (e.source === relation.source && e.target === relation.target) ||
          (e.target === relation.source && e.source === relation.target)
        );
        if (edge) {
          edge.flowing = true;
          setTimeout(() => { edge.flowing = false; }, 500);
        }
      }

      onFrame(graphData);
      currentStep++;
      setTimeout(animate, 300);
    };

    animate();
  }
}
```

## 🚀 Deployment & Testing

See complete deployment steps, testing plan, and advanced features in the full documentation above.

This implementation will transform the Borges Library Web into an intelligent, searchable knowledge graph interface.