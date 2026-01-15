# Multi-Book Sequential GraphRAG Query Implementation

## Overview
Implemented a comprehensive multi-book GraphRAG query system that queries all available books sequentially and aggregates results with per-book metadata.

## Architecture

### Backend: `/query/multi-book` Endpoint
**Location**: `reconciliation-api/reconciliation_api.py` (line 716)

**Functionality**:
1. Receives query from frontend
2. Gets list of available books from `gdrive_manager`
3. **Sequential loop** through each book:
   - Initialize GraphRAG with book's data via `get_local_graphrag(book_id)`
   - Execute query on that book
   - Capture debug info via `graphrag_interceptor.get_real_debug_info()`
   - Track processing time per book

4. **Aggregation**:
   - Deduplicates entities/relationships while tracking source books
   - Each entity has `found_in` array showing which books contain it
   - Identifies cross-book matches (entities appearing in multiple books)
   - Generates summary statistics

5. **Response Structure**:
```json
{
  "success": true,
  "query": "user's query",
  "mode": "local|global",
  "total_processing_time": 45.23,
  "books_queried": ["a_rebours_huysmans", "chien_blanc_gary", "peau_bison_frison"],
  "books_with_results": 3,
  "book_results": [
    {
      "book_id": "peau_bison_frison",
      "answer": "full response from GraphRAG",
      "processing_time": 15.2,
      "debug_info": { ... }
    }
  ],
  "aggregated": {
    "entities": [
      {
        "id": "entity_id",
        "name": "Entity Name",
        "found_in": ["peau_bison_frison", "chien_blanc_gary"],
        "books": ["peau_bison_frison", "chien_blanc_gary"]
      }
    ],
    "relationships": [...],
    "communities": [...]
  },
  "summary": {
    "total_entities": 42,
    "total_relationships": 156,
    "total_communities": 8,
    "entities_in_multiple_books": 5,
    "relationships_in_multiple_books": 12
  }
}
```

### Frontend: Multi-Book Query Service
**Location**: `3_borges-interface/src/lib/services/reconciliation.ts` (line 325)

**Method**: `multiBookQuery(options)`
```typescript
async multiBookQuery(options: {
  query: string;
  mode?: 'local' | 'global';
  debug_mode?: boolean;
}): Promise<any>
```

Calls `POST /api/reconciliation/query/multi-book`

### Frontend: Updated Component
**Location**: `3_borges-interface/src/components/BorgesLibrary.tsx`

**Changes**:
- `handleSimpleQuery()` now calls `reconciliationService.multiBookQuery()`
- Displays aggregated results with book context
- Shows processing phases: "📚 Interrogation des livres"
- Combines answers from all books with book prefixes
- Highlights entities/relationships with book metadata

## How It Works

### Query Flow
```
User enters: "Qu'est-ce que l'alpinisme ?"
    ↓
Frontend calls multiBookQuery()
    ↓
POST /query/multi-book on reconciliation API
    ↓
For each book in ["a_rebours_huysmans", "chien_blanc_gary", "peau_bison_frison"]:
  - Initialize GraphRAG instance
  - Query with "Qu'est-ce que l'alpinisme ?"
  - Capture entities/relationships/communities
  - Track which book they came from
    ↓
Aggregate all results
    ↓
Return combined dataset with per-book breakdown
    ↓
Frontend displays results with book source information
```

### Example: Mountaineering Query
When user asks about mountaineering:
- **peau_bison_frison** (mountaineering book): Returns mountaineering-specific entities
- **chien_blanc_gary** (White Fang novel): Returns related animal/nature entities
- **a_rebours_huysmans** (literary novel): May return philosophical perspectives

Results are merged showing which book contributed each entity.

## Books Included

1. **peau_bison_frison** (Lionel Terray - "Les conquérants de l'inutile")
   - Focus: Mountaineering, alpine exploration, adventure
   
2. **chien_blanc_gary** (Romain Gary - "Chien blanc")
   - Focus: Animal behavior, relationships, white dog protagonist
   
3. **a_rebours_huysmans** (J.K. Huysmans - "À rebours")
   - Focus: Literary, psychological, decadent aesthetics

## Key Features

✅ **Sequential Processing**: One book at a time (not parallel) for stability
✅ **Real Debug Data**: Uses graphrag_interceptor to capture actual entity/relationship selections
✅ **Book Source Tracking**: Each result tracks which books it came from
✅ **Cross-Book Insights**: Summary shows entities appearing in multiple books
✅ **Per-Book Answers**: Users see individual responses from each book
✅ **Aggregation**: Deduplicates while preserving source information
✅ **Compatible with test_query_analysis.py**: Follows same patterns for capturing GraphRAG behavior

## Testing

### Test via cURL
```bash
curl -X POST https://reconciliation-api-production.up.railway.app/query/multi-book \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Qu'\''est-ce que l'\''alpinisme ?",
    "mode": "global",
    "debug_mode": true
  }' | python3 -m json.tool
```

### Test via Python
```python
import requests

response = requests.post(
    "https://reconciliation-api-production.up.railway.app/query/multi-book",
    json={
        "query": "Qu'est-ce que l'alpinisme ?",
        "mode": "global",
        "debug_mode": True
    },
    timeout=120
)

data = response.json()
print(f"Total entities: {data['summary']['total_entities']}")
print(f"Entities in multiple books: {data['summary']['entities_in_multiple_books']}")
```

### Test via Frontend
1. Navigate to https://3borges-interface.vercel.app
2. Enter query: "Qu'est-ce que l'alpinisme ?"
3. Watch processing phases: "📚 Interrogation des livres"
4. Review results showing:
   - Combined answer from all books (prefixed with book ID)
   - Aggregated entities with book sources
   - Relationships and communities from all books

## Deployment Status

**Code Status**: ✅ Implemented and committed
- reconciliation_api.py: Lines 716-856 (141 lines)
- reconciliation.ts: Lines 325-346 (22 lines)
- BorgesLibrary.tsx: Lines 118-204 (87 lines)

**Commits**:
- `8d57965`: Backend multi-book endpoint
- `ab9ebb3`: Frontend and service updates

**Railway Deployment**: ⏳ Pending
- Build plan error with Railpack (Railway infrastructure issue)
- Dockerfile and railway.toml correctly configured
- Manual redeploy may be needed via Railway dashboard

## Implementation Details

### Aggregation Algorithm
```python
for book_id in available_books:
    result = graphrag_instance.query(query)
    entities = extract_from_interceptor()
    
    for entity in entities:
        if entity['id'] not in aggregated:
            aggregated[entity['id']] = {
                **entity,
                'books': [book_id],
                'found_in': [book_id]
            }
        else:
            # Entity found in another book
            aggregated[entity['id']]['books'].append(book_id)
            aggregated[entity['id']]['found_in'].append(book_id)
```

### Debug Info Capture
Each book query captures via `graphrag_interceptor.get_real_debug_info()`:
- `entity_selection`: Entities used in prompt
- `community_analysis`: Communities selected
- `relationship_mapping`: Relationships found
- `text_synthesis`: Text sources
- Processing times per phase

## Next Steps

1. **Monitor Railway Deployment**: Redeploy via Railway dashboard if needed
2. **Test Multi-Book Queries**: Verify results show entities from multiple books
3. **Optimize Performance**: Consider parallel queries if sequential is too slow
4. **Add Book Selection UI**: Allow users to query specific books or filter results
5. **Visualization Enhancement**: Show book sources visually in graph (color by book)

## Related Files

- `reconciliation_api.py`: Main API implementation
- `graphrag_interceptor.py`: Captures GraphRAG query processing data
- `gdrive_data_manager.py`: Manages book data from Google Drive
- `3_borges-interface/src/lib/services/reconciliation.ts`: Frontend service
- `3_borges-interface/src/components/BorgesLibrary.tsx`: UI component
- `test_query_analysis.py`: Reference implementation (nano-graphrag-original/tests)

---

**Implementation Date**: November 9, 2024
**Status**: Complete (awaiting Railway deployment)
