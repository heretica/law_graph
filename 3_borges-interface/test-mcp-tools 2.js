/**
 * Test script to investigate MCP tools for loading full graph
 *
 * This script tests different MCP tool combinations to find which one
 * returns the full entity graph (200+ nodes) for initial page load.
 */

async function testMCPTool(toolName, args) {
  console.log(`\n========== Testing: ${toolName} ==========`);
  console.log('Args:', JSON.stringify(args, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/law-graphrag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP ${response.status}:`, errorText);
      return null;
    }

    const result = await response.json();

    console.log('✅ Success:', {
      hasAnswer: !!result.answer,
      hasGraphData: !!result.graphrag_data,
      entitiesCount: result.graphrag_data?.entities?.length ?? 0,
      relationshipsCount: result.graphrag_data?.relationships?.length ?? 0,
      communitiesCount: result.graphrag_data?.communities?.length ?? 0,
      sourceChunksCount: result.graphrag_data?.source_chunks?.length ?? 0,
    });

    // Show first few entities if any
    if (result.graphrag_data?.entities?.length > 0) {
      console.log('\nFirst 5 entities:');
      result.graphrag_data.entities.slice(0, 5).forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.name} (${e.type})`);
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🔬 Testing MCP Tools for Full Graph Load\n');

  // Test 1: grand_debat_query_all with 'local' mode (current approach)
  await testMCPTool('grand_debat_query_all (local mode)', {
    query: 'INIT_GRAPH_TEST_1',
    mode: 'local',
  });

  // Test 2: grand_debat_query_all with a semantic query instead of INIT
  await testMCPTool('grand_debat_query_all (semantic query, local)', {
    query: 'Quelles sont les principales préoccupations citoyennes ?',
    mode: 'local',
  });

  // Test 3: grand_debat_query_all with 'global' mode
  await testMCPTool('grand_debat_query_all (global mode)', {
    query: 'Préoccupations citoyennes',
    mode: 'global',
  });

  // Test 4: Query a single commune to see if it returns entities
  await testMCPTool('grand_debat_query (single commune)', {
    query: 'Préoccupations citoyennes',
    mode: 'local',
    commune_id: 'Rochefort',
  });

  // Test 5: List communes to verify connectivity
  try {
    console.log('\n========== Testing: grand_debat_list_communes ==========');
    const response = await fetch('http://localhost:3000/api/law-graphrag?action=list_communes');
    const result = await response.json();
    console.log('✅ Communes count:', result.data?.communes?.length ?? 0);
    if (result.data?.communes) {
      console.log('Sample communes:', result.data.communes.slice(0, 3).map(c => c.name));
    }
  } catch (error) {
    console.error('❌ Error listing communes:', error.message);
  }

  console.log('\n\n📊 Summary:');
  console.log('The test results above show which MCP tool returns entities.');
  console.log('Look for entitiesCount > 0 to find the working approach.');
}

main().catch(console.error);
