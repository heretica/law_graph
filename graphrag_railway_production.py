#!/usr/bin/env python3
"""
API GraphRAG corrigée pour Railway - Parsing GraphML amélioré
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import xml.etree.ElementTree as ET
from pathlib import Path
import random
import requests
import zipfile
import html

app = Flask(__name__)

def download_from_google_drive(file_id, destination):
    """Télécharge un fichier depuis Google Drive"""
    try:
        print(f"📥 Téléchargement depuis Google Drive: {destination}")

        session = requests.Session()
        initial_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        response = session.get(initial_url, stream=True)

        # Gérer les gros fichiers avec avertissement antivirus
        if response.status_code == 200 and ('confirm=' in response.text or 'virus scan warning' in response.text.lower()):
            print("⚠️  Gros fichier détecté, extraction du lien...")

            import re
            confirm_match = re.search(r'confirm=([^&"]*)', response.text)
            if confirm_match:
                confirm_token = confirm_match.group(1)
                confirm_url = f"https://drive.google.com/uc?export=download&confirm={confirm_token}&id={file_id}"
                response = session.get(confirm_url, stream=True)

        response.raise_for_status()

        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        print(f"✅ Téléchargement terminé: {destination}")
        return True

    except Exception as e:
        print(f"❌ Erreur de téléchargement: {e}")
        return False

def download_and_extract_data():
    """Télécharge et extrait les données de livres depuis Google Drive"""
    required_dirs = [
        'vallee_sans_hommes_frison', 'racines_ciel_gary', 'policeman_decoin',
        'a_rebours_huysmans', 'chien_blanc_gary', 'peau_bison_frison',
        'tilleul_soir_anglade', 'villa_triste_modiano'
    ]

    existing_dirs = [d for d in required_dirs if os.path.exists(d)]

    if len(existing_dirs) == len(required_dirs):
        print("✅ Toutes les données de livres sont déjà présentes")
        return True

    print(f"📚 Données manquantes: {len(required_dirs) - len(existing_dirs)} dossiers")

    # Obtenir l'ID du fichier Google Drive
    drive_file_id = os.environ.get('BOOK_DATA_DRIVE_ID', '1NTgs97rvlVHYozTfodNo5kKsambOpXr1')

    if not drive_file_id:
        print("❌ Variable BOOK_DATA_DRIVE_ID non trouvée")
        return False

    archive_name = "book_data.zip"

    if download_from_google_drive(drive_file_id, archive_name):
        print("📦 Extraction de l'archive...")

        try:
            with zipfile.ZipFile(archive_name, 'r') as zip_ref:
                zip_ref.extractall('.')

            os.remove(archive_name)
            print("✅ Extraction terminée avec succès")
            return True

        except Exception as e:
            print(f"❌ Erreur d'extraction: {e}")
            return False

    return False

# CORS configuration for Railway deployment
CORS(app, origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "https://borges-library-web.vercel.app",
    "https://*.vercel.app",
    "https://reconciliation-api-production.up.railway.app"
],
methods=['GET', 'POST', 'OPTIONS'],
allow_headers=['Content-Type', 'Authorization'],
supports_credentials=True)

def find_books():
    """Find all available books with GraphRAG data"""
    books = []
    for item in os.listdir('.'):
        if os.path.isdir(item) and not item.startswith('.'):
            # Check for GraphRAG data files
            graph_path = f"{item}/graph_chunk_entity_relation.graphml"
            if os.path.exists(graph_path):
                books.append({
                    "id": item,
                    "name": item.replace('_', ' ').title(),
                    "has_data": True,
                    "graph_path": graph_path
                })
    return books

def clean_id(raw_id):
    """Nettoie les IDs avec guillemets HTML"""
    if not raw_id:
        return ""
    # Décoder les entités HTML et supprimer les guillemets
    cleaned = html.unescape(raw_id).strip('"')
    return cleaned

def safe_get_text(element):
    """Récupère le texte d'un élément XML de manière sécurisée"""
    if element is not None and element.text is not None:
        return element.text.strip()
    return ""

def parse_graphml(graph_path):
    """Parse GraphML file to extract entities and relationships - Version corrigée"""
    try:
        print(f"📄 Parsing GraphML: {graph_path}")

        tree = ET.parse(graph_path)
        root = tree.getroot()

        # Namespace handling
        ns = {'g': 'http://graphml.graphdrawing.org/xmlns'}

        entities = []
        relationships = []

        # Créer un mapping des keys pour comprendre les attributs
        key_mapping = {}
        for key in root.findall('.//g:key', ns):
            key_id = key.get('id')
            key_name = key.get('attr.name')
            if key_id and key_name:
                key_mapping[key_id] = key_name

        print(f"🔑 Keys trouvées: {key_mapping}")

        # Extract nodes (entities)
        node_count = 0
        for node in root.findall('.//g:node', ns):
            node_id = node.get('id')
            if not node_id:
                continue

            # Nettoyer l'ID
            clean_node_id = clean_id(node_id)

            entity_data = {
                'id': clean_node_id,
                'raw_id': node_id
            }

            # Extract node attributes
            for data in node.findall('g:data', ns):
                key = data.get('key')
                value = safe_get_text(data)

                if key and key in key_mapping:
                    attr_name = key_mapping[key]
                    # Nettoyer les valeurs avec guillemets
                    if value:
                        clean_value = html.unescape(value).strip('"')
                        entity_data[attr_name] = clean_value

            # S'assurer qu'on a au moins un type et une description
            if 'entity_type' not in entity_data:
                entity_data['entity_type'] = 'UNKNOWN'
            if 'description' not in entity_data:
                entity_data['description'] = f"Entité {clean_node_id}"

            entities.append(entity_data)
            node_count += 1

        print(f"✅ Noeuds extraits: {node_count}")

        # Extract edges (relationships)
        edge_count = 0
        for edge in root.findall('.//g:edge', ns):
            source = edge.get('source')
            target = edge.get('target')

            if not source or not target:
                continue

            # Nettoyer les IDs source et target
            clean_source = clean_id(source)
            clean_target = clean_id(target)

            rel_data = {
                'source': clean_source,
                'target': clean_target,
                'raw_source': source,
                'raw_target': target
            }

            # Extract edge attributes
            for data in edge.findall('g:data', ns):
                key = data.get('key')
                value = safe_get_text(data)

                if key and key in key_mapping:
                    attr_name = key_mapping[key]
                    if value:
                        # Gérer les valeurs numériques
                        if attr_name == 'weight':
                            try:
                                rel_data[attr_name] = float(value)
                            except ValueError:
                                rel_data[attr_name] = 1.0
                        else:
                            clean_value = html.unescape(value).strip('"')
                            rel_data[attr_name] = clean_value

            # S'assurer qu'on a au moins une description et un poids
            if 'description' not in rel_data:
                rel_data['description'] = 'Relation'
            if 'weight' not in rel_data:
                rel_data['weight'] = 1.0

            relationships.append(rel_data)
            edge_count += 1

        print(f"✅ Relations extraites: {edge_count}")
        print(f"📊 Total: {len(entities)} entités, {len(relationships)} relations")

        return entities, relationships

    except Exception as e:
        print(f"❌ Erreur parsing GraphML: {e}")
        import traceback
        traceback.print_exc()
        return [], []

def simulate_graphrag_response(query, book_id, entities, relationships):
    """Simulate a GraphRAG response using local graph data"""

    # Simple keyword matching for entity relevance
    query_words = [w.lower() for w in query.split() if len(w) > 2]
    relevant_entities = []

    for entity in entities:
        entity_text = ""
        # Construire le texte de recherche
        for key, value in entity.items():
            if isinstance(value, str):
                entity_text += f" {value.lower()}"

        relevance_score = 0
        for word in query_words:
            if word in entity_text:
                relevance_score += 1

        if relevance_score > 0:
            relevant_entities.append({
                **entity,
                'relevance': relevance_score,
                'score': min(1.0, relevance_score / len(query_words))
            })

    # Si aucune entité trouvée par mots-clés, prendre les premières
    if not relevant_entities and entities:
        relevant_entities = [
            {**entity, 'relevance': 1, 'score': 0.5}
            for entity in entities[:10]
        ]

    # Sort by relevance
    relevant_entities.sort(key=lambda x: x.get('relevance', 0), reverse=True)
    relevant_entities = relevant_entities[:20]  # Top 20

    # Find relevant relationships
    relevant_entity_ids = [e['id'] for e in relevant_entities]
    relevant_relationships = []

    for rel in relationships:
        if (rel.get('source') in relevant_entity_ids or
            rel.get('target') in relevant_entity_ids):
            relevant_relationships.append(rel)

    # Generate a contextual answer
    if 'personnage' in query.lower() or 'character' in query.lower():
        person_entities = [e for e in relevant_entities if
                         e.get('entity_type', '').lower() in ['person', 'personnes']]
        if person_entities:
            char_names = [e.get('id', 'Unknown')[:50] for e in person_entities[:3]]
            answer = f"Dans '{book_id.replace('_', ' ')}', les personnages principaux incluent : {', '.join(char_names)}."
        else:
            answer = f"L'analyse de '{book_id.replace('_', ' ')}' révèle plusieurs personnages importants dans le récit."

    elif 'thème' in query.lower() or 'theme' in query.lower():
        concept_entities = [e for e in relevant_entities if
                          e.get('entity_type', '').lower() in ['concept', 'event']]
        if concept_entities:
            themes = [e.get('id', 'Unknown')[:30] for e in concept_entities[:2]]
            answer = f"Les thèmes principaux de '{book_id.replace('_', ' ')}' incluent : {', '.join(themes).lower()}."
        else:
            answer = f"'{book_id.replace('_', ' ')}' explore des thèmes complexes de littérature française."

    elif 'lieu' in query.lower() or 'location' in query.lower():
        location_entities = [e for e in relevant_entities if
                           e.get('entity_type', '').lower() in ['geo', 'location']]
        if location_entities:
            places = [e.get('id', 'Unknown')[:30] for e in location_entities[:2]]
            answer = f"L'action de '{book_id.replace('_', ' ')}' se déroule principalement à : {', '.join(places)}."
        else:
            answer = f"'{book_id.replace('_', ' ')}' se déroule dans divers lieux significatifs."

    else:
        answer = f"L'analyse de '{book_id.replace('_', ' ')}' révèle {len(relevant_entities)} éléments pertinents liés à votre requête, incluant des personnages, des lieux et des concepts thématiques."

    return {
        "success": True,
        "answer": answer,
        "searchPath": {
            "entities": [
                {
                    "id": e.get('id', ''),
                    "type": e.get('entity_type', 'ENTITY'),
                    "description": e.get('description', '')[:200] + "..." if len(e.get('description', '')) > 200 else e.get('description', ''),
                    "order": i+1,
                    "score": e.get('score', 0.5)
                }
                for i, e in enumerate(relevant_entities[:10])
            ],
            "relations": [
                {
                    "source": r.get('source', ''),
                    "target": r.get('target', ''),
                    "description": r.get('description', ''),
                    "weight": r.get('weight', 1.0),
                    "traversalOrder": i+1
                }
                for i, r in enumerate(relevant_relationships[:15])
            ],
            "communities": [
                {
                    "id": f"community_{i}",
                    "content": f"Cluster thématique {i+1} de {book_id}",
                    "relevance": 0.9 - (i * 0.15)
                }
                for i in range(3)
            ]
        },
        "book_id": book_id,
        "mode": "local_corrected",
        "query": query,
        "stats": {
            "total_entities": len(entities),
            "total_relationships": len(relationships),
            "relevant_entities": len(relevant_entities),
            "relevant_relationships": len(relevant_relationships)
        }
    }

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "GraphRAG API Railway v2"})

@app.route('/books', methods=['GET'])
def list_books():
    """List all available books with GraphRAG data"""
    books = find_books()
    return jsonify({"books": books})

@app.route('/query', methods=['POST'])
def query_graph():
    try:
        data = request.json
        query = data.get('query', '')
        book_id = data.get('book_id', None)
        mode = data.get('mode', 'local')

        if not query:
            return jsonify({"error": "Query is required"}), 400

        # Find books
        books = find_books()

        # Get book_id if not specified
        if not book_id and books:
            book_id = books[0]['id']

        # Find the requested book
        book_data = None
        for book in books:
            if book['id'] == book_id:
                book_data = book
                break

        if not book_data:
            return jsonify({"error": f"Book '{book_id}' not found"}), 404

        # Parse GraphML data
        entities, relationships = parse_graphml(book_data['graph_path'])

        if not entities:
            return jsonify({"error": f"No entities found for book '{book_id}'"}), 404

        # Generate response
        response = simulate_graphrag_response(query, book_id, entities, relationships)

        return jsonify(response)

    except Exception as e:
        print(f"Error in query_graph: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Railway deployment configuration
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting GraphRAG API Railway v2 on port {port}")

    # Download and extract data from Google Drive first
    print("📥 === TÉLÉCHARGEMENT DES DONNÉES DEPUIS GOOGLE DRIVE ===")
    data_success = download_and_extract_data()

    if data_success:
        print("✅ Données prêtes!")
    else:
        print("⚠️ Échec du téléchargement, API fonctionnera avec les données disponibles")

    # Show available books
    books = find_books()
    print(f"📚 Available books ({len(books)}):")
    for book in books:
        print(f"  ✅ {book['id']} - {book['name']}")

    if not books:
        print("  ❌ No books with GraphRAG data found!")
        print("  📁 Current directory:", os.getcwd())

    app.run(host='0.0.0.0', port=port, debug=False)