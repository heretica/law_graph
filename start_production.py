#!/usr/bin/env python3
"""
Production startup script for GraphRAG API on Railway
"""
import os
import sys
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Set environment variables
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('PORT', '5001')

# Try to import the best available GraphRAG API version
try:
    # Try v3 first (most robust)
    from graphrag_railway_v3 import app
    print("✅ Using GraphRAG API v3.0 (improved version)")
except ImportError:
    try:
        # Fallback to production version
        from graphrag_railway_production import app
        print("⚠️  Using GraphRAG Railway production version")
    except ImportError:
        # Final fallback
        from graphrag_api import app
        print("⚠️  Using basic GraphRAG API")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))

    # Download book data if needed
    print("=== Checking Book Data ===")
    try:
        from download_data import download_and_extract_data
        download_and_extract_data()
    except Exception as e:
        print(f"Data download error: {e}")

    # List available books for debugging
    print("=== GraphRAG API Starting ===")
    print(f"Port: {port}")
    print(f"Working directory: {os.getcwd()}")

    # List available book directories
    book_dirs = []
    for item in os.listdir('.'):
        if os.path.isdir(item) and not item.startswith('.') and item not in ['borges-library-web', 'graph', 'examples', 'tests', 'nano_graphrag', '__pycache__', 'hf_space']:
            graph_file = os.path.join(item, 'graph_chunk_entity_relation.graphml')
            if os.path.exists(graph_file):
                book_dirs.append(item)

    print(f"Available books: {book_dirs}")
    print("=== Starting Flask Server ===")

    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )