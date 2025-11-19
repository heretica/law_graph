import { NextRequest, NextResponse } from 'next/server'

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API Route: Forwarding request to', `${RECONCILIATION_API_URL}/query/reconciled`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

    const response = await fetch(`${RECONCILIATION_API_URL}/query/reconciled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('API Route: Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Route: Error response:', errorText)
      throw new Error(`Query failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('API Route: Success, selected_nodes count:', data.selected_nodes?.length || 0)
    console.log('🔍 API Route: Full response structure:', {
      success: data.success,
      has_answer: !!data.answer,
      has_selected_nodes: !!data.selected_nodes,
      selected_nodes_count: data.selected_nodes?.length || 0,
      has_nodes: !!data.nodes,
      nodes_count: data.nodes?.length || 0,
      has_relationships: !!data.relationships,
      relationships_count: data.relationships?.length || 0,
      has_debug_info: !!data.debug_info,
      debug_phases: data.debug_info?.processing_phases ? Object.keys(data.debug_info.processing_phases) : []
    })
    if (data.selected_nodes?.length > 0) {
      console.log('🎯 Sample selected_node:', JSON.stringify(data.selected_nodes[0], null, 2))
    }

    // Enrichir les nœuds avec des références aux chunks pour la traçabilité
    if (data.selected_nodes?.length > 0 && body.book_id) {
      console.log('📚 Enriching nodes with chunk references...')

      data.selected_nodes = data.selected_nodes.map((node: any) => {
        // Ajouter des chunk references simulées basées sur l'entité
        // En production, ces données viendraient du GraphRAG/API de réconciliation
        const chunkReferences = [{
          bookId: body.book_id,
          chunkId: `${node.id}_chunk_1`,
          nodeId: node.id,
          weight: 1.0
        }]

        return {
          ...node,
          chunk_references: chunkReferences,
          has_chunks: true
        }
      })

      console.log(`✅ Enriched ${data.selected_nodes.length} nodes with chunk references`)
    }

    // Debug entity_selection structure for coloring
    if (data.debug_info?.processing_phases?.entity_selection?.entities) {
      console.log('🔍 Entity selection entities count:', data.debug_info.processing_phases.entity_selection.entities.length)
      console.log('🔍 Sample entity:', JSON.stringify(data.debug_info.processing_phases.entity_selection.entities[0], null, 2))
    } else {
      console.log('❌ No entities in debug_info.processing_phases.entity_selection.entities')
      console.log('🔍 Debug info structure keys:', Object.keys(data.debug_info || {}))
      if (data.debug_info?.processing_phases) {
        console.log('🔍 Processing phases keys:', Object.keys(data.debug_info.processing_phases))
        if (data.debug_info.processing_phases.entity_selection) {
          console.log('🔍 Entity selection keys:', Object.keys(data.debug_info.processing_phases.entity_selection))
        }
      }
    }
    return NextResponse.json(data)

  } catch (error) {
    console.error('API Route: Error with reconciled query:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('aborted')) {
      return NextResponse.json(
        { success: false, error: 'Request timeout - GraphRAG query took too long' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}