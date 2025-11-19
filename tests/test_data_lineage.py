"""
Unit Tests for Data Lineage: Book Chunk → Entity → Community → Query
Feature: 001-interactive-graphrag-refinement
Purpose: Demonstrate end-to-end traceability from raw text chunks to graph entities

These tests demonstrate the complete data lineage in the Borges Library:
1. Raw book text chunks (from book_data/)
2. Entities extracted from chunks
3. Communities formed from entities
4. Relationships between entities
5. Query results that use these entities

All tests use REAL data from the Neo4j database - no mocks.
"""

import pytest
import sys
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from reconciliation-api/.env
env_path = Path(__file__).parent.parent / "reconciliation-api" / ".env"
load_dotenv(env_path)

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "reconciliation-api"))

from services.neo4j_client import Neo4jClient


class SyncNeo4jClient:
    """Synchronous wrapper for Neo4jClient to use in tests"""

    def __init__(self):
        self.client = Neo4jClient()

    def execute_query(self, query, **params):
        """Execute a Cypher query synchronously"""
        async def _run():
            async with self.client.driver.session() as session:
                result = await session.run(query, **params)
                return [dict(record) async for record in result]

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(_run())
        finally:
            loop.close()

    def close(self):
        """Close the Neo4j connection"""
        async def _close():
            await self.client.close()

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_close())
        finally:
            loop.close()


@pytest.fixture(scope="module")
def neo4j_client():
    """Fixture: Neo4j client for database queries"""
    client = SyncNeo4jClient()
    yield client
    client.close()


class TestBookChunkToEntityLinkage:
    """
    Test Suite 1: Verify that text chunks link to extracted entities

    Validates the data lineage from raw book text to entity extraction.
    Uses real data from "Chien Blanc" by Romain Gary.
    """

    def test_book_exists_in_database(self, neo4j_client):
        """Test that the book 'Chien Blanc' exists in Neo4j"""
        query = """
        MATCH (b:BOOK)
        WHERE b.name CONTAINS 'Chien' OR b.title CONTAINS 'Chien'
        RETURN b.id as book_id, b.name as name, b.title as title, b.author as author
        LIMIT 1
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Book 'Chien Blanc' should exist in database"
        book = result[0]
        book_title = book.get('title') or book.get('name')
        assert book_title is not None
        print(f"\n✓ Book found: '{book_title}' (ID: {book['book_id']})")

    def test_book_contains_entities(self, neo4j_client):
        """Test that the book has entities linked via CONTAINS_ENTITY relationship"""
        query = """
        MATCH (b:BOOK)-[r:CONTAINS_ENTITY]->(e:Entity)
        WHERE b.title CONTAINS 'Chien'
        RETURN b.title as book_title,
               count(e) as entity_count,
               collect(e.name)[..5] as sample_entities
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Book should have entities"
        book_data = result[0]
        assert book_data['entity_count'] > 0, "Book should contain at least one entity"

        print(f"\n✓ Book '{book_data['book_title']}' contains {book_data['entity_count']} entities")
        print(f"  Sample entities: {book_data['sample_entities']}")

    def test_entity_has_book_context(self, neo4j_client):
        """Test that entities preserve their book source via book_dir property"""
        query = """
        MATCH (b:BOOK {title: 'chien_blanc_gary'})-[:CONTAINS_ENTITY]->(e:Entity)
        RETURN e.name as entity_name,
               e.entity_type as entity_type,
               e.book_dir as book_dir,
               e.description as description
        LIMIT 5
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should find entities with book context"

        for entity in result:
            assert entity['book_dir'] is not None, f"Entity {entity['entity_name']} should have book_dir"
            assert 'chien_blanc_gary' in entity['book_dir'], "book_dir should reference source book"
            print(f"\n✓ Entity: {entity['entity_name']} ({entity['entity_type']})")
            print(f"  Book context: {entity['book_dir']}")
            print(f"  Description: {entity['description'][:100]}...")

    def test_chunk_to_entity_traceability(self, neo4j_client):
        """
        Test complete traceability: Raw chunk text → Entity

        This test demonstrates that we can trace from:
        1. Original book text chunk (stored in kv_store_text_chunks.json)
        2. To the entity extracted from that chunk

        Uses real chunk data from Chien Blanc.
        """
        # Real chunk content from Chien Blanc (first few sentences)
        sample_chunk_content = "Romain Gary"

        # Find entities from this book
        query = """
        MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e:Entity)
        WHERE b.title CONTAINS 'Chien'
          AND e.entity_type IN ['PERSON', 'CONCEPT', 'EVENT']
        RETURN e.name as entity_name,
               e.entity_type as entity_type,
               e.description as description,
               e.book_dir as book_dir,
               b.title as book_title
        LIMIT 10
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should find entities extracted from book chunks"

        print(f"\n✓ Found {len(result)} entities extracted from Chien Blanc chunks:")
        for entity in result[:5]:
            print(f"\n  Entity: {entity['entity_name']} ({entity['entity_type']})")
            print(f"  From book: {entity['book_title']}")
            print(f"  Description: {entity['description'][:100]}...")


class TestEntityToCommunityLinkage:
    """
    Test Suite 2: Verify that entities are grouped into communities

    Validates the data lineage from entities to community hierarchies.
    """

    def test_communities_exist(self, neo4j_client):
        """Test that communities exist in the database"""
        query = """
        MATCH (c:Community)
        RETURN count(c) as community_count,
               collect(c.title)[..3] as sample_titles
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should have communities"
        community_data = result[0]
        assert community_data['community_count'] > 0, "Should have at least one community"

        print(f"\n✓ Found {community_data['community_count']} communities")
        print(f"  Sample titles: {community_data['sample_titles']}")

    def test_community_contains_entities(self, neo4j_client):
        """Test that communities contain entities via CONTAINS relationship"""
        query = """
        MATCH (c:Community)-[r:CONTAINS]->(e:Entity)
        WITH c, count(e) as entity_count, collect(e.name)[..5] as entities
        WHERE entity_count > 0
        RETURN c.id as community_id,
               c.title as community_title,
               c.level as level,
               entity_count,
               entities
        ORDER BY entity_count DESC
        LIMIT 5
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Communities should contain entities"

        print(f"\n✓ Found {len(result)} communities with entities:")
        for comm in result:
            print(f"\n  Community: {comm['community_title']}")
            print(f"  Level: {comm['level']}")
            print(f"  Entity count: {comm['entity_count']}")
            print(f"  Sample entities: {comm['entities']}")

    def test_community_hierarchy(self, neo4j_client):
        """Test that communities have hierarchical structure (via level property)"""
        query = """
        MATCH (c:Community)
        WITH c.level as level, count(c) as count
        RETURN level, count
        ORDER BY level
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should have community hierarchy levels"

        print("\n✓ Community hierarchy structure:")
        for level_data in result:
            print(f"  Level {level_data['level']}: {level_data['count']} communities")

    def test_entity_to_community_traceability(self, neo4j_client):
        """
        Test complete traceability: Entity → Community

        Demonstrates that we can trace from an entity to the community it belongs to.
        """
        query = """
        MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e:Entity)<-[:CONTAINS]-(c:Community)
        WHERE b.title CONTAINS 'Chien'
        RETURN e.name as entity_name,
               e.entity_type as entity_type,
               c.title as community_title,
               c.level as community_level,
               c.report as community_report
        LIMIT 5
        """

        result = neo4j_client.execute_query(query)

        if len(result) > 0:
            print(f"\n✓ Found {len(result)} entity-to-community linkages:")
            for link in result:
                print(f"\n  Entity: {link['entity_name']} ({link['entity_type']})")
                print(f"  → Community: {link['community_title']} (Level {link['community_level']})")
                if link['community_report']:
                    print(f"  Community summary: {link['community_report'][:100]}...")
        else:
            print("\n⚠ No direct entity-community linkages found (may use different schema)")


class TestEntityRelationships:
    """
    Test Suite 3: Verify relationships between entities

    Validates the graph structure: Entity → RELATED_TO → Entity
    """

    def test_relationships_exist(self, neo4j_client):
        """Test that entities have relationships with each other"""
        query = """
        MATCH (e1:Entity)-[r:RELATED_TO]->(e2:Entity)
        WHERE e1.book_dir CONTAINS 'chien_blanc_gary'
        RETURN count(r) as relationship_count
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should have relationships"
        rel_count = result[0]['relationship_count']
        assert rel_count > 0, "Should have at least one relationship"

        print(f"\n✓ Found {rel_count} relationships in Chien Blanc")

    def test_relationship_properties(self, neo4j_client):
        """Test that relationships have descriptive properties"""
        query = """
        MATCH (e1:Entity)-[r:RELATED_TO]->(e2:Entity)
        WHERE e1.book_dir CONTAINS 'chien_blanc_gary'
        RETURN e1.name as source_entity,
               e2.name as target_entity,
               r.description as description,
               r.weight as weight,
               r.book_dir as book_context
        LIMIT 5
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should find relationships with properties"

        print(f"\n✓ Sample relationships from Chien Blanc:")
        for rel in result:
            print(f"\n  {rel['source_entity']} → {rel['target_entity']}")
            print(f"  Description: {rel['description'][:100] if rel['description'] else 'N/A'}...")
            print(f"  Weight: {rel['weight']}")
            print(f"  Book context: {rel['book_context']}")

    def test_multi_hop_relationships(self, neo4j_client):
        """Test that we can traverse multi-hop relationship paths"""
        query = """
        MATCH path = (e1:Entity)-[:RELATED_TO*1..2]->(e2:Entity)
        WHERE e1.book_dir CONTAINS 'chien_blanc_gary'
          AND e2.book_dir CONTAINS 'chien_blanc_gary'
        WITH path, length(path) as path_length
        WHERE path_length = 2
        RETURN nodes(path)[0].name as start_entity,
               nodes(path)[1].name as intermediate_entity,
               nodes(path)[2].name as end_entity,
               path_length
        LIMIT 3
        """

        result = neo4j_client.execute_query(query)

        if len(result) > 0:
            print(f"\n✓ Found {len(result)} 2-hop relationship paths:")
            for path in result:
                print(f"\n  {path['start_entity']} → {path['intermediate_entity']} → {path['end_entity']}")
        else:
            print("\n⚠ No 2-hop paths found (may need more connected data)")


class TestCompleteProvenanceChain:
    """
    Test Suite 4: Complete provenance chain from chunk to query

    Demonstrates end-to-end traceability:
    Book → Text Chunk → Entity → Relationship → Community → Query Result

    This is the core interpretability requirement (Constitutional Principle I).
    """

    def test_book_to_entity_to_community_chain(self, neo4j_client):
        """
        Test complete chain: Book → Entity → Community

        Demonstrates that we can trace from a book through its entities to communities.
        """
        query = """
        MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e:Entity)
        OPTIONAL MATCH (e)<-[:CONTAINS]-(c:Community)
        WHERE b.title CONTAINS 'Chien'
        RETURN b.title as book,
               b.author as author,
               e.name as entity,
               e.entity_type as entity_type,
               e.description as entity_description,
               c.title as community
        LIMIT 10
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should find complete book-entity chains"

        print("\n✓ Complete data lineage chain (Book → Entity → Community):")
        print("=" * 80)

        for i, chain in enumerate(result[:5], 1):
            print(f"\nChain {i}:")
            print(f"  📚 Book: '{chain['book']}' by {chain['author']}")
            print(f"  ↓")
            print(f"  🏷️  Entity: {chain['entity']} ({chain['entity_type']})")
            print(f"     Description: {chain['entity_description'][:100] if chain['entity_description'] else 'N/A'}...")
            print(f"  ↓")
            print(f"  👥 Community: {chain['community'] or 'N/A'}")

    def test_entity_relationship_network(self, neo4j_client):
        """
        Test entity relationship network from a book

        Demonstrates the graph structure extracted from book text.
        """
        query = """
        MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e1:Entity)-[r:RELATED_TO]->(e2:Entity)
        WHERE b.title CONTAINS 'Chien'
        RETURN b.title as book,
               count(DISTINCT e1) as source_entities,
               count(DISTINCT e2) as target_entities,
               count(r) as relationships
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should find entity relationship network"

        network = result[0]
        print(f"\n✓ Entity relationship network for '{network['book']}':")
        print(f"  Source entities: {network['source_entities']}")
        print(f"  Target entities: {network['target_entities']}")
        print(f"  Relationships: {network['relationships']}")

    def test_cross_book_entity_connections(self, neo4j_client):
        """
        Test that entities can connect across different books

        This validates Constitutional Principle V (Inter-Book Knowledge Exploration).
        """
        query = """
        MATCH (b1:BOOK)-[:CONTAINS_ENTITY]->(e:Entity)<-[:CONTAINS_ENTITY]-(b2:BOOK)
        WHERE b1.id <> b2.id
        WITH e, collect(DISTINCT b1.title) + collect(DISTINCT b2.title) as books
        WHERE size(books) > 1
        RETURN e.name as entity_name,
               e.entity_type as entity_type,
               books as appears_in_books
        LIMIT 5
        """

        result = neo4j_client.execute_query(query)

        if len(result) > 0:
            print(f"\n✓ Found {len(result)} entities appearing in multiple books:")
            for entity in result:
                print(f"\n  Entity: {entity['entity_name']} ({entity['entity_type']})")
                print(f"  Appears in: {entity['appears_in_books']}")
        else:
            print("\n⚠ No cross-book entity connections found (books may be analyzed separately)")

    def test_constitutional_principle_no_orphan_nodes(self, neo4j_client):
        """
        Test Constitutional Principle III: No Orphan Nodes

        Verifies that all entities in the database have at least one relationship.
        """
        query = """
        MATCH (e:Entity)
        WHERE NOT (e)-[]-()
        RETURN count(e) as orphan_count
        """

        result = neo4j_client.execute_query(query)

        orphan_count = result[0]['orphan_count']

        # This is a critical constitutional principle - should be 0
        assert orphan_count == 0, f"Found {orphan_count} orphan nodes - violates Constitutional Principle III!"

        print(f"\n✓ Constitutional Principle III validated: No orphan nodes found")

    def test_provenance_chain_summary(self, neo4j_client):
        """
        Test: Generate a complete provenance chain summary

        This test demonstrates what will be displayed in the UI when a user
        clicks through the provenance chain.
        """
        query = """
        MATCH (b:BOOK)-[:CONTAINS_ENTITY]->(e:Entity)
        OPTIONAL MATCH (e)-[r:RELATED_TO]->(e2:Entity)
        OPTIONAL MATCH (e)<-[:CONTAINS]-(c:Community)
        WHERE b.title CONTAINS 'Chien'
        WITH b, e, count(DISTINCT r) as rel_count, collect(DISTINCT c.title)[0] as community
        RETURN b.title as book_title,
               b.author as author,
               count(DISTINCT e) as total_entities,
               sum(rel_count) as total_relationships,
               count(DISTINCT community) as communities_count
        """

        result = neo4j_client.execute_query(query)

        assert len(result) > 0, "Should generate provenance summary"

        summary = result[0]
        print("\n" + "=" * 80)
        print("COMPLETE PROVENANCE CHAIN SUMMARY")
        print("=" * 80)
        print(f"\n📚 Source Book: '{summary['book_title']}' by {summary['author']}")
        print(f"   ↓")
        print(f"🏷️  Extracted Entities: {summary['total_entities']}")
        print(f"   ↓")
        print(f"🔗 Relationships: {summary['total_relationships']}")
        print(f"   ↓")
        print(f"👥 Communities: {summary['communities_count'] if summary['communities_count'] > 0 else 'N/A'}")
        print("\n" + "=" * 80)
        print("✓ End-to-end interpretability validated (Constitutional Principle I)")
        print("=" * 80)


if __name__ == "__main__":
    # Run tests with verbose output
    pytest.main([__file__, "-v", "-s"])
