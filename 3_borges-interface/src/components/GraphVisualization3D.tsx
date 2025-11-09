'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Node3D {
  id: string
  label: string
  type: string
  degree: number
  centrality_score: number
  position: THREE.Vector3
  color: string
  size: number
  // Physics properties for force simulation
  velocity?: THREE.Vector3
  force?: THREE.Vector3
  fixed?: boolean  // For dragging
}

interface Link3D {
  id: string
  source: string
  target: string
  relation: string
  weight: number
}

// 3D Force Simulation Engine
class ForceSimulation3D {
  nodes: Node3D[]
  links: Link3D[]
  alpha: number = 1
  alphaMin: number = 0.001
  alphaDecay: number = 1 - Math.pow(0.001, 1 / 300)
  velocityDecay: number = 0.6

  constructor(nodes: Node3D[], links: Link3D[]) {
    this.nodes = nodes
    this.links = links
    this.initializeNodes()
  }

  initializeNodes() {
    this.nodes.forEach(node => {
      if (!node.velocity) node.velocity = new THREE.Vector3()
      if (!node.force) node.force = new THREE.Vector3()
    })
  }

  // Force: Link force (springs between connected nodes)
  forceLink(strength: number = 0.3) {
    this.links.forEach(link => {
      const source = this.nodes.find(n => n.id === link.source)
      const target = this.nodes.find(n => n.id === link.target)

      if (source && target) {
        const distance = source.position.distanceTo(target.position)
        const targetDistance = 80 // Increased ideal link length for more spacing
        const delta = (distance - targetDistance) * strength

        const direction = new THREE.Vector3()
          .subVectors(target.position, source.position)
          .normalize()
          .multiplyScalar(delta)

        if (!source.fixed) source.force!.add(direction)
        if (!target.fixed) target.force!.sub(direction)
      }
    })
  }

  // Force: Many-body repulsion with group awareness (D3-inspired disjoint forces)
  forceManyBody(strength: number = -800) {
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i]
        const nodeB = this.nodes[j]

        const distance = nodeA.position.distanceTo(nodeB.position)
        if (distance > 0 && distance < 300) { // Expanded range for group separation
          // Different types repel more strongly (disjoint force)
          const sameType = nodeA.type === nodeB.type
          const typeMultiplier = sameType ? 0.3 : 1.8 // Same type: weak repulsion, different types: strong repulsion

          const force = (strength * typeMultiplier) / (distance * distance)
          const direction = new THREE.Vector3()
            .subVectors(nodeA.position, nodeB.position)
            .normalize()
            .multiplyScalar(force)

          if (!nodeA.fixed) nodeA.force!.add(direction)
          if (!nodeB.fixed) nodeB.force!.sub(direction)
        }
      }
    }
  }

  // Force: Group clustering (pulls nodes of same type together)
  forceGroupClustering(strength: number = 0.1) {
    // Group nodes by type
    const nodesByType = new Map<string, Node3D[]>()
    this.nodes.forEach(node => {
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, [])
      }
      nodesByType.get(node.type)!.push(node)
    })

    // Apply clustering force within each group
    nodesByType.forEach((groupNodes) => {
      if (groupNodes.length > 1) {
        // Calculate group centroid
        const centroid = new THREE.Vector3()
        groupNodes.forEach(node => centroid.add(node.position))
        centroid.divideScalar(groupNodes.length)

        // Pull each node toward group centroid
        groupNodes.forEach(node => {
          if (!node.fixed) {
            const direction = new THREE.Vector3()
              .subVectors(centroid, node.position)
              .multiplyScalar(strength)
            node.force!.add(direction)
          }
        })
      }
    })
  }

  // Force: Center force (pulls nodes toward center)
  forceCenter(strength: number = 0.002, center = new THREE.Vector3(0, 0, 0)) {
    this.nodes.forEach(node => {
      if (!node.fixed) {
        const direction = new THREE.Vector3()
          .subVectors(center, node.position)
          .multiplyScalar(strength)
        node.force!.add(direction)
      }
    })
  }

  // Force: Collision detection (prevents node overlap)
  forceCollide(radius: number = 10) {
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i]
        const nodeB = this.nodes[j]

        const distance = nodeA.position.distanceTo(nodeB.position)
        const minDistance = radius * 2

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance
          const direction = new THREE.Vector3()
            .subVectors(nodeA.position, nodeB.position)
            .normalize()
            .multiplyScalar(overlap * 0.5)

          if (!nodeA.fixed) nodeA.position.add(direction)
          if (!nodeB.fixed) nodeB.position.sub(direction)
        }
      }
    }
  }

  // Simulation step with Verlet integration
  tick() {
    // Clear forces
    this.nodes.forEach(node => {
      if (node.force) node.force.set(0, 0, 0)
    })

    // Apply forces
    this.forceLink()
    this.forceManyBody()
    this.forceGroupClustering() // New group clustering force
    this.forceCenter()
    this.forceCollide()

    // Update positions using Verlet integration
    this.nodes.forEach(node => {
      if (!node.fixed && node.velocity && node.force) {
        // Update velocity
        node.velocity.add(node.force.clone().multiplyScalar(this.alpha))
        node.velocity.multiplyScalar(this.velocityDecay)

        // Update position
        node.position.add(node.velocity)
      }
    })

    // Cool down simulation
    this.alpha += (this.alphaMin - this.alpha) * this.alphaDecay

    return this.alpha > this.alphaMin
  }

  restart() {
    this.alpha = 1
  }
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

interface GraphVisualization3DProps {
  reconciliationData?: ReconciliationData | null
  searchPath?: any
  onNodeVisibilityChange?: (nodeIds: string[]) => void
}

export default function GraphVisualization3D({
  reconciliationData,
  searchPath,
  onNodeVisibilityChange
}: GraphVisualization3DProps) {
  const [mountElement, setMountElement] = useState<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const nodesRef = useRef<Node3D[]>([])
  const linksRef = useRef<Link3D[]>([])
  const nodeInstancesRef = useRef<{ meshes: THREE.Mesh[] } | null>(null)
  const linkInstancesRef = useRef<THREE.InstancedMesh>()
  const raycasterRef = useRef<THREE.Raycaster>()
  const mouseRef = useRef<THREE.Vector2>()
  const [isInitialized, setIsInitialized] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null)
  // Force simulation reference - moved up to be accessible everywhere
  const forceSimulationRef = useRef<ForceSimulation3D | null>(null)

  // Callback ref to capture mount element
  const setMountRef = (element: HTMLDivElement | null) => {
    console.log('📍 Mount ref callback triggered:', !!element)
    setMountElement(element)
  }

  // Initialize Three.js scene when mount element becomes available
  useEffect(() => {
    if (!mountElement) {
      console.log('⏸️ Mount element not ready yet, waiting...')
      return
    }

    // Check if renderer already exists and is still in DOM
    if (isInitialized && rendererRef.current && document.body.contains(rendererRef.current.domElement)) {
      console.log('⏸️ Three.js already initialized and canvas still in DOM')
      return
    }

    if (isInitialized) {
      console.log('🔄 Three.js was initialized but canvas missing, reinitializing...')
      setIsInitialized(false)
    }

    console.log('🎬 Three.js initialization useEffect triggered:', {
      hasMountElement: !!mountElement,
      isInitialized,
      containerSize: mountElement ? { width: mountElement.clientWidth, height: mountElement.clientHeight } : null
    })

    const container = mountElement
    const { clientWidth, clientHeight } = container

    console.log('🚀 Starting Three.js scene creation with container size:', { clientWidth, clientHeight })

    // Declare variables in scope accessible to cleanup
    let renderer: THREE.WebGLRenderer | null = null
    let onMouseMove: ((event: MouseEvent) => void) | null = null
    let onMouseDown: ((event: MouseEvent) => void) | null = null
    let onMouseUp: ((event: MouseEvent) => void) | null = null
    let onWheel: ((event: WheelEvent) => void) | null = null

    try {
      // Scene with deep space background
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000511) // Deep space blue-black
      sceneRef.current = scene
      console.log('✅ Scene created successfully')

      // Camera - positioned to show the full galaxy
      const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 3000)
      camera.position.set(0, 0, 200) // Much closer initial viewing distance
      camera.lookAt(0, 0, 0) // Look at galaxy center
      cameraRef.current = camera
      console.log('✅ Camera created successfully')

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(clientWidth, clientHeight)
      renderer.setPixelRatio(window.devicePixelRatio)

      // Clear any existing children to prevent duplicates
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }

      container.appendChild(renderer.domElement)
      rendererRef.current = renderer
      console.log('✅ Renderer created and appended to DOM')
      console.log('🎯 Canvas element:', renderer.domElement)
      console.log('🎯 Container has children:', container.children.length)

      // Initialize raycaster for node interaction
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()
      raycasterRef.current = raycaster
      mouseRef.current = mouse
      console.log('✅ Raycaster initialized for node interaction')

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 100, 50)
    scene.add(directionalLight)

      // Enhanced navigation controls for exploring among stars
      let isMouseDown = false
      let mouseX = 0, mouseY = 0
      let lastMouseX = 0, lastMouseY = 0
      let cameraDistance = 200
      let cameraTheta = 0.3 // Horizontal rotation for nice angle
      let cameraPhi = 0.4   // Vertical rotation to look down at galaxy
      let draggedNode: Node3D | null = null
      let isDragging = false

      const updateCameraPosition = () => {
        camera.position.x = cameraDistance * Math.sin(cameraTheta) * Math.cos(cameraPhi)
        camera.position.y = cameraDistance * Math.sin(cameraPhi)
        camera.position.z = cameraDistance * Math.cos(cameraTheta) * Math.cos(cameraPhi)
        camera.lookAt(0, 0, 0)

        // Ensure camera is always pointing at origin
        camera.updateProjectionMatrix()
      }

      // Node interaction functions
      const checkNodeIntersection = (clientX: number, clientY: number) => {
        if (!raycasterRef.current || !cameraRef.current || !nodeInstancesRef.current) return null

        // Ensure mouse vector is initialized
        if (!mouseRef.current) {
          mouseRef.current = new THREE.Vector2()
        }

        const rect = container.getBoundingClientRect()
        mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
        mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

        // Intersect with individual mesh objects - filter out outline meshes
        if (nodeInstancesRef.current?.meshes) {
          // Only check main meshes (not outlines) for interaction
          const mainMeshes = nodeInstancesRef.current.meshes.filter((mesh: THREE.Mesh) =>
            !mesh.userData.isOutline
          )

          const intersects = raycasterRef.current.intersectObjects(mainMeshes)

          if (intersects.length > 0) {
            const intersectedMesh = intersects[0].object as THREE.Mesh
            const node = intersectedMesh.userData.node
            if (node) {
              return node
            }
          }
        }
        return null
      }

      onMouseMove = (event: MouseEvent) => {
        mouseX = event.clientX
        mouseY = event.clientY

        // Check for node hover (only when not dragging camera)
        if (!isMouseDown && !isDragging) {
          const hoveredNodeData = checkNodeIntersection(mouseX, mouseY)
          setHoveredNode(hoveredNodeData)

          // Change cursor when hovering over nodes
          container.style.cursor = hoveredNodeData ? 'pointer' : 'grab'
        }

        if (isDragging && draggedNode) {
          // Drag node in 3D space
          const rect = container.getBoundingClientRect()
          const mouse = new THREE.Vector2()
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

          // Project mouse position to 3D world coordinates
          const raycaster = new THREE.Raycaster()
          raycaster.setFromCamera(mouse, camera)

          // Create a plane perpendicular to camera at the node's current depth
          const distance = camera.position.distanceTo(draggedNode.position)
          const planeNormal = new THREE.Vector3().subVectors(camera.position, draggedNode.position).normalize()
          const plane = new THREE.Plane(planeNormal, -distance)

          // Find intersection with the plane
          const intersection = new THREE.Vector3()
          raycaster.ray.intersectPlane(plane, intersection)

          if (intersection) {
            // Update node position
            draggedNode.position.copy(intersection)
            // Reset velocity when dragging
            if (draggedNode.velocity) draggedNode.velocity.set(0, 0, 0)

            // Reheat simulation on drag (D3-inspired)
            if (forceSimulationRef.current) {
              forceSimulationRef.current.alpha = Math.max(forceSimulationRef.current.alpha, 0.3)
            }
          }

          container.style.cursor = 'grabbing'
        } else if (isMouseDown && !isDragging) {
          const deltaX = mouseX - lastMouseX
          const deltaY = mouseY - lastMouseY

          // Rotate camera around the galaxy center
          cameraTheta += deltaX * 0.01
          cameraPhi = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraPhi + deltaY * 0.01))

          updateCameraPosition()
          container.style.cursor = 'grabbing'
        }

        lastMouseX = mouseX
        lastMouseY = mouseY
      }

      onMouseDown = (event: MouseEvent) => {
        isMouseDown = true
        lastMouseX = event.clientX
        lastMouseY = event.clientY

        // Check if we're clicking on a node
        const clickedNode = checkNodeIntersection(event.clientX, event.clientY)
        if (clickedNode) {
          // Start dragging the node
          draggedNode = clickedNode
          isDragging = true
          clickedNode.fixed = true // Fix node position while dragging
          console.log('🎯 Started dragging node:', clickedNode.label)
        }
      }

      onMouseUp = (event: MouseEvent) => {
        isMouseDown = false

        if (isDragging && draggedNode) {
          // Stop dragging
          draggedNode.fixed = false // Allow physics to resume
          isDragging = false
          console.log('🎯 Stopped dragging node:', draggedNode.label)
          draggedNode = null
        } else {
          // Only handle click if mouse hasn't moved much (avoid clicks during camera drag)
          const deltaX = Math.abs(event.clientX - lastMouseX)
          const deltaY = Math.abs(event.clientY - lastMouseY)

          if (deltaX < 5 && deltaY < 5) {
            const clickedNode = checkNodeIntersection(event.clientX, event.clientY)
            setSelectedNode(clickedNode)

            if (clickedNode) {
              console.log('🎯 Node selected:', clickedNode)
            }
          }
        }

        container.style.cursor = hoveredNode ? 'pointer' : 'grab'
      }

      onWheel = (event: WheelEvent) => {
        // Smooth zoom with limits for close exploration
        cameraDistance *= (1 + event.deltaY * 0.0005)
        cameraDistance = Math.max(20, Math.min(2000, cameraDistance)) // Close zoom to far view
        updateCameraPosition()
        event.preventDefault()
      }

      // Set initial camera position
      updateCameraPosition()

      // Force an immediate render to ensure scene is visible
      if (renderer && scene && camera) {
        renderer.render(scene, camera)
        console.log('🎯 Initial render completed')
      }

      container.addEventListener('mousemove', onMouseMove)
      container.addEventListener('mousedown', onMouseDown)
      container.addEventListener('mouseup', onMouseUp)
      container.addEventListener('wheel', onWheel)
      console.log('✅ Event listeners added')

      setIsInitialized(true)
      console.log('🎉 Three.js initialization completed successfully!')

    } catch (error) {
      console.error('❌ Three.js initialization failed:', error)
    }

      // Cleanup
      return () => {
        try {
          if (container && onMouseMove && onMouseDown && onMouseUp && onWheel) {
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('mousedown', onMouseDown)
            container.removeEventListener('mouseup', onMouseUp)
            container.removeEventListener('wheel', onWheel)
          }

          if (renderer && container && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
            renderer.dispose()
          }
        } catch (error) {
          console.warn('⚠️ Error during Three.js cleanup:', error)
        }
      }
  }, [mountElement, isInitialized]) // Run when mount element becomes available


  // Animation loop reference to prevent multiple loops
  const animationIdRef = useRef<number>()

  // Process Reconciliation API data and create 3D nodes - separated from initialization
  useEffect(() => {
    console.log('🔍 Galaxy data update triggered:', {
      hasReconciliationData: !!reconciliationData,
      nodeCount: reconciliationData?.nodes?.length || 0,
      hasScene: !!sceneRef.current,
      isInitialized
    })

    if (!reconciliationData || !sceneRef.current || !isInitialized) {
      console.log('⚠️ Missing requirements for galaxy creation')
      return
    }

    // Prevent unnecessary re-creation if galaxy already exists with same data
    if (nodesRef.current.length === reconciliationData.nodes.length && nodesRef.current.length > 0) {
      console.log('✅ Galaxy already exists with', nodesRef.current.length, 'nodes - skipping recreation')
      return
    }

    // Clean up previous galaxy objects only if they exist
    const scene = sceneRef.current
    const objectsToRemove: THREE.Object3D[] = []

    scene.traverse((child) => {
      // Only remove old galaxy geometry from previous renders
      if ((child instanceof THREE.InstancedMesh || child instanceof THREE.LineSegments ||
           (child instanceof THREE.Mesh && child.userData?.isGalaxyObject === true)) &&
          !(child instanceof THREE.Light)) {
        objectsToRemove.push(child)
      }
    })

    if (objectsToRemove.length > 0) {
      objectsToRemove.forEach(obj => {
        scene.remove(obj)
        if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh || obj instanceof THREE.LineSegments) {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((mat: THREE.Material) => mat.dispose())
            } else {
              obj.material.dispose()
            }
          }
        }
      })
      console.log('🧹 Cleaned up', objectsToRemove.length, 'previous galaxy objects from scene')
      console.log('🔍 DEBUG: Scene children after cleanup:', sceneRef.current.children.length)
      console.log('🔍 DEBUG: Cleanup happened at:', new Date().toISOString())
    }
    console.log('🌌 Creating galaxy visualization with', reconciliationData.nodes.length, 'nodes')
    console.log('🎯 Scene status:', {
      sceneChildren: sceneRef.current.children.length,
      rendererInfo: rendererRef.current ? 'available' : 'missing',
      cameraPosition: cameraRef.current ? cameraRef.current.position : 'missing'
    })

    // Sort nodes by degree (most connected first) and take top 300
    const sortedNodes = [...reconciliationData.nodes]
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 300)

    console.log('📊 Processing nodes:', {
      total: reconciliationData.nodes.length,
      afterSorting: sortedNodes.length,
      sampleNode: sortedNodes[0] ? {
        id: sortedNodes[0].id,
        degree: sortedNodes[0].degree,
        labels: sortedNodes[0].labels
      } : 'none'
    })

    // Group-based initial positioning (D3-inspired clustering by type) - MUCH CLOSER
    const typeClusterCenters = {
      'Personnes': new THREE.Vector3(-50, 50, -25),     // Top-left-back
      'Lieux': new THREE.Vector3(50, 50, -25),          // Top-right-back
      'Événements': new THREE.Vector3(-50, -50, -25),   // Bottom-left-back
      'Concepts': new THREE.Vector3(50, -50, -25),      // Bottom-right-back
      'Organisations': new THREE.Vector3(0, 0, 50),     // Front-center
      'Livres': new THREE.Vector3(0, 0, -75),          // Back-center
      'default': new THREE.Vector3(0, 0, 0)            // Origin
    }

    const initialPositions: THREE.Vector3[] = sortedNodes.map((node) => {
      const nodeType = node.labels[0] || 'default'
      const clusterCenter = typeClusterCenters[nodeType as keyof typeof typeClusterCenters] || typeClusterCenters.default

      // Add random offset around cluster center (much smaller radius for tight clustering)
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 30, // Very small random offset within cluster
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      )

      return clusterCenter.clone().add(offset)
    })

    // Color mapping synchronized with legend (exact hex matches)
    const typeColors = {
      'Personnes': '#ff4757',       // Bright red - matches legend
      'Lieux': '#00d2d3',          // Cyan - matches legend
      'Événements': '#5352ed',     // Blue - matches legend
      'Concepts': '#7bed9f',       // Green - matches legend
      'Organisations': '#ffa502',  // Orange - matches legend
      'Livres': '#ff6348',         // Pink/coral - matches legend
      'default': '#dfe4ea'         // Light gray - matches legend
    }

    // Create 3D nodes
    const nodes3D: Node3D[] = sortedNodes.map((node, index) => {
      const nodeType = node.labels[0] || 'default'
      const color = typeColors[nodeType as keyof typeof typeColors] || typeColors.default
      const size = Math.max(20 + (node.degree / 2), 15) // Much larger nodes for visibility

      return {
        id: node.id,
        label: node.properties.name || node.id,
        type: nodeType,
        degree: node.degree,
        centrality_score: node.centrality_score,
        position: initialPositions[index],
        color: color, // Use hex string directly
        size
      }
    })

    nodesRef.current = nodes3D

    // Create 3D links (filter to only connect nodes in our top 300)
    const nodeIds = new Set(sortedNodes.map(n => n.id))
    const links3D: Link3D[] = reconciliationData.relationships
      .filter(rel => nodeIds.has(rel.source) && nodeIds.has(rel.target))
      .slice(0, 800) // Limit links for performance
      .map(rel => ({
        id: rel.id,
        source: rel.source,
        target: rel.target,
        relation: rel.type,
        weight: rel.properties.weight || 1
      }))

    linksRef.current = links3D

    // Create individual sphere nodes for debugging (simpler approach)
    const nodeGeometry = new THREE.SphereGeometry(1, 12, 12)
    const nodeMeshes: THREE.Mesh[] = []

    // Create sets of highlighted entities and relations from search path
    const highlightedEntityIds = new Set(
      searchPath?.entities?.map((entity: any) => entity.id) || []
    )
    const highlightedRelationPairs = new Set(
      searchPath?.relations?.map((relation: any) => `${relation.source}-${relation.target}`) || []
    )

    // Create actual nodes with proper materials and positioning
    nodes3D.forEach((node) => {
      // Create main node sphere
      const mainMaterial = new THREE.MeshPhongMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.9,
        shininess: 30
      })

      const mesh = new THREE.Mesh(nodeGeometry, mainMaterial)

      // Add white stroke/outline like D3 example
      const outlineGeometry = new THREE.SphereGeometry(1.1, 12, 12) // Slightly larger
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.BackSide // Render inside-out for outline effect
      })
      const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial)

      // Position the node at initial position
      mesh.position.copy(node.position)
      outlineMesh.position.copy(node.position)

      // Scale based on node importance (D3-inspired sizing)
      const baseScale = Math.max(node.size * 10, 50) // MASSIVE base size for visibility
      const sizeMultiplier = Math.log(node.degree + 2) * 20 // Very large multiplier for scaling
      const finalScale = baseScale + sizeMultiplier

      mesh.scale.setScalar(finalScale)
      outlineMesh.scale.setScalar(finalScale)

      // Store node data for interaction
      mesh.userData.node = node
      mesh.userData.isGalaxyObject = true
      outlineMesh.userData.node = node
      outlineMesh.userData.isGalaxyObject = true
      outlineMesh.userData.isOutline = true

      nodeMeshes.push(mesh)
      nodeMeshes.push(outlineMesh)

      if (sceneRef.current) {
        sceneRef.current.add(outlineMesh) // Add outline first (behind)
        sceneRef.current.add(mesh)        // Add main node second (front)
      }
    })

    console.log(`✨ Created ${nodes3D.length} force-directed nodes`)

    // Store reference for cleanup
    nodeInstancesRef.current = { meshes: nodeMeshes }

    // Initialize force simulation
    forceSimulationRef.current = new ForceSimulation3D(nodes3D, links3D)
    console.log('🚀 Force simulation initialized with', nodes3D.length, 'nodes and', links3D.length, 'links')

    // Restart simulation periodically to prevent settling into bad local minima
    const restartSimulation = () => {
      if (forceSimulationRef.current) {
        forceSimulationRef.current.restart()
        console.log('🔄 Restarted force simulation for better layout')
      }
    }

    // Restart after 3 seconds to give initial settling time
    setTimeout(restartSimulation, 3000)

    console.log('✨ Created 3D force-directed nodes with dynamic materials')
    console.log('🔍 Node meshes created:', {
      nodeCount: nodes3D.length,
      meshesCreated: nodeMeshes.length,
      sceneChildrenCount: sceneRef.current ? sceneRef.current.children.length : 0,
      firstNodePosition: nodes3D[0] ? nodes3D[0].position : 'none',
      firstNodeColor: nodes3D[0] ? nodes3D[0].color : 'none'
    })

    // Create links (lines between nodes) with search path highlighting
    if (links3D.length > 0) {
      const normalLinkPositions: number[] = []
      const highlightedLinkPositions: number[] = []

      links3D.forEach(link => {
        const sourceNode = nodes3D.find(n => n.id === link.source)
        const targetNode = nodes3D.find(n => n.id === link.target)

        if (sourceNode && targetNode) {
          const linkPair = `${link.source}-${link.target}`
          const reverseLinkPair = `${link.target}-${link.source}`
          const isHighlighted = highlightedRelationPairs.has(linkPair) || highlightedRelationPairs.has(reverseLinkPair)

          const positions = [
            sourceNode.position.x, sourceNode.position.y, sourceNode.position.z,
            targetNode.position.x, targetNode.position.y, targetNode.position.z
          ]

          if (isHighlighted) {
            highlightedLinkPositions.push(...positions)
          } else {
            normalLinkPositions.push(...positions)
          }
        }
      })

      // Create normal (non-highlighted) links
      if (normalLinkPositions.length > 0) {
        const normalLinkGeometry = new THREE.BufferGeometry()
        normalLinkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(normalLinkPositions, 3))

        const opacity = searchPath && highlightedEntityIds.size > 0 ? 0.1 : 0.3 // Dim when search is active
        const normalLinkMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          opacity,
          transparent: true
        })

        const normalLinkLines = new THREE.LineSegments(normalLinkGeometry, normalLinkMaterial)
        normalLinkLines.userData.isGalaxyObject = true
        sceneRef.current.add(normalLinkLines)
      }

      // Create highlighted links
      if (highlightedLinkPositions.length > 0) {
        const highlightedLinkGeometry = new THREE.BufferGeometry()
        highlightedLinkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightedLinkPositions, 3))

        // Bright highlighted link material
        const highlightedLinkMaterial = new THREE.LineBasicMaterial({
          color: 0x00ff88, // Bright green for highlighted paths
          opacity: 0.9,
          transparent: true
        })

        const highlightedLinkLines = new THREE.LineSegments(highlightedLinkGeometry, highlightedLinkMaterial)
        highlightedLinkLines.userData.isGalaxyObject = true
        sceneRef.current.add(highlightedLinkLines)

        // Add extra glow for highlighted links
        const highlightedGlowMaterial = new THREE.LineBasicMaterial({
          color: 0x88ffaa, // Light green glow
          opacity: 0.4,
          transparent: true,
          blending: THREE.AdditiveBlending
        })

        const highlightedGlowLines = new THREE.LineSegments(highlightedLinkGeometry.clone(), highlightedGlowMaterial)
        highlightedGlowLines.userData.isGalaxyObject = true
        sceneRef.current.add(highlightedGlowLines)

        console.log('✨ Created highlighted search path connections:', highlightedLinkPositions.length / 6, 'links')
      }

      // Add general glow effect for normal links
      if (normalLinkPositions.length > 0) {
        const normalLinkGeometry = new THREE.BufferGeometry()
        normalLinkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(normalLinkPositions, 3))

        const linkMaterialGlow = new THREE.LineBasicMaterial({
          color: 0x88ccff, // Light blue glow
          opacity: searchPath && highlightedEntityIds.size > 0 ? 0.05 : 0.1,
          transparent: true,
          blending: THREE.AdditiveBlending
        })

        const linkLinesGlow = new THREE.LineSegments(normalLinkGeometry, linkMaterialGlow)
        linkLinesGlow.userData.isGalaxyObject = true
        sceneRef.current.add(linkLinesGlow)
      }

      console.log('✨ Created connection lines with search path highlighting')
    }

    // Start animation loop only if not already running
    if (!animationIdRef.current) {
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate)

        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          // Step the force simulation
          const simulationActive = forceSimulationRef.current?.tick() || false

          // Update node positions from simulation
          if (nodeInstancesRef.current?.meshes && nodesRef.current) {
            nodesRef.current.forEach((node, nodeIndex) => {
              // Each node has 2 meshes: main node and outline
              const mainMeshIndex = nodeIndex * 2
              const outlineMeshIndex = nodeIndex * 2 + 1

              if (mainMeshIndex < nodeInstancesRef.current!.meshes.length &&
                  outlineMeshIndex < nodeInstancesRef.current!.meshes.length) {
                const mainMesh = nodeInstancesRef.current!.meshes[mainMeshIndex]
                const outlineMesh = nodeInstancesRef.current!.meshes[outlineMeshIndex]

                if (mainMesh && outlineMesh && node.position) {
                  // Update positions for both main and outline meshes
                  mainMesh.position.copy(node.position)
                  outlineMesh.position.copy(node.position)

                  // Add gentle rotation only when simulation is cooling down
                  if (!simulationActive) {
                    mainMesh.rotation.y += 0.001
                    outlineMesh.rotation.y += 0.001
                  }
                }
              }
            })
          }

          // Update link positions dynamically
          if (simulationActive) {
            // Recreate links geometry with new positions
            // This is expensive but necessary for dynamic force layout
            const normalLinkPositions: number[] = []

            linksRef.current.forEach(link => {
              const sourceNode = nodesRef.current.find(n => n.id === link.source)
              const targetNode = nodesRef.current.find(n => n.id === link.target)

              if (sourceNode && targetNode) {
                normalLinkPositions.push(
                  sourceNode.position.x, sourceNode.position.y, sourceNode.position.z,
                  targetNode.position.x, targetNode.position.y, targetNode.position.z
                )
              }
            })

            // Update link geometry if we have link objects in the scene
            sceneRef.current.traverse((child) => {
              if (child instanceof THREE.LineSegments && child.userData?.isGalaxyObject) {
                if (normalLinkPositions.length > 0) {
                  const positions = new Float32Array(normalLinkPositions)
                  child.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
                  child.geometry.attributes.position.needsUpdate = true
                }
              }
            })
          }

          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }
      }
      animate()
      console.log('🎬 Force-directed animation loop started')
    }

    // Notify parent of visible nodes
    if (onNodeVisibilityChange) {
      onNodeVisibilityChange(nodes3D.map(n => n.id))
    }

    console.log('🌌 Galaxy created:', nodes3D.length, 'nodes,', links3D.length, 'links')

    // Force a render to display the galaxy immediately
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      console.log('🔍 DEBUG: About to force render...')
      console.log('🔍 DEBUG: Scene children count:', sceneRef.current.children.length)
      console.log('🔍 DEBUG: Camera position:', cameraRef.current.position)
      console.log('🔍 DEBUG: Renderer size:', rendererRef.current.getSize(new THREE.Vector2()))

      rendererRef.current.render(sceneRef.current, cameraRef.current)
      console.log('🎯 Galaxy render forced')
    } else {
      console.log('❌ DEBUG: Cannot render - missing refs:', {
        hasRenderer: !!rendererRef.current,
        hasScene: !!sceneRef.current,
        hasCamera: !!cameraRef.current
      })
    }

    // Cleanup function for animation loop
    return () => {
      console.log('🚨 DEBUG: Galaxy cleanup function called!')
      console.log('🚨 DEBUG: Animation ID exists:', !!animationIdRef.current)
      console.log('🚨 DEBUG: Scene children before cleanup:', sceneRef.current?.children.length || 0)

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = undefined
        console.log('🛑 Animation loop stopped')
      }
    }
  }, [reconciliationData?.nodes.length, isInitialized]) // Only re-run when node count changes, not on every data update

  // Handle search path highlighting without recreating galaxy
  useEffect(() => {
    if (!sceneRef.current || !searchPath) return

    console.log('🔍 Updating search path highlighting')

    // Update existing galaxy objects with new highlighting instead of recreating them
    // This effect will only update visual properties, not recreate the entire scene

    // Trigger a re-render to update highlights
    if (nodeInstancesRef.current && nodesRef.current.length > 0) {
      // Force update of hover effects which handles highlighting
      setHoveredNode(hoveredNode) // Trigger hover effect update
    }
  }, [searchPath, hoveredNode])

  // Handle node visibility change callback separately
  useEffect(() => {
    if (onNodeVisibilityChange && nodesRef.current.length > 0) {
      onNodeVisibilityChange(nodesRef.current.map(n => n.id))
    }
  }, [onNodeVisibilityChange, nodesRef.current.length])

  // Handle hover effects
  useEffect(() => {
    if (!nodeInstancesRef.current?.meshes || !nodesRef.current.length) return

    nodesRef.current.forEach((node, i) => {
      // Each node now has 2 meshes: main node and outline
      const mainMeshIndex = i * 2
      const outlineMeshIndex = i * 2 + 1

      // Bounds check to ensure we don't go out of array bounds
      if (mainMeshIndex >= nodeInstancesRef.current!.meshes.length ||
          outlineMeshIndex >= nodeInstancesRef.current!.meshes.length) {
        return
      }

      const mainMesh = nodeInstancesRef.current!.meshes[mainMeshIndex]
      const outlineMesh = nodeInstancesRef.current!.meshes[outlineMeshIndex]

      if (!mainMesh || !outlineMesh) return

      const isHovered = hoveredNode?.id === node.id
      const isSelected = selectedNode?.id === node.id
      const isHighlighted = searchPath?.entities?.some((entity: any) => entity.id === node.id)
      const isGroupHovered = hoveredNode?.type === node.type && hoveredNode?.id !== node.id // Same type as hovered node

      // Calculate D3-inspired base scale
      const baseScale = Math.max(node.size * 0.6, 8)
      const sizeMultiplier = Math.log(node.degree + 2) * 2
      let finalScale = baseScale + sizeMultiplier

      // Scale: selected > hovered > highlighted > group hover > normal
      if (isSelected) finalScale *= 1.8
      else if (isHovered) finalScale *= 1.4
      else if (isHighlighted) finalScale *= 1.5
      else if (isGroupHovered) finalScale *= 1.15 // Subtle scaling for group hover

      // Update both main and outline mesh scales
      mainMesh.scale.setScalar(finalScale)
      outlineMesh.scale.setScalar(finalScale)

      // Color: enhance for interaction states
      const material = mainMesh.material as THREE.MeshPhongMaterial
      const outlineMaterial = outlineMesh.material as THREE.MeshBasicMaterial

      // Parse color properly from hex string
      const baseColor = new THREE.Color(node.color)

      if (isSelected) {
        material.color.copy(baseColor).multiplyScalar(1.5) // Brighter for selected
        outlineMaterial.opacity = 1.0 // More visible outline
      } else if (isHovered) {
        material.color.copy(baseColor).multiplyScalar(1.3) // Bright for hovered
        outlineMaterial.opacity = 0.9 // Visible outline
      } else if (isHighlighted) {
        material.color.copy(baseColor).multiplyScalar(1.2) // Enhanced for search path
        outlineMaterial.opacity = 0.8 // Normal outline
      } else if (isGroupHovered) {
        material.color.copy(baseColor).multiplyScalar(1.1) // Subtle highlight for group hover
        outlineMaterial.opacity = 0.7 // Slightly more visible outline
      } else if (hoveredNode && hoveredNode.type !== node.type) {
        material.color.copy(baseColor).multiplyScalar(0.5) // Fade other groups when hovering
        outlineMaterial.opacity = 0.2 // Very faded outline
      } else if (searchPath && searchPath.entities && searchPath.entities.length > 0) {
        material.color.copy(baseColor).multiplyScalar(0.4) // Dimmed when search is active
        outlineMaterial.opacity = 0.3 // Faded outline
      } else {
        material.color.copy(baseColor) // Normal color
        outlineMaterial.opacity = 0.6 // Subtle outline
      }
    })
  }, [hoveredNode, selectedNode, searchPath])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountElement || !cameraRef.current || !rendererRef.current) return

      const { clientWidth, clientHeight } = mountElement
      cameraRef.current.aspect = clientWidth / clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(clientWidth, clientHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!reconciliationData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🌌</div>
          <p className="text-xl">Chargement de la galaxie de connaissances...</p>
          <p className="text-sm mt-2 opacity-75">
            Connexion à l&apos;API de réconciliation...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={setMountRef} className="h-full w-full" />

      {/* Galaxy Info Overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
        <div className="text-sm">
          <div className="text-borges-accent font-semibold">🌌 Galaxie de Borges</div>
          <div className="mt-1">
            <span className="text-gray-300">Nœuds:</span> {nodesRef.current.length}
          </div>
          <div>
            <span className="text-gray-300">Liens:</span> {linksRef.current.length}
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
        <div>🖱️ Glisser: Orbiter</div>
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

            <div>
              <span className="text-gray-300">Position:</span>
              <div className="text-white text-xs font-mono">
                x: {selectedNode.position.x.toFixed(1)},
                y: {selectedNode.position.y.toFixed(1)},
                z: {selectedNode.position.z.toFixed(1)}
              </div>
            </div>

            {/* Show connected relationships */}
            <div>
              <span className="text-gray-300">Relations:</span>
              <div className="max-h-20 overflow-y-auto mt-1">
                {linksRef.current
                  .filter(link => link.source === selectedNode.id || link.target === selectedNode.id)
                  .slice(0, 5) // Show first 5 relationships
                  .map((link, i) => {
                    const connectedNodeId = link.source === selectedNode.id ? link.target : link.source
                    const connectedNode = nodesRef.current.find(n => n.id === connectedNodeId)
                    return (
                      <div key={i} className="text-xs bg-gray-800 rounded px-2 py-1 mt-1">
                        <div className="text-blue-300">{link.relation}</div>
                        <div className="text-gray-400">→ {connectedNode?.label || connectedNodeId}</div>
                      </div>
                    )
                  })}
                {linksRef.current.filter(link => link.source === selectedNode.id || link.target === selectedNode.id).length > 5 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{linksRef.current.filter(link => link.source === selectedNode.id || link.target === selectedNode.id).length - 5} plus...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredNode && !selectedNode && (
        <div
          className="absolute pointer-events-none bg-black bg-opacity-80 text-white p-2 rounded text-xs z-10"
          style={{
            left: `${(window.innerWidth / 2)}px`,
            top: `${(window.innerHeight / 2)}px`,
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