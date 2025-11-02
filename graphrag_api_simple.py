from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import json
import re
from pathlib import Path
import os
import sys

# Add nano_graphrag to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'nano_graphrag'))

app = Flask(__name__)
# Enhanced CORS configuration for local development and Vercel deployment
CORS(app, origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "https://borges-library-web.vercel.app",
    "https://*.vercel.app",  # For preview deployments
    "https://reconciliation-api-production.up.railway.app"
],
methods=['GET', 'POST', 'OPTIONS'],
allow_headers=['Content-Type', 'Authorization'],
supports_credentials=True)

# Cache des instances GraphRAG par livre
graphrag_instances = {}

def get_graphrag_instance(book_id=None):
    """Get or create a GraphRAG instance for a specific book"""
    try:
        # Import here to avoid startup issues
        from nano_graphrag import GraphRAG, QueryParam
        from nano_graphrag._llm import gpt_4o_mini_complete

        if book_id and book_id not in graphrag_instances:
            working_dir = f"./{book_id}"
            if os.path.exists(working_dir):
                graphrag_instances[book_id] = GraphRAG(
                    working_dir=working_dir,
                    best_model_func=gpt_4o_mini_complete,
                    cheap_model_func=gpt_4o_mini_complete,
                    best_model_max_async=5,
                    cheap_model_max_async=5
                )
        return graphrag_instances.get(book_id)
    except ImportError as e:
        print(f"Import error: {e}")
        return None

def parse_context_csv(context_str):
    """Parse the CSV context returned by GraphRAG to extract entities and relations"""
    entities = []
    relations = []
    communities = []

    # Parse entities section
    entities_match = re.search(r'-----Entities-----\n```csv\n(.*?)\n```', context_str, re.DOTALL)
    if entities_match:
        lines = entities_match.group(1).strip().split('\n')
        # Skip header
        for line in lines[1:]:
            parts = line.split(',')
            if len(parts) >= 5:
                entities.append({
                    'id': parts[1].strip() if len(parts) > 1 else '',
                    'type': parts[2].strip() if len(parts) > 2 else '',
                    'description': ','.join(parts[3:-1]).strip() if len(parts) > 4 else '',
                    'rank': float(parts[-1]) if parts[-1].strip() else 0
                })

    # Parse relationships section
    relations_match = re.search(r'-----Relationships-----\n```csv\n(.*?)\n```', context_str, re.DOTALL)
    if relations_match:
        lines = relations_match.group(1).strip().split('\n')
        # Skip header
        for line in lines[1:]:
            parts = line.split(',')
            if len(parts) >= 6:
                relations.append({
                    'source': parts[1].strip() if len(parts) > 1 else '',
                    'target': parts[2].strip() if len(parts) > 2 else '',
                    'description': ','.join(parts[3:-2]).strip() if len(parts) > 5 else '',
                    'weight': float(parts[-2]) if parts[-2].strip() else 1,
                    'rank': float(parts[-1]) if parts[-1].strip() else 0
                })

    # Parse communities section
    communities_match = re.search(r'-----Reports-----\n```csv\n(.*?)\n```', context_str, re.DOTALL)
    if communities_match:
        lines = communities_match.group(1).strip().split('\n')
        # Skip header
        for line in lines[1:]:
            parts = line.split(',', 1)
            if len(parts) >= 2:
                communities.append({
                    'id': parts[0].strip(),
                    'content': parts[1].strip() if len(parts) > 1 else ''
                })

    return entities, relations, communities

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "GraphRAG API"})

@app.route('/query', methods=['POST'])
def query_graph():
    try:
        data = request.json
        query = data.get('query', '')
        book_id = data.get('book_id', None)
        mode = data.get('mode', 'local')

        if not query:
            return jsonify({"error": "Query is required"}), 400

        # Get available books if no book_id specified
        if not book_id:
            # Find first available book directory
            for item in os.listdir('.'):
                if os.path.isdir(item) and not item.startswith('.') and item not in ['borges-library-web', 'graph', 'examples', 'tests', 'nano_graphrag', '__pycache__', 'reconciliation-api', 'test']:
                    book_id = item
                    break

        if not book_id:
            return jsonify({"error": "No book data found"}), 404

        # Get GraphRAG instance
        graph_func = get_graphrag_instance(book_id)
        if not graph_func:
            return jsonify({"error": f"Book '{book_id}' not found or GraphRAG not available"}), 404

        # Import QueryParam here
        from nano_graphrag import QueryParam

        # Get context first to extract search path
        context_param = QueryParam(mode=mode, only_need_context=True, top_k=30)
        context = asyncio.run(graph_func.aquery(query, param=context_param))

        # Parse context to extract entities and relations
        entities, relations, communities = parse_context_csv(context)

        # Get actual answer
        answer_param = QueryParam(mode=mode, top_k=30)
        answer = asyncio.run(graph_func.aquery(query, param=answer_param))

        # Build search path with traversal order
        search_path = {
            "entities": [
                {**e, "order": i+1, "score": 1.0 - (i * 0.03)}  # Simulate decreasing scores
                for i, e in enumerate(entities[:20])  # Limit to top 20
            ],
            "relations": [
                {**r, "traversalOrder": i+1}
                for i, r in enumerate(relations[:30])  # Limit to top 30
            ],
            "communities": [
                {**c, "relevance": 0.8 - (i * 0.1)}
                for i, c in enumerate(communities[:5])  # Limit to top 5
            ]
        }

        return jsonify({
            "success": True,
            "answer": answer,
            "searchPath": search_path,
            "book_id": book_id,
            "mode": mode,
            "query": query
        })

    except Exception as e:
        print(f"Error in query_graph: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/books', methods=['GET'])
def list_books():
    """List all available books with GraphRAG data"""
    books = []
    for item in os.listdir('.'):
        if os.path.isdir(item) and not item.startswith('.'):
            # Check if it contains GraphRAG data
            graph_path = f"{item}/graph_chunk_entity_relation.graphml"
            if os.path.exists(graph_path):
                books.append({
                    "id": item,
                    "name": item.replace('_', ' ').title(),
                    "has_data": True
                })
    return jsonify({"books": books})

if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting GraphRAG API on port {port}")
    print("Available books:")
    for item in os.listdir('.'):
        if os.path.isdir(item) and not item.startswith('.'):
            graph_path = f"{item}/graph_chunk_entity_relation.graphml"
            status = "✅" if os.path.exists(graph_path) else "❌"
            print(f"  {status} {item}")

    app.run(host='0.0.0.0', port=port, debug=True)