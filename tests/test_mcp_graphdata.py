#!/usr/bin/env python3
"""
Diagnostic script to test what the MCP server actually returns
Tests if provenance.entities and provenance.relationships are populated
"""

import json
import requests
import uuid

MCP_URL = "https://graphragmcp-production.up.railway.app/mcp"

def test_mcp_query():
    """Test a query and inspect the provenance data"""
    print("🔍 Testing MCP query response format...\n")

    # Step 1: Initialize session
    print("1️⃣ Initializing MCP session...")
    init_response = requests.post(
        MCP_URL,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        },
        json={
            "jsonrpc": "2.0",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "diagnostic-script", "version": "1.0"}
            },
            "id": 1
        }
    )

    if init_response.status_code != 200:
        print(f"❌ Initialization failed: {init_response.status_code}")
        print(init_response.text)
        return

    session_id = init_response.headers.get("mcp-session-id")
    if not session_id:
        print("❌ No session ID in response")
        return

    print(f"✅ Session initialized: {session_id}\n")

    # Step 2: Call grand_debat_query
    print("2️⃣ Calling grand_debat_query...")
    query_text = "Quelles sont les préoccupations sur les impôts ?"

    query_response = requests.post(
        MCP_URL,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "mcp-session-id": session_id
        },
        json={
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": "grand_debat_query",
                "arguments": {
                    "commune_id": "Andilly",  # Using valid commune ID from available_communes
                    "query": query_text,
                    "mode": "local",
                    "include_sources": True
                }
            },
            "id": 2
        }
    )

    if query_response.status_code != 200:
        print(f"❌ Query failed: {query_response.status_code}")
        print(query_response.text)
        return

    # Parse SSE response
    print("✅ Response received\n")
    text = query_response.text

    # Extract JSON from SSE format
    result = None
    for line in text.split('\n'):
        if line.startswith('data: '):
            try:
                json_str = line[6:]  # Remove "data: " prefix
                parsed = json.loads(json_str)
                if 'result' in parsed and 'content' in parsed['result']:
                    content = parsed['result']['content']
                    if isinstance(content, list) and len(content) > 0:
                        text_content = content[0].get('text', '')
                        if isinstance(text_content, str):
                            try:
                                result = json.loads(text_content)
                            except:
                                result = text_content
                        else:
                            result = text_content
                        break
            except:
                continue

    if not result:
        print("❌ Could not parse MCP response")
        return

    # Diagnostic output
    print("📊 MCP Response Structure:")
    print(f"  Type: {type(result)}")

    if isinstance(result, dict):
        print(f"  Top-level keys: {', '.join(result.keys())}")
        print()

        # CHECK 0: Error first
        print("🔎 CHECK 0: Error status")
        if 'error' in result:
            print(f"  ❌ ERROR DETECTED:")
            print(f"     {result['error']}")
            if 'available_communes' in result:
                print(f"     Available communes: {result['available_communes']}")
        print()

        # CHECK 1: Answer
        print("🔎 CHECK 1: Answer")
        if 'answer' in result:
            print(f"  ✅ answer: {len(result['answer'])} chars")
            print(f"     Preview: {result['answer'][:100]}...")
        else:
            print("  ❌ No 'answer' field")
        print()

        # CHECK 2: Provenance structure
        print("🔎 CHECK 2: Provenance structure")
        if 'provenance' in result:
            print("  ✅ provenance EXISTS")
            prov = result['provenance']
            print(f"     Keys: {', '.join(prov.keys())}")

            # Entities
            if 'entities' in prov:
                entities = prov['entities']
                print(f"     - entities: {len(entities)} items")
                if len(entities) > 0:
                    print(f"       Sample: {json.dumps(entities[0], indent=8)}")
            else:
                print("     ❌ No 'entities' in provenance")

            # Relationships
            if 'relationships' in prov:
                rels = prov['relationships']
                print(f"     - relationships: {len(rels)} items")
                if len(rels) > 0:
                    print(f"       Sample: {json.dumps(rels[0], indent=8)}")
            else:
                print("     ❌ No 'relationships' in provenance")

            # Source quotes
            if 'source_quotes' in prov:
                quotes = prov['source_quotes']
                print(f"     - source_quotes: {len(quotes)} items")
            else:
                print("     - No 'source_quotes' in provenance")

        else:
            print("  ❌ provenance DOES NOT EXIST")
            print("     Available keys:", ', '.join(result.keys()))
        print()

        # DIAGNOSIS
        print("📋 DIAGNOSIS:")
        has_provenance = 'provenance' in result
        has_entities = has_provenance and 'entities' in result['provenance'] and len(result['provenance']['entities']) > 0
        has_relationships = has_provenance and 'relationships' in result['provenance'] and len(result['provenance']['relationships']) > 0

        if not has_provenance:
            print("  ❌ CRITICAL: No 'provenance' field in MCP response")
            print("     → route.ts will set graphrag_data = undefined")
            print("     → law-graphrag.ts will return null")
            print("     → BorgesLibrary.tsx will fallback to static baseGraph")
            print()
            print("  🔧 CAUSE: MCP server not returning provenance data")
            print("     Need to check MCP tool implementation")

        elif not has_entities:
            print("  ❌ PROBLEM: provenance exists but NO entities")
            print("     → route.ts will create empty entities array")
            print("     → law-graphrag.ts transformToGraphData returns null (no nodes)")
            print("     → BorgesLibrary.tsx will fallback to static baseGraph")
            print()
            print("  🔧 CAUSE: MCP not extracting entities from query")

        elif not has_relationships:
            print("  ⚠️ WARNING: Entities exist but NO relationships")
            print("     → Graph will show disconnected nodes")
            print("     → Violates Constitution Principle III (No Orphan Nodes)")

        else:
            print("  ✅ MCP returns complete graph data:")
            print(f"     - {len(result['provenance']['entities'])} entities")
            print(f"     - {len(result['provenance']['relationships'])} relationships")
            print("     → Should display query-specific subgraph correctly")
            print()
            print("  🤔 If subgraph still doesn't change, check:")
            print("     1. Client-side cache (5min TTL in law-graphrag.ts)")
            print("     2. BorgesLibrary.tsx state updates")
            print("     3. Console logs in browser DevTools")

    else:
        print(f"  Unexpected result type: {result}")

    # Step 3: Shutdown session
    print("\n3️⃣ Shutting down session...")
    shutdown_response = requests.post(
        MCP_URL,
        headers={
            "Content-Type": "application/json",
            "mcp-session-id": session_id
        },
        json={
            "jsonrpc": "2.0",
            "method": "shutdown",
            "id": 3
        }
    )
    print("✅ Session closed")

if __name__ == "__main__":
    test_mcp_query()
