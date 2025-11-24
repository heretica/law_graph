# GraphRAG API - Minimal Deployment

Flask API for GraphRAG (Graph Retrieval-Augmented Generation) with automatic Google Drive data download.

## Features

- GraphRAG search over literary knowledge graphs
- Automatic book data download from Google Drive
- Fallback test data system
- Ready for Railway deployment

## 📚 Documentation & Specifications

### Feature: Interactive GraphRAG Refinement System

**Core Documentation:**
- [Specification](specs/001-interactive-graphrag-refinement/spec.md) - Feature requirements and user stories
- [Implementation Plan](specs/001-interactive-graphrag-refinement/plan.md) - Technical architecture and file structure
- [Data Model](specs/001-interactive-graphrag-refinement/data-model.md) - Entities, relationships, and graph structure
- [Research Notes](specs/001-interactive-graphrag-refinement/research.md) - Technical decisions and constraints
- [Tasks](specs/001-interactive-graphrag-refinement/tasks.md) - Implementation checklist and progress

**API Contracts:**
- [Provenance API](specs/001-interactive-graphrag-refinement/contracts/provenance-api.yaml) - Track answer sources
- [Edit API](specs/001-interactive-graphrag-refinement/contracts/edit-api.yaml) - Graph refinement operations
- [Pattern API](specs/001-interactive-graphrag-refinement/contracts/pattern-api.yaml) - Ontological pattern discovery
- [Query Comparison API](specs/001-interactive-graphrag-refinement/contracts/query-comparison-api.yaml) - Answer version comparison

**Quality Assurance:**
- [Requirements Checklist](specs/001-interactive-graphrag-refinement/checklists/requirements.md) - Specification validation

**Implementation Notes:**
- [Frontend Implementation](specs/001-interactive-graphrag-refinement/US1-FRONTEND-IMPLEMENTATION.md) - User Story 1 details

## Deployment

1. Set environment variables:
   ```bash
   BOOK_DATA_DRIVE_ID="your-google-drive-file-id"
   OPENAI_API_KEY="your-openai-key"
   PORT="5001"
   ```

2. Deploy to Railway:
   ```bash
   railway up
   ```

The system automatically downloads book data from Google Drive during startup.

## API Endpoints

- `GET /health` - Health check
- `POST /search` - GraphRAG search
- `GET /books` - List available books