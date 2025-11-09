'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'

interface Node {
  id: string
  label: string
  type: string
  degree: number
  centrality_score: number
  color: string
  size: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Link {
  id: string
  source: string | Node
  target: string | Node
  relation: string
  weight: number
}

interface ReconciliationData {
  nodes: Array<{
    id: string
    labels: string[]
    properties: Record<string, any>
    degree: number
    centrality_score: number
  }>
  relationships: Array<{
    id: string
    type: string
    source: string
    target: string
    properties: Record<string, any>
  }>
}

interface GraphVisualizationD3Props {
  reconciliationData?: ReconciliationData | null
  searchPath?: any
  onNodeVisibilityChange?: (nodeIds: string[]) => void
}

export default function GraphVisualizationD3({
  reconciliationData,
  searchPath,
  onNodeVisibilityChange
}: GraphVisualizationD3Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // Color mapping for different node types
  const typeColors = {
    'Personnes': '#ff4757',       // Bright red
    'Lieux': '#00d2d3',          // Cyan
    'Événements': '#5352ed',     // Blue
    'Concepts': '#7bed9f',       // Green
    'Organisations': '#ffa502',  // Orange
    'Livres': '#ff6348',         // Pink/coral
    'BOOK': '#ff6348',           // Pink/coral (alternative key)
    'PERSON': '#ff4757',         // Bright red (alternative key)
    'GEO': '#00d2d3',           // Cyan (alternative key)
    'EVENT': '#5352ed',         // Blue (alternative key)
    'CONCEPT': '#7bed9f',       // Green (alternative key)
    'ORGANIZATION': '#ffa502',   // Orange (alternative key)
    'default': '#dfe4ea'         // Light gray
  }

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: container.clientHeight
          })
        }
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Process data and create D3 force simulation
  useEffect(() => {
    if (!reconciliationData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous content

    // Sort nodes by degree and take top 300
    const sortedNodes = [...reconciliationData.nodes]
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 300)

    // Create D3 nodes
    const nodes: Node[] = sortedNodes.map(node => {
      const nodeType = node.labels[0] || 'default'
      const color = typeColors[nodeType as keyof typeof typeColors] || typeColors.default
      const size = Math.max(Math.log(node.degree + 1) * 4 + 5, 8)

      return {
        id: node.id,
        label: node.properties.name || node.properties.title || node.id,
        type: nodeType,
        degree: node.degree,
        centrality_score: node.centrality_score,
        color,
        size
      }
    })

    // Create D3 links (filter to only connect nodes in our top 300)
    const nodeIds = new Set(sortedNodes.map(n => n.id))
    const links: Link[] = reconciliationData.relationships
      .filter(rel => nodeIds.has(rel.source) && nodeIds.has(rel.target))
      .slice(0, 800) // Limit links for performance
      .map(rel => ({
        id: rel.id,
        source: rel.source,
        target: rel.target,
        relation: rel.type,
        weight: rel.properties.weight || 1
      }))

    // Create highlighted sets from search path
    const highlightedEntityIds = new Set(
      searchPath?.entities?.map((entity: any) => entity.id) || []
    )
    const highlightedRelationPairs = new Set(
      searchPath?.relations?.map((relation: any) => `${relation.source}-${relation.target}`) || []
    )

    // Create force simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as Node).size + 2))

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create main group for all graph elements
    const g = svg.append('g')

    // Create links
    const linkElements = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        const linkPair = `${typeof d.source === 'string' ? d.source : d.source.id}-${typeof d.target === 'string' ? d.target : d.target.id}`
        const reverseLinkPair = `${typeof d.target === 'string' ? d.target : d.target.id}-${typeof d.source === 'string' ? d.source : d.source.id}`
        const isHighlighted = highlightedRelationPairs.has(linkPair) || highlightedRelationPairs.has(reverseLinkPair)
        return isHighlighted ? '#00ff88' : '#999'
      })
      .attr('stroke-width', (d) => {
        const linkPair = `${typeof d.source === 'string' ? d.source : d.source.id}-${typeof d.target === 'string' ? d.target : d.target.id}`
        const reverseLinkPair = `${typeof d.target === 'string' ? d.target : d.target.id}-${typeof d.source === 'string' ? d.source : d.source.id}`
        const isHighlighted = highlightedRelationPairs.has(linkPair) || highlightedRelationPairs.has(reverseLinkPair)
        return isHighlighted ? 3 : 1
      })
      .attr('opacity', (d) => {
        const linkPair = `${typeof d.source === 'string' ? d.source : d.source.id}-${typeof d.target === 'string' ? d.target : d.target.id}`
        const reverseLinkPair = `${typeof d.target === 'string' ? d.target : d.target.id}-${typeof d.source === 'string' ? d.source : d.source.id}`
        const isHighlighted = highlightedRelationPairs.has(linkPair) || highlightedRelationPairs.has(reverseLinkPair)
        return isHighlighted ? 0.9 : (searchPath && highlightedEntityIds.size > 0 ? 0.2 : 0.6)
      })

    // Create nodes
    const nodeElements = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', d => {
        const isHighlighted = highlightedEntityIds.has(d.id)
        if (searchPath && highlightedEntityIds.size > 0) {
          return isHighlighted ? 1 : 0.3
        }
        return 0.9
      })
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on('mouseover', (event, d) => {
        setHoveredNode(d)
      })
      .on('mouseout', () => {
        setHoveredNode(null)
      })
      .on('click', (event, d) => {
        setSelectedNode(d)
        console.log('🎯 Node selected:', d)
      })

    // Create labels
    const labelElements = g.append('g')
      .selectAll('text')
      .data(nodes.filter(d => d.size > 10)) // Only show labels for larger nodes
      .enter()
      .append('text')
      .text(d => d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label)
      .attr('font-size', d => Math.min(d.size / 2 + 8, 14))
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#333')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .attr('opacity', d => {
        const isHighlighted = highlightedEntityIds.has(d.id)
        if (searchPath && highlightedEntityIds.size > 0) {
          return isHighlighted ? 1 : 0.3
        }
        return 0.8
      })

    // Update positions on tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!)

      nodeElements
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!)

      labelElements
        .attr('x', d => d.x!)
        .attr('y', d => d.y!)
    })

    // Notify parent of visible nodes
    if (onNodeVisibilityChange) {
      onNodeVisibilityChange(nodes.map(n => n.id))
    }

    // Cleanup
    return () => {
      simulation.stop()
    }

  }, [reconciliationData, dimensions, searchPath, onNodeVisibilityChange])

  if (!reconciliationData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🌐</div>
          <p className="text-xl">Chargement du graphe de connaissances...</p>
          <p className="text-sm mt-2 opacity-75">
            Connexion à l&apos;API de réconciliation...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full bg-black"
      />

      {/* Graph Info Overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
        <div className="text-sm">
          <div className="text-borges-accent font-semibold">🌐 Graphe de Borges</div>
          <div className="mt-1">
            <span className="text-gray-300">Nœuds:</span> {reconciliationData.nodes.length > 300 ? '300+' : reconciliationData.nodes.length}
          </div>
          <div>
            <span className="text-gray-300">Liens:</span> {Math.min(reconciliationData.relationships.length, 800)}
          </div>
          {searchPath && searchPath.entities && searchPath.entities.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-green-400 font-semibold text-xs">🔍 Chemin de Recherche</div>
              <div className="text-xs">
                <span className="text-gray-300">Entités:</span> {searchPath.entities.length}
              </div>
              <div className="text-xs">
                <span className="text-gray-300">Relations:</span> {searchPath.relations?.length || 0}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Types Legend */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs">
        <div className="text-borges-accent font-semibold mb-2">Types de Nœuds</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff4757' }}></div>
            <span>Personnes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00d2d3' }}></div>
            <span>Lieux</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5352ed' }}></div>
            <span>Événements</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#7bed9f' }}></div>
            <span>Concepts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffa502' }}></div>
            <span>Organisations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff6348' }}></div>
            <span>Livres</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dfe4ea' }}></div>
            <span>Autres</span>
          </div>
        </div>

        {searchPath && searchPath.entities && searchPath.entities.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="text-green-400 font-semibold text-xs mb-1">Highlighting</div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-0.5 bg-green-400"></div>
              <span>Chemin GraphRAG</span>
            </div>
            <div className="flex items-center space-x-2 text-xs mt-1">
              <div className="w-3 h-3 rounded-full border-2 border-green-400"></div>
              <span>Entités utilisées</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Info */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs">
        <div className="text-borges-accent font-semibold mb-1">Contrôles</div>
        <div>🖱️ Glisser: Déplacer nœuds</div>
        <div>🔄 Molette: Zoom</div>
        <div>🖱️ Clic: Sélectionner nœud</div>
      </div>

      {/* Node Detail Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-80 min-w-64">
          <div className="flex justify-between items-start mb-2">
            <div className="text-borges-accent font-semibold">📊 Détails du Nœud</div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-300">Nom:</span>
              <div className="text-white font-medium">{selectedNode.label}</div>
            </div>

            <div>
              <span className="text-gray-300">Type:</span>
              <span className="ml-2 px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: selectedNode.color + '40', color: selectedNode.color }}>
                {selectedNode.type}
              </span>
            </div>

            <div>
              <span className="text-gray-300">Degré:</span>
              <span className="text-white ml-2">{selectedNode.degree} connexions</span>
            </div>

            <div>
              <span className="text-gray-300">Centralité:</span>
              <span className="text-white ml-2">{selectedNode.centrality_score.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredNode && !selectedNode && (
        <div
          className="absolute pointer-events-none bg-black bg-opacity-80 text-white p-2 rounded text-xs z-10"
          style={{
            left: `${(dimensions.width / 2)}px`,
            top: `${(dimensions.height / 2)}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-medium">{hoveredNode.label}</div>
          <div className="text-gray-300">{hoveredNode.type} • {hoveredNode.degree} connexions</div>
        </div>
      )}
    </div>
  )
}