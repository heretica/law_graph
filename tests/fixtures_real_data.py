"""
Test Fixtures with Real Book Data

This module contains real data samples from the Borges Library corpus.
These fixtures demonstrate the actual data structure from raw text chunks
to extracted entities, communities, and relationships.

Source: Chien Blanc by Romain Gary (book_data/chien_blanc_gary/)
"""

# Real text chunk from Chien Blanc (chunk-6fc2bd9dedea56c0bf2c9c2c9540c7e1)
REAL_TEXT_CHUNK_1 = {
    "chunk_id": "chunk-6fc2bd9dedea56c0bf2c9c2c9540c7e1",
    "content": """Romain Gary

Chien Blanc

Gallimard

A Sandy.

PREMIÈRE PARTIE

I

C'était un chien gris avec une verrue comme un grain de beauté sur le côté droit du museau et du poil roussi autour de la truffe, ce qui le faisait ressembler au fumeur invétéré sur l'enseigne du Chien-qui-fume, un bar-tabac à Nice, non loin du lycée de mon enfance.

Il m'observait, la tête légèrement penchée de côté, d'un regard intense et fixe, ce regard des chiens de fourrière qui vous guettent au passage avec un espoir angoissé et insupportable.""",
    "tokens": 1200,
    "chunk_order_index": 0,
    "full_doc_id": "doc-cc80a31e2a00a310aba27e1af6ab4dea",
    "book": "chien_blanc_gary",
    "author": "Romain Gary"
}

# Real text chunk from Chien Blanc (chunk-5c07a001b42564b2f30d5ac55318c188)
REAL_TEXT_CHUNK_2 = {
    "chunk_id": "chunk-5c07a001b42564b2f30d5ac55318c188",
    "content": """Il avait en effet ramené un copain de rencontre. C'était un berger allemand grisonnant, âgé de six ou sept ans environ, une belle bête qui donnait une impression de force et d'intelligence. Je remarquai qu'il n'avait pas de collier, ce qui était rare pour un chien de race.

Je fis entrer mon salopard, mais le berger allemand ne partait pas, et il pleuvait si dur que son poil mouillé et collé le faisait ressembler à un phoque.""",
    "tokens": 1200,
    "chunk_order_index": 1,
    "full_doc_id": "doc-cc80a31e2a00a310aba27e1af6ab4dea",
    "book": "chien_blanc_gary",
    "author": "Romain Gary"
}

# Expected entities that should be extracted from these chunks
EXPECTED_ENTITIES_FROM_CHUNKS = [
    {
        "name": "Romain Gary",
        "entity_type": "PERSON",
        "description": "Author of Chien Blanc, French novelist and diplomat",
        "book_dir": "chien_blanc_gary",
        "observations": [
            "Author of the novel",
            "Narrator of the story",
            "Lives in Beverly Hills"
        ]
    },
    {
        "name": "Sandy",
        "entity_type": "ANIMAL",
        "description": "The narrator's dog, a yellow dog",
        "book_dir": "chien_blanc_gary",
        "observations": [
            "Yellow dog owned by narrator",
            "Friendly temperament",
            "Brings home the white dog"
        ]
    },
    {
        "name": "Batka",
        "entity_type": "ANIMAL",
        "description": "The white dog, a German shepherd with racist training",
        "book_dir": "chien_blanc_gary",
        "observations": [
            "German shepherd",
            "Gray coat with verrue",
            "Trained to attack Black people",
            "Nicknamed 'petit père' (little father) in Russian"
        ]
    },
    {
        "name": "Beverly Hills",
        "entity_type": "LOCATION",
        "description": "Location in Los Angeles where events take place",
        "book_dir": "chien_blanc_gary",
        "observations": [
            "Setting of the story",
            "Where narrator lives with Jean Seberg"
        ]
    },
    {
        "name": "Jean Seberg",
        "entity_type": "PERSON",
        "description": "Actress, wife of narrator",
        "book_dir": "chien_blanc_gary",
        "observations": [
            "American actress",
            "Married to narrator",
            "Involved in civil rights movement"
        ]
    },
    {
        "name": "racisme",
        "entity_type": "CONCEPT",
        "description": "Central theme: racism and its conditioning",
        "book_dir": "chien_blanc_gary",
        "observations": [
            "The dog was trained to hate Black people",
            "Represents systematic conditioning",
            "Core theme of the novel"
        ]
    }
]

# Expected relationships between entities
EXPECTED_RELATIONSHIPS = [
    {
        "source": "Romain Gary",
        "target": "Sandy",
        "relationship_type": "OWNS",
        "description": "Romain Gary owns the dog Sandy",
        "book_dir": "chien_blanc_gary",
        "weight": 0.9
    },
    {
        "source": "Romain Gary",
        "target": "Jean Seberg",
        "relationship_type": "MARRIED_TO",
        "description": "Romain Gary is married to actress Jean Seberg",
        "book_dir": "chien_blanc_gary",
        "weight": 0.95
    },
    {
        "source": "Romain Gary",
        "target": "Batka",
        "relationship_type": "ADOPTS",
        "description": "Romain Gary adopts the white dog (Batka)",
        "book_dir": "chien_blanc_gary",
        "weight": 0.85
    },
    {
        "source": "Batka",
        "target": "racisme",
        "relationship_type": "REPRESENTS",
        "description": "The white dog represents conditioned racism",
        "book_dir": "chien_blanc_gary",
        "weight": 0.95
    },
    {
        "source": "Romain Gary",
        "target": "Beverly Hills",
        "relationship_type": "LIVES_IN",
        "description": "Romain Gary lives in Beverly Hills",
        "book_dir": "chien_blanc_gary",
        "weight": 0.8
    }
]

# Expected community structure (thematic groupings)
EXPECTED_COMMUNITIES = [
    {
        "title": "Characters and Relationships",
        "level": 0,
        "entities": ["Romain Gary", "Jean Seberg", "Sandy", "Batka"],
        "report": "Community of main characters in the novel, including the narrator, his wife, and the dogs",
        "rank": 9.5
    },
    {
        "title": "Themes: Racism and Conditioning",
        "level": 0,
        "entities": ["Batka", "racisme", "dressage", "violence"],
        "report": "Community exploring the central theme of conditioned racism through the white dog's behavior",
        "rank": 9.8
    },
    {
        "title": "Setting: 1960s America",
        "level": 0,
        "entities": ["Beverly Hills", "Los Angeles", "Hollywood", "Civil Rights Movement"],
        "report": "Community representing the historical and geographical context of 1960s America",
        "rank": 8.5
    }
]

# Sample provenance chain for a hypothetical query
SAMPLE_PROVENANCE_CHAIN = {
    "query": {
        "id": "query-sample-001",
        "question": "What does the white dog represent in Chien Blanc?",
        "answer_text": """The white dog (Batka) in Romain Gary's novel represents conditioned racism.
        The dog was systematically trained to attack Black people, symbolizing how hatred can be
        deliberately instilled through conditioning. Gary uses this metaphor to explore themes of
        racism in 1960s America, particularly during the Civil Rights Movement. The dog's violent
        behavior reflects the systematic nature of racial prejudice.""",
        "timestamp": "2025-11-19T14:30:00",
        "mode": "local",
        "version": 1
    },
    "used_entities": [
        {
            "entity_name": "Batka",
            "entity_type": "ANIMAL",
            "rank": 1,
            "relevance_score": 0.98,
            "contribution": "direct_match"
        },
        {
            "entity_name": "racisme",
            "entity_type": "CONCEPT",
            "rank": 2,
            "relevance_score": 0.95,
            "contribution": "direct_match"
        },
        {
            "entity_name": "Romain Gary",
            "entity_type": "PERSON",
            "rank": 3,
            "relevance_score": 0.85,
            "contribution": "context"
        },
        {
            "entity_name": "Civil Rights Movement",
            "entity_type": "EVENT",
            "rank": 4,
            "relevance_score": 0.75,
            "contribution": "context"
        }
    ],
    "traversed_relationships": [
        {
            "source": "Batka",
            "target": "racisme",
            "relationship_type": "REPRESENTS",
            "order": 1,
            "weight": 0.95,
            "hop_distance": 1
        },
        {
            "source": "Romain Gary",
            "target": "Batka",
            "relationship_type": "ADOPTS",
            "order": 2,
            "weight": 0.85,
            "hop_distance": 1
        }
    ],
    "source_chunks": [
        {
            "chunk_id": "chunk-6fc2bd9dedea56c0bf2c9c2c9540c7e1",
            "content": REAL_TEXT_CHUNK_1["content"][:200] + "...",
            "book": "Chien Blanc",
            "author": "Romain Gary",
            "relevance_score": 0.92
        },
        {
            "chunk_id": "chunk-5c07a001b42564b2f30d5ac55318c188",
            "content": REAL_TEXT_CHUNK_2["content"][:200] + "...",
            "book": "Chien Blanc",
            "author": "Romain Gary",
            "relevance_score": 0.88
        }
    ],
    "communities": [
        {
            "community_id": "comm-001",
            "title": "Themes: Racism and Conditioning",
            "relevance_score": 0.95,
            "summary_used": "Community exploring conditioned racism through the white dog"
        }
    ]
}

# Data lineage validation schema
DATA_LINEAGE_SCHEMA = {
    "Book": {
        "node_label": "BOOK",
        "properties": ["id", "title", "author", "book_dir"],
        "required": True,
        "connects_to": ["Entity"]
    },
    "TextChunk": {
        "storage": "kv_store_text_chunks.json",
        "properties": ["chunk_id", "content", "tokens", "chunk_order_index", "full_doc_id"],
        "required": True,
        "connects_to": ["Entity"]
    },
    "Entity": {
        "node_label": "Entity",
        "properties": ["id", "name", "entity_type", "description", "book_dir", "observations"],
        "required": True,
        "connects_to": ["Book", "Community", "Entity"]
    },
    "Relationship": {
        "relationship_type": "RELATED_TO",
        "properties": ["description", "weight", "book_dir"],
        "required": True,
        "connects": ["Entity", "Entity"]
    },
    "Community": {
        "node_label": "Community",
        "properties": ["id", "title", "level", "report", "rank"],
        "required": False,
        "connects_to": ["Entity"]
    },
    "Query": {
        "node_label": "Query",
        "properties": ["id", "question", "answer_text", "timestamp", "version"],
        "required": False,
        "connects_to": ["QueryResult"]
    },
    "QueryResult": {
        "node_label": "QueryResult",
        "properties": ["id", "query_id", "timestamp"],
        "required": False,
        "connects_to": ["Entity", "Community"]
    }
}


def get_book_data_path():
    """Return the path to the book_data directory"""
    import pathlib
    repo_root = pathlib.Path(__file__).parent.parent
    return repo_root / "book_data" / "chien_blanc_gary"


def load_real_text_chunks():
    """
    Load real text chunks from kv_store_text_chunks.json

    Returns:
        dict: Dictionary of text chunks from Chien Blanc
    """
    import json
    from pathlib import Path

    chunks_file = get_book_data_path() / "kv_store_text_chunks.json"

    if not chunks_file.exists():
        return {}

    with open(chunks_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_real_entities():
    """
    Load real entities from vdb_entities.json

    Returns:
        dict: Dictionary of entities extracted from Chien Blanc
    """
    import json
    from pathlib import Path

    entities_file = get_book_data_path() / "vdb_entities.json"

    if not entities_file.exists():
        return {}

    with open(entities_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_real_community_reports():
    """
    Load real community reports from kv_store_community_reports.json

    Returns:
        dict: Dictionary of community reports from Chien Blanc
    """
    import json
    from pathlib import Path

    reports_file = get_book_data_path() / "kv_store_community_reports.json"

    if not reports_file.exists():
        return {}

    with open(reports_file, 'r', encoding='utf-8') as f:
        return json.load(f)


if __name__ == "__main__":
    """Print sample data for debugging"""
    print("=" * 80)
    print("REAL BOOK DATA FIXTURES - Chien Blanc by Romain Gary")
    print("=" * 80)

    print("\n1. REAL TEXT CHUNK SAMPLE:")
    print("-" * 80)
    print(f"Chunk ID: {REAL_TEXT_CHUNK_1['chunk_id']}")
    print(f"Book: {REAL_TEXT_CHUNK_1['book']}")
    print(f"Author: {REAL_TEXT_CHUNK_1['author']}")
    print(f"Content preview:\n{REAL_TEXT_CHUNK_1['content'][:300]}...")

    print("\n2. EXPECTED ENTITIES FROM CHUNKS:")
    print("-" * 80)
    for entity in EXPECTED_ENTITIES_FROM_CHUNKS[:3]:
        print(f"\nEntity: {entity['name']} ({entity['entity_type']})")
        print(f"Description: {entity['description']}")

    print("\n3. EXPECTED RELATIONSHIPS:")
    print("-" * 80)
    for rel in EXPECTED_RELATIONSHIPS[:3]:
        print(f"\n{rel['source']} --[{rel['relationship_type']}]--> {rel['target']}")
        print(f"Description: {rel['description']}")

    print("\n4. SAMPLE PROVENANCE CHAIN:")
    print("-" * 80)
    print(f"Query: {SAMPLE_PROVENANCE_CHAIN['query']['question']}")
    print(f"Used {len(SAMPLE_PROVENANCE_CHAIN['used_entities'])} entities")
    print(f"Traversed {len(SAMPLE_PROVENANCE_CHAIN['traversed_relationships'])} relationships")
    print(f"From {len(SAMPLE_PROVENANCE_CHAIN['source_chunks'])} text chunks")

    print("\n" + "=" * 80)
    print("✓ All fixtures loaded successfully")
    print("=" * 80)
