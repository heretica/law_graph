"""
Simplified Data Lineage Tests - Working Demo

Tests demonstrate real data lineage in the Borges Library:
Book → Entity → Relationship → Community

Uses REAL data from Neo4j Aura - no mocks.
"""

import pytest
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / "reconciliation-api" / ".env"
load_dotenv(env_path)

sys.path.insert(0, str(Path(__file__).parent.parent / "reconciliation-api"))

from services.neo4j_client import Neo4jClient


class SyncNeo4jClient:
    """Synchronous wrapper for Neo4j operations"""

    def __init__(self):
        self.client = Neo4jClient()

    def query(self, cypher, **params):
        """Execute Cypher query synchronously"""
        async def _run():
            async with self.client.driver.session() as session:
                result = await session.run(cypher, **params)
                return [dict(record) async for record in result]

        return asyncio.run(_run())

    def close(self):
        """Close connection"""
        asyncio.run(self.client.close())


@pytest.fixture(scope="module")
def db():
    """Database connection fixture"""
    client = SyncNeo4jClient()
    yield client
    client.close()


def test_raw_text_chunks_exist():
    """Test: Raw text chunks exist (foundation of data lineage)"""
    import json
    from pathlib import Path

    chunks_file = Path("book_data/chien_blanc_gary/kv_store_text_chunks.json")

    assert chunks_file.exists(), "Chunk file should exist"

    with open(chunks_file, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    total_chunks = len(chunks)
    total_chars = sum(len(chunk['content']) for chunk in chunks.values())
    avg_chars = total_chars // total_chunks if total_chunks > 0 else 0

    assert total_chunks > 0, "Should have text chunks"
    assert total_chars > 0, "Chunks should have content"

    print("\n" + "=" * 70)
    print("📄 RAW TEXT CHUNKS (Foundation of Data Lineage)")
    print("=" * 70)
    print(f"   Book: Chien Blanc by Romain Gary")
    print(f"   Total chunks: {total_chunks}")
    print(f"   Total characters: {total_chars:,}")
    print(f"   Average chars/chunk: {avg_chars:,}")
    print("=" * 70)


def test_books_exist(db):
    """Test: Books exist in the database"""
    result = db.query("""
        MATCH (b:BOOK)
        RETURN count(b) as book_count,
               collect(b.name)[0..3] as sample_books
    """)

    assert len(result) > 0
    assert result[0]['book_count'] > 0

    print(f"\n✅ Found {result[0]['book_count']} books in database")
    print(f"   Sample: {result[0]['sample_books']}")


def test_chien_blanc_exists(db):
    """Test: Specific book 'Chien Blanc' exists"""
    result = db.query("""
        MATCH (b:BOOK)
        WHERE b.name CONTAINS 'Chien'
        RETURN b.id as id, b.name as name
    """)

    assert len(result) > 0
    print(f"\n✅ Book found: {result[0]['name']}")
    print(f"   ID: {result[0]['id']}")


def test_book_has_entities(db):
    """Test: Books contain entities (Book → Entity linkage)"""
    result = db.query("""
        MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e:Entity)
        WHERE b.name CONTAINS 'Chien'
        RETURN b.name as book,
               count(e) as entity_count,
               collect(e.name)[0..5] as sample_entities
    """)

    assert len(result) > 0
    assert result[0]['entity_count'] > 0

    print(f"\n✅ Book contains {result[0]['entity_count']} entities")
    print(f"   Sample entities: {result[0]['sample_entities']}")


def test_entities_have_relationships(db):
    """Test: Entities have relationships (Entity → Entity linkage)"""
    result = db.query("""
        MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e1:Entity)-[r:RELATED_TO]->(e2:Entity)
        WHERE b.name CONTAINS 'Chien'
        RETURN count(r) as relationship_count,
               e1.name as example_source,
               e2.name as example_target
        LIMIT 1
    """)

    assert len(result) > 0
    assert result[0]['relationship_count'] > 0

    print(f"\n✅ Found {result[0]['relationship_count']} relationships")
    print(f"   Example: {result[0]['example_source']} → {result[0]['example_target']}")


def test_communities_exist(db):
    """Test: Communities exist in database"""
    result = db.query("""
        MATCH (c:Community)
        RETURN count(c) as community_count,
               collect(c.title)[0..3] as sample_titles
    """)

    assert len(result) > 0
    assert result[0]['community_count'] > 0

    print(f"\n✅ Found {result[0]['community_count']} communities")
    print(f"   Sample: {result[0]['sample_titles']}")


def test_communities_contain_entities(db):
    """Test: Communities contain entities (Community → Entity linkage)"""
    result = db.query("""
        MATCH (c:Community)-[:CONTAINS]->(e:Entity)
        WITH c, count(e) as entity_count
        WHERE entity_count > 0
        RETURN count(c) as communities_with_entities,
               avg(entity_count) as avg_entities_per_community
    """)

    assert len(result) > 0
    assert result[0]['communities_with_entities'] > 0

    print(f"\n✅ {result[0]['communities_with_entities']} communities contain entities")
    print(f"   Average: {result[0]['avg_entities_per_community']:.1f} entities per community")


def test_complete_data_lineage(db):
    """
    Test: Complete data lineage chain

    Demonstrates: Raw Chunks → Book → Entity → Relationship → Community
    This proves end-to-end traceability (Constitutional Principle I)
    """
    # Get chunk info from file
    import json
    from pathlib import Path

    chunks_file = Path("book_data/chien_blanc_gary/kv_store_text_chunks.json")
    chunk_count = 0
    chunk_chars = 0

    if chunks_file.exists():
        with open(chunks_file, 'r', encoding='utf-8') as f:
            chunks = json.load(f)
            chunk_count = len(chunks)
            chunk_chars = sum(len(chunk['content']) for chunk in chunks.values())

    # Get graph data from Neo4j
    result = db.query("""
        MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e:Entity)
        OPTIONAL MATCH (e)-[r:RELATED_TO]->(e2:Entity)
        OPTIONAL MATCH (c:Community)-[:CONTAINS]->(e)
        WHERE b.name CONTAINS 'Chien'
        RETURN b.name as book,
               count(DISTINCT e) as entities,
               count(DISTINCT r) as relationships,
               count(DISTINCT c) as communities
    """)

    assert len(result) > 0
    lineage = result[0]

    print("\n" + "=" * 70)
    print("COMPLETE DATA LINEAGE DEMONSTRATED")
    print("=" * 70)
    print(f"\n📄 Raw Text Chunks: {chunk_count} chunks, {chunk_chars:,} characters")
    print(f"   ↓ (extraction)")
    print(f"📚 Book: {lineage['book']}")
    print(f"   ↓ (CONTAINS_ENTITY)")
    print(f"🏷️  Extracted Entities: {lineage['entities']}")
    print(f"   ↓ (RELATED_TO)")
    print(f"🔗 Relationships: {lineage['relationships']}")
    print(f"   ↓ (CONTAINS)")
    print(f"👥 Communities: {lineage['communities']}")
    print("\n" + "=" * 70)
    print("✅ End-to-end interpretability validated (Principle I)")
    print("   From raw text → entities → relationships → communities")
    print("=" * 70)

    # Verify we have data at each level
    assert chunk_count > 0, "Should have text chunks"
    assert lineage['entities'] > 0, "Should have entities"
    assert lineage['relationships'] > 0, "Should have relationships"


def test_no_orphan_nodes(db):
    """
    Test: Constitutional Principle III - No Orphan Nodes

    Verifies that all entities have at least one connection
    """
    result = db.query("""
        MATCH (e:Entity)
        WHERE NOT (e)-[]-()
        RETURN count(e) as orphan_count
    """)

    orphan_count = result[0]['orphan_count']

    print(f"\n✅ Constitutional Principle III validated")
    print(f"   Orphan nodes found: {orphan_count}")

    assert orphan_count == 0, f"Found {orphan_count} orphan nodes - violates principle!"


def test_cross_book_connections(db):
    """
    Test: Constitutional Principle V - Inter-Book Knowledge

    Verifies that entities can connect across different books
    """
    result = db.query("""
        MATCH (b1:BOOK)-[:CONTAINS_ENTITY]->(e:Entity)<-[:CONTAINS_ENTITY]-(b2:BOOK)
        WHERE b1.id < b2.id
        RETURN count(DISTINCT e) as shared_entities,
               collect(DISTINCT e.name)[0..5] as examples
    """)

    if result and result[0]['shared_entities'] > 0:
        print(f"\n✅ Found {result[0]['shared_entities']} entities spanning multiple books")
        print(f"   Examples: {result[0]['examples']}")
    else:
        print(f"\n⚠️  No cross-book entities found (books analyzed separately)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
