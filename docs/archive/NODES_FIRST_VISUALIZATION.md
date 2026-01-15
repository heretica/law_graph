# Nodes-First Visualization Implementation

## Problem Statement
User wanted to see the actual nodes/entities selected by GraphRAG **before** showing the text answer, similar to how `test_query_analysis.py` displays the analysis process. Instead of just showing a text answer, the user should first see which entities and relationships GraphRAG selected.

## Solution Implemented

### 1. Query Flow Redesign
**Old Flow**:
1. User asks question
2. Backend processes with GraphRAG
3. Return answer
4. Show answer text only

**New Flow**:
1. User asks question
2. Show processing phases (📚 Interrogation des livres, 👥 Sélection des entités, etc.)
3. Backend processes with GraphRAG and returns entities/relationships
4. **DISPLAY SELECTED NODES** with highlighting in the 3D graph
5. Show phase: "📍 Mise en évidence des nœuds sélectionnés" (Highlighting selected nodes)
6. THEN show answer text in panel below

### 2. Backend Changes (reconciliation_api)
The `/query/multi-book` endpoint already returns:
```json
{
  "aggregated": {
    "entities": [ ... ],
    "relationships": [ ... ],
    "communities": [ ... ]
  }
}
```

These entities/relationships are sent to frontend immediately after GraphRAG processes them.

### 3. Frontend Service Changes
**File**: `3_borges-interface/src/lib/services/reconciliation.ts` (Lines 326-358)

**Update**: Added fallback handling for 404 errors
```typescript
async multiBookQuery(...): Promise<any> {
  try {
    const response = await fetch(`${this.apiUrl}/query/multi-book`, ...);
    
    if (response.ok) {
      return response.json();
    }
    
    if (response.status === 404) {
      // Multi-book not deployed yet, fall back to reconciled query
      return this.reconciledQuery(options);
    }
  } catch (error) {
    // Network error, fall back gracefully
    return this.reconciledQuery(options);
  }
}
```

This ensures the app continues to work even if the multi-book endpoint isn't deployed yet.

### 4. Frontend Component Changes
**File**: `3_borges-interface/src/components/BorgesLibrary.tsx` (Lines 118-210)

**Key Changes**:

a) **Set current query immediately** (line 124):
```typescript
setCurrentQuery(query)  // Show question while processing
```

b) **Restructured phase timing** (lines 143-147):
```typescript
// Run first 4 phases while API is processing
for (let i = 0; i < 4; i++) {
  setCurrentProcessingPhase(phases[i].name)
  await new Promise(resolve => setTimeout(resolve, phases[i].duration))
}
// Wait for API response
const result = await apiCallPromise
```

c) **Display nodes FIRST** (lines 167-181):
```typescript
if (entities.length > 0) {
  const searchPath = {
    entities: entities.slice(0, 50),
    relations: relationships.slice(0, 100),
    communities: communities.slice(0, 20)
  }
  
  // This triggers highlighting in the graph visualization
  setSearchPath(searchPath)
  handleHighlightPath(searchPath)
  
  // Show phase while nodes render
  setCurrentProcessingPhase('📍 Mise en évidence des nœuds sélectionnés')
  await new Promise(resolve => setTimeout(resolve, 2000))
}
```

d) **Then show answer** (lines 183-193):
```typescript
let combinedAnswer = ''
if (result.book_results && result.book_results.length > 0) {
  combinedAnswer = result.book_results
    .filter((r: any) => r.answer && !r.error)
    .map((r: any) => `📖 ${r.book_id}:\n${r.answer}`)
    .join('\n\n---\n\n')
}

setQueryAnswer(combinedAnswer)
setShowAnswer(true)  // Show answer panel after nodes displayed
```

## Visualization Timeline

When user enters query "Qu'est-ce que l'alpinisme ?":

```
0s    - Show question in processing panel
        Phase: 📚 Interrogation des livres (1.5s)
        
1.5s  - Phase: 👥 Sélection des entités (1.5s)
        [Backend querying started]
        
3s    - Phase: 🏘️ Analyse des communautés (2s)
        
5s    - Phase: 🔗 Cartographie des relations (1.2s)
        
6.2s  - [API response received with entities/relationships]
        **NODES APPEAR IN GRAPH** with highlighting
        Phase: 📍 Mise en évidence des nœuds sélectionnés (2s)
        
8.2s  - Show answer panel with text
        Phase: 📝 Synthèse textuelle (1.8s)
        
10s   - Processing complete, user sees both:
        - 3D graph with selected nodes highlighted
        - Answer text in bottom-left panel
```

## Data Flow

```
User Query
    ↓
Frontend: multiBookQuery()
    ↓
Backend: /query/multi-book or /query/reconciled (fallback)
    ↓
GraphRAG processes with interceptor
    ↓
Return: {
  entities: [...],
  relationships: [...],
  communities: [...]
}
    ↓
Frontend: setSearchPath(entities, relationships, communities)
    ↓
GraphVisualization: Highlight selected nodes in 3D graph
    ↓
Display: "Mise en évidence des nœuds sélectionnés"
    ↓
Then: Show answer text panel
```

## Expected Behavior

### Before Fix
1. User asks: "Qu'est-ce que l'alpinisme ?"
2. Processing phases show
3. Answer appears in text panel
4. User only sees text answer

### After Fix
1. User asks: "Qu'est-ce que l'alpinisme ?"
2. Processing phases show
3. **Selected entities appear highlighted in 3D graph**
4. User sees which nodes GraphRAG selected for context
5. Then answer text appears below graph
6. User has visual understanding of which concepts were connected

## Test Scenario

### Query: "Qu'est-ce que l'alpinisme ?"

Expected entities (from peau_bison_frison):
- Alpinisme (Mountaineering)
- Escalade (Climbing)
- Montagne (Mountain)
- Sommet (Summit)
- Cordée (Rope team)
- Expédition (Expedition)

These should:
1. Be highlighted in the 3D graph
2. Show relationships between them
3. Display in the entity list in answer panel
4. Then answer text explains alpinism using these concepts

## Code Locations

**Backend**:
- `/query/multi-book` endpoint: `reconciliation-api/reconciliation_api.py:716-856`
- Returns aggregated entities/relationships with book metadata

**Frontend Service**:
- `multiBookQuery()` method: `3_borges-interface/src/lib/services/reconciliation.ts:326-358`
- Handles 404 fallback gracefully

**Frontend Component**:
- `handleSimpleQuery()` method: `3_borges-interface/src/components/BorgesLibrary.tsx:118-210`
- Orchestrates visualization timeline
- Passes `searchPath` to graph visualization

**Graph Visualization**:
- `GraphVisualization3DForce` component: Uses `searchPath` prop to highlight nodes
- `searchPath` contains selected entities/relationships/communities

## Benefits

✅ **Visual Context**: Users see which concepts GraphRAG connected
✅ **Like test_query_analysis.py**: Matches reference implementation pattern
✅ **Graceful Degradation**: Falls back to single-book if multi-book unavailable
✅ **Processing Timeline**: Clear phases show what's happening
✅ **Node-First UX**: Entities visible before reading answer

## Testing

After deployment:

1. **Navigate to interface**: https://3borges-interface.vercel.app
2. **Enter query**: "Qu'est-ce que l'alpinisme ?"
3. **Observe timeline**:
   - Question appears
   - Processing phases animate
   - Nodes appear highlighted in graph
   - "Mise en évidence..." phase shows
   - Answer panel appears below
4. **Verify entities**: Check that entities in answer match highlighted nodes

## Fallback Behavior

If `/query/multi-book` endpoint returns 404:
- Service logs warning: "⚠️ Multi-book endpoint not deployed yet"
- Falls back to `/query/reconciled` (single-book query)
- Same visualization applies
- User sees same experience with available data

---

**Implementation Date**: November 9, 2024
**Status**: Deployed to Vercel, awaiting Railway backend deployment for full multi-book support
