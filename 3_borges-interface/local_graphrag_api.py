#!/usr/bin/env python3
"""
Local NanoGraphRAG API Server
Serves the Dickens data from the test environment like test_query_analysis.py
"""

import sys
import os
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Add the nano-graphrag path to import the library
sys.path.append('/Users/arthursarazin/Documents/nano-graphrag/nano-graphrag-original')

from nano_graphrag import GraphRAG, QueryParam

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize GraphRAG with Dickens data
WORKING_DIR = "/Users/arthursarazin/Documents/nano-graphrag/nano-graphrag-original/tests/extract_entities/dickens_fresh"

# Global GraphRAG instance
graph_rag = None

def initialize_graphrag():
    """Initialize the GraphRAG instance with Dickens data"""
    global graph_rag
    try:
        logger.info(f"Initializing GraphRAG with working directory: {WORKING_DIR}")

        # Check if the directory exists
        if not Path(WORKING_DIR).exists():
            raise FileNotFoundError(f"Working directory not found: {WORKING_DIR}")

        graph_rag = GraphRAG(
            working_dir=WORKING_DIR,
            embedding_func_max_async=4,
            best_model_max_async=2,
            cheap_model_max_async=4,
            embedding_batch_num=16,
            graph_cluster_algorithm="leiden"
        )

        logger.info("✅ GraphRAG initialized successfully with Dickens data")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to initialize GraphRAG: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Local NanoGraphRAG API",
        "data_source": "A Christmas Carol (Dickens)",
        "working_dir": WORKING_DIR
    })

@app.route('/query', methods=['POST'])
def query():
    """Query endpoint compatible with the reconciliation API"""
    global graph_rag

    if not graph_rag:
        return jsonify({
            "success": False,
            "error": "GraphRAG not initialized"
        }), 500

    data = request.json
    query_text = data.get('query', '')
    mode = data.get('mode', 'local')  # local or global

    if not query_text:
        return jsonify({
            "success": False,
            "error": "Query is required"
        }), 400

    try:
        logger.info(f"🔍 Processing query: '{query_text}' (mode: {mode})")

        # Query the GraphRAG system
        result = graph_rag.query(query_text, param=QueryParam(mode=mode))

        logger.info(f"✅ Query completed, result length: {len(result)} characters")

        # Return in a format compatible with the reconciliation API
        return jsonify({
            "success": True,
            "answer": result,
            "searchPath": {
                "entities": [],
                "relations": [],
                "communities": []
            }
        })

    except Exception as e:
        logger.error(f"❌ Query failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/books', methods=['GET'])
def books():
    """List available books - for compatibility"""
    return jsonify({
        "books": [
            {
                "id": "a_christmas_carol_dickens",
                "name": "A Christmas Carol (Dickens)",
                "has_data": True
            }
        ]
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Local NanoGraphRAG API Server...")

    if initialize_graphrag():
        logger.info("🌟 Server ready to serve Dickens queries!")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        logger.error("💥 Failed to start server - GraphRAG initialization failed")
        sys.exit(1)