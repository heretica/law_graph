from flask import Flask, jsonify, request
from neo4j import GraphDatabase
import os

app = Flask(__name__)

# Neo4j configuration
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://your-instance.databases.neo4j.io")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "your-password")

driver = None

def get_driver():
    global driver
    if driver is None:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
    return driver

@app.route('/health', methods=['GET'])
def health():
    try:
        with get_driver().session() as session:
            result = session.run("RETURN 1 as test")
            result.single()
        return jsonify({"status": "healthy", "service": "neo4j-api"})
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@app.route('/nodes', methods=['GET'])
def get_nodes():
    try:
        limit = request.args.get('limit', 100, type=int)
        centrality_type = request.args.get('centrality_type', 'degree')

        query = f"""
        MATCH (n)
        RETURN n.id as id, labels(n) as labels, properties(n) as properties,
               size((n)--()) as degree,
               coalesce(n.{centrality_type}_centrality, 0) as centrality_score
        ORDER BY centrality_score DESC
        LIMIT $limit
        """

        with get_driver().session() as session:
            result = session.run(query, limit=limit)
            nodes = []
            for record in result:
                nodes.append({
                    "id": record["id"],
                    "labels": record["labels"],
                    "properties": record["properties"],
                    "degree": record["degree"],
                    "centrality_score": record["centrality_score"]
                })

        return jsonify({
            "success": True,
            "nodes": nodes,
            "count": len(nodes),
            "limit": limit
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/relationships', methods=['GET'])
def get_relationships():
    try:
        node_ids = request.args.get('node_ids', '').split(',')
        limit = request.args.get('limit', 1000, type=int)

        if not node_ids or node_ids == ['']:
            return jsonify({"success": False, "error": "node_ids parameter required"}), 400

        query = """
        MATCH (a)-[r]->(b)
        WHERE a.id IN $node_ids AND b.id IN $node_ids
        RETURN r.id as id, type(r) as type, a.id as source, b.id as target, properties(r) as properties
        LIMIT $limit
        """

        with get_driver().session() as session:
            result = session.run(query, node_ids=node_ids, limit=limit)
            relationships = []
            for record in result:
                relationships.append({
                    "id": record["id"],
                    "type": record["type"],
                    "source": record["source"],
                    "target": record["target"],
                    "properties": record["properties"]
                })

        return jsonify({
            "success": True,
            "relationships": relationships,
            "count": len(relationships),
            "input_nodes": len(node_ids),
            "limit_applied": limit,
            "filtered": len(relationships) >= limit
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/search', methods=['GET'])
def search_nodes():
    try:
        query_text = request.args.get('q', '')
        node_type = request.args.get('type', '')
        limit = request.args.get('limit', 50, type=int)

        if not query_text:
            return jsonify({"success": False, "error": "q parameter required"}), 400

        # Build search query
        where_clauses = [f"n.name CONTAINS '{query_text}' OR n.description CONTAINS '{query_text}'"]
        if node_type:
            where_clauses.append(f"'{node_type}' IN labels(n)")

        query = f"""
        MATCH (n)
        WHERE {' AND '.join(where_clauses)}
        RETURN n.id as id, labels(n) as labels, properties(n) as properties,
               size((n)--()) as degree,
               coalesce(n.degree_centrality, 0) as centrality_score
        ORDER BY centrality_score DESC
        LIMIT $limit
        """

        with get_driver().session() as session:
            result = session.run(query, limit=limit)
            nodes = []
            for record in result:
                nodes.append({
                    "id": record["id"],
                    "labels": record["labels"],
                    "properties": record["properties"],
                    "degree": record["degree"],
                    "centrality_score": record["centrality_score"]
                })

        return jsonify({
            "success": True,
            "nodes": nodes,
            "count": len(nodes),
            "query": query_text
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        with get_driver().session() as session:
            # Get node stats
            node_result = session.run("""
            MATCH (n)
            WITH labels(n) as node_labels
            RETURN node_labels, count(*) as count
            ORDER BY count DESC
            """)
            node_types = [{"labels": record["node_labels"], "count": record["count"]} for record in node_result]

            # Get relationship stats
            rel_result = session.run("""
            MATCH ()-[r]->()
            WITH type(r) as rel_type
            RETURN rel_type as type, count(*) as count
            ORDER BY count DESC
            """)
            relationship_types = [{"type": record["type"], "count": record["count"]} for record in rel_result]

            # Get totals
            totals = session.run("""
            MATCH (n)
            WITH count(n) as total_nodes
            MATCH ()-[r]->()
            RETURN total_nodes, count(r) as total_relationships
            """).single()

        return jsonify({
            "success": True,
            "stats": {
                "total_nodes": totals["total_nodes"],
                "total_relationships": totals["total_relationships"],
                "node_types": node_types,
                "relationship_types": relationship_types
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    app.run(host='0.0.0.0', port=port, debug=True)