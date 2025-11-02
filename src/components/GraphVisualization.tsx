'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'

interface Book {
  id: string
  title: string
  author: string
  graphData?: any
}

interface Neo4jNode {
  id: string
  labels: string[]
  properties: Record<string, any>
  degree: number
  centrality_score: number
}

interface Neo4jRelationship {
  id: string
  type: string
  source: string
  target: string
  properties: Record<string, any>
}

interface Neo4jGraphData {
  nodes: Neo4jNode[]
  relationships: Neo4jRelationship[]
}

interface GraphVisualizationProps {
  book: Book | null
  neo4jGraphData: Neo4jGraphData | null
  isLoadingGraph: boolean
  onNodeVisibilityChange: (nodeIds: string[]) => void
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: string
  description?: string
  degree: number
  centrality_score: number
  color: string
  size: number
  visible: boolean
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string
  relation: string
  weight: number
}

export default function GraphVisualization({
  book,
  neo4jGraphData,
  isLoadingGraph,
  onNodeVisibilityChange
}: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<D3Node[]>([])
  const [links, setLinks] = useState<D3Link[]>([])
  const [simulation, setSimulation] = useState<d3.Simulation<D3Node, D3Link> | null>(null)
  const [zoomTransform, setZoomTransform] = useState(d3.zoomIdentity)
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<Set<string>>(new Set())

  // Entity type colors matching the screenshot
  const entityColors = {
    'Personnes': '#ff6b6b',      // Red
    'Lieux': '#4ecdc4',          // Teal
    'Événements': '#45b7d1',     // Blue
    'Concepts': '#96ceb4',       // Green
    'Organisations': '#feca57',   // Yellow
    'Livres': '#ff9ff3',         // Pink
    'default': '#a8a8a8'         // Gray
  }

  const getEntityType = (labels: string[]): string => {
    // Map Neo4j labels to entity types
    const labelMappings = {
      'Person': 'Personnes',
      'Location': 'Lieux',
      'Event': 'Événements',
      'Concept': 'Concepts',
      'Organization': 'Organisations',
      'Book': 'Livres'
    }

    for (const label of labels) {
      if (labelMappings[label as keyof typeof labelMappings]) {
        return labelMappings[label as keyof typeof labelMappings]
      }
    }

    return labels[0] || 'Concepts'
  }

  const processNeo4jData = useCallback(() => {
    if (!neo4jGraphData) return

    const processedNodes: D3Node[] = neo4jGraphData.nodes.map(node => {
      const entityType = getEntityType(node.labels)
      const name = node.properties.name || node.properties.title || `Node ${node.id.slice(-8)}`

      return {
        id: node.id,
        label: name,
        type: entityType,
        description: node.properties.description || '',
        degree: node.degree,
        centrality_score: node.centrality_score,
        color: entityColors[entityType as keyof typeof entityColors] || entityColors.default,
        size: Math.max(6, Math.min(20, 6 + (node.centrality_score * 14))),
        visible: true,
        x: Math.random() * 800,
        y: Math.random() * 600
      }
    })

    const processedLinks: D3Link[] = neo4jGraphData.relationships.map(rel => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      relation: rel.type,
      weight: 1
    }))

    setNodes(processedNodes)
    setLinks(processedLinks)

    // Initialize all entity types as selected
    const types = new Set(processedNodes.map(n => n.type))
    setSelectedNodeTypes(types)

  }, [neo4jGraphData, entityColors])

  useEffect(() => {
    if (neo4jGraphData && !isLoadingGraph) {
      processNeo4jData()
    }
  }, [neo4jGraphData, isLoadingGraph, processNeo4jData])

  const drawGraph = useCallback(() => {
    if (!svgRef.current || isLoadingGraph || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Filter visible nodes based on selected types
    const visibleNodes = nodes.filter(node => selectedNodeTypes.has(node.type))
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id))
    const visibleLinks = links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)
    })

    // Update visible node IDs for parent component
    onNodeVisibilityChange(Array.from(visibleNodeIds))

    // Create force simulation
    const newSimulation = d3.forceSimulation<D3Node>(visibleNodes)
      .force('link', d3.forceLink<D3Node, D3Link>(visibleLinks).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 2))

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        setZoomTransform(event.transform)
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create container for graph elements
    const container = svg.append('g')

    // Create links
    const linkElements = container.selectAll('.link')
      .data(visibleLinks)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight))

    // Create node groups
    const nodeElements = container.selectAll('.node')
      .data(visibleNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) newSimulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) newSimulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )

    // Add circles to nodes
    nodeElements.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))')

    // Add labels to nodes
    nodeElements.append('text')
      .attr('dy', d => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
      .text(d => d.label.length > 15 ? d.label.slice(0, 15) + '...' : d.label)

    // Add hover effects
    nodeElements
      .on('mouseenter', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(150)
          .attr('r', d.size * 1.3)
          .style('filter', 'drop-shadow(4px 4px 8px rgba(0,0,0,0.5))')
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(150)
          .attr('r', d.size)
          .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))')
      })

    // Update positions on simulation tick
    newSimulation.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!)

      nodeElements
        .attr('transform', d => `translate(${d.x},${d.y})`)
    })

    setSimulation(newSimulation)

  }, [isLoadingGraph, nodes, links, selectedNodeTypes, onNodeVisibilityChange])

  // Toggle entity type visibility
  const toggleEntityType = (entityType: string) => {
    const newSelectedTypes = new Set(selectedNodeTypes)
    if (newSelectedTypes.has(entityType)) {
      newSelectedTypes.delete(entityType)
    } else {
      newSelectedTypes.add(entityType)
    }
    setSelectedNodeTypes(newSelectedTypes)
  }

  useEffect(() => {
    if (!isLoadingGraph && nodes.length > 0) {
      drawGraph()
    }
  }, [isLoadingGraph, nodes, links, selectedNodeTypes, drawGraph])

  // Get entity type counts
  const entityTypeCounts = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const entityTypes = Object.keys(entityColors).filter(type => type !== 'default')

  return (
    <div className="h-full w-full bg-gray-900 rounded-lg overflow-hidden relative">
      {isLoadingGraph ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-white">Chargement du graphe de connaissances...</p>
            <p className="text-gray-400 text-sm mt-2">Connexion à Neo4j...</p>
          </div>
        </div>
      ) : nodes.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🌌</div>
            <p className="text-white text-xl">Aucune donnée disponible</p>
            <p className="text-gray-400 text-sm mt-2">Vérifiez votre connexion Neo4j</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Graph */}
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="bg-gray-900"
          />

          {/* Legend */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 backdrop-blur-sm rounded-lg p-4 max-w-xs">
            <h4 className="text-white font-semibold mb-3 text-sm">Types d&apos;entités</h4>
            <div className="space-y-2">
              {entityTypes.map(entityType => (
                <button
                  key={entityType}
                  onClick={() => toggleEntityType(entityType)}
                  className={`flex items-center space-x-2 w-full text-left p-2 rounded transition-all ${
                    selectedNodeTypes.has(entityType)
                      ? 'bg-white bg-opacity-10'
                      : 'bg-gray-700 bg-opacity-50'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entityColors[entityType as keyof typeof entityColors] }}
                  />
                  <span className={`text-xs flex-1 ${
                    selectedNodeTypes.has(entityType) ? 'text-white' : 'text-gray-400'
                  }`}>
                    {entityType}
                  </span>
                  <span className={`text-xs ${
                    selectedNodeTypes.has(entityType) ? 'text-white' : 'text-gray-500'
                  }`}>
                    {entityTypeCounts[entityType] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white text-xs space-y-1">
              <div>
                <span className="text-gray-400">Nœuds visibles:</span> {nodes.filter(n => selectedNodeTypes.has(n.type)).length}
              </div>
              <div>
                <span className="text-gray-400">Relations:</span> {links.length}
              </div>
              {book && (
                <div>
                  <span className="text-gray-400">Livre sélectionné:</span> {book.title}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white text-xs space-y-2">
              <div className="text-gray-400">Contrôles:</div>
              <div>🖱️ Glisser: Déplacer nœuds</div>
              <div>🔍 Molette: Zoom</div>
              <div>👆 Clic: Sélectionner</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}