# Quickstart: Interactive GraphRAG Refinement System

**Feature**: 001-interactive-graphrag-refinement
**Date**: 2025-11-23

## Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend)
- Neo4j 5.14+ (running locally or via Railway)
- OpenAI API key (for nano-graphRAG)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Backend
cd reconciliation-api
pip install -r requirements.txt

# Frontend
cd ../3_borges-interface
npm install
```

### 2. Configure Environment Variables

Create `.env` files:

**Backend (reconciliation-api/.env)**:
```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
OPENAI_API_KEY=sk-...
ADMIN_API_KEY=your_admin_key  # For book ingestion
```

**Frontend (3_borges-interface/.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5002
```

### 3. Start Services

```bash
# Terminal 1: Backend
cd reconciliation-api
python reconciliation_api.py

# Terminal 2: Frontend
cd 3_borges-interface
npm run dev
```

Access the application at `http://localhost:3000`.

---

## User Story Workflows

### US1: Trace GraphRAG Answer to Source Knowledge

1. **Submit a query** in the interface
2. **View the attribution graph** showing entities used in the answer
3. **Click on any node** to see details:
   - Entity: name, type, description, source book
   - Relationship: type, weight, evidence
   - Community: members, summary
4. **Navigate the provenance chain**: answer → entities → relationships → source text

### US2: Add New Books (Admin Only)

**Via CLI**:
```bash
cd reconciliation-api
python -m cli.ingest_book \
  --file /path/to/book.pdf \
  --title "Book Title" \
  --author "Author Name" \
  --genre "Fiction"
```

**Via API**:
```bash
curl -X POST http://localhost:5002/admin/ingest \
  -H "X-Admin-API-Key: your_admin_key" \
  -F "file=@book.pdf" \
  -F "title=Book Title" \
  -F "author=Author Name"
```

**Check progress**:
```bash
curl http://localhost:5002/admin/ingest/{job_id} \
  -H "X-Admin-API-Key: your_admin_key"
```

**Rollback if needed**:
```bash
curl -X POST http://localhost:5002/admin/ingest/{job_id}/rollback \
  -H "X-Admin-API-Key: your_admin_key"
```

### US3: Edit Graph Relationships

1. **Right-click on a relationship** in the graph visualization
2. **Select "Edit Relationship"** from the context menu
3. **Modify the relationship**:
   - Change relationship type
   - Update properties
   - Add justification note
4. **Save changes** - graph updates immediately
5. **View edit history** via the relationship detail panel

### US4: Re-query After Refinement

1. **Make graph edits** as in US3
2. **Click "Re-run Query"** in the query panel
3. **View side-by-side comparison**:
   - Original answer (left)
   - New answer (right)
   - Diff highlighting (inline)
4. **See which edits influenced the change** in the impact panel
5. **Mark as "Validated"** if satisfied with the improvement

---

## API Quick Reference

### Provenance API
```bash
GET /api/provenance/{query_id}
```

### Edit API
```bash
POST /api/edits
GET /api/edits/{edit_id}
POST /api/edits/{edit_id}/rollback
```

### Pattern Discovery API
```bash
GET /api/patterns
POST /api/patterns/{pattern_id}/save
```

### Query Comparison API
```bash
POST /api/queries/{query_id}/rerun
GET /api/queries/{query_id}/compare/{version}
```

### Book Ingestion API (Admin Only)
```bash
POST /admin/ingest
GET /admin/ingest/{job_id}
POST /admin/ingest/{job_id}/rollback
GET /admin/ingest/jobs
```

---

## Testing

### Run Backend Tests
```bash
cd reconciliation-api
pytest test/ -v
```

### Run Frontend Type Checking
```bash
cd 3_borges-interface
npm run type-check
```

---

## Common Issues

### Neo4j Connection Failed
- Verify Neo4j is running: `neo4j status`
- Check credentials in `.env`
- Ensure Bolt port (7687) is accessible

### Book Ingestion Fails
- Check file format (PDF, EPUB, TXT supported)
- Verify OpenAI API key is valid
- Check logs: `tail -f reconciliation-api/logs/ingestion.log`

### Graph Visualization Not Loading
- Check browser console for errors
- Verify backend API is reachable
- Try clearing browser cache

---

## Next Steps

- Review [data-model.md](./data-model.md) for Neo4j schema details
- Check [contracts/](./contracts/) for full API specifications
- See [research.md](./research.md) for technical decisions
