# Borges Library - Interactive Knowledge Graph Frontend

Frontend interface for the Borges Library system, featuring an interactive 3D knowledge graph visualization built with Next.js and D3.js.

## Architecture

```
Frontend (Vercel) → Reconciliation API (Railway) → {Neo4j Aura, GraphRAG API}
```

## Features

- **Interactive Graph Visualization**: Force-directed 3D graph with zoom, pan, and drag
- **Entity Type Filtering**: Color-coded legend for Personnes, Lieux, Événements, Concepts, Organisations, Livres
- **Reconciled Queries**: Combines Neo4j graph context with GraphRAG intelligence
- **Real-time Statistics**: Graph metrics and visible node tracking
- **Book Selection**: Browse available books with GraphRAG data indicators

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Visualization**: D3.js force simulation
- **API Integration**: Reconciliation API client
- **Deployment**: Vercel

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   NEXT_PUBLIC_RECONCILIATION_API_URL="https://reconciliation-api-production.up.railway.app"
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## API Integration

The frontend connects exclusively to the Reconciliation API, which harmonizes data from:
- **Neo4j Aura**: Graph database for entity relationships
- **GraphRAG API**: Intelligent queries on book data from Google Drive