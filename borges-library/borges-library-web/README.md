# GraphRAG API - Minimal Deployment

Flask API for GraphRAG (Graph Retrieval-Augmented Generation) with automatic Google Drive data download.

## Features

- GraphRAG search over literary knowledge graphs
- Automatic book data download from Google Drive
- Fallback test data system
- Ready for Railway deployment

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