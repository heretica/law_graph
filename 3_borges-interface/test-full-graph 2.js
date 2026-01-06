/**
 * Test the new grand_debat_get_full_graph endpoint
 */

async function testFullGraph() {
  console.log('🧪 Testing grand_debat_get_full_graph endpoint\n');

  try {
    const url = 'http://localhost:3000/api/law-graphrag?action=get_full_graph&max_communes=50&include_relationships=true';
    console.log('📡 Fetching:', url);

    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}:`, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return;
    }

    const result = await response.json();

    console.log('\n✅ Success! Response received in', duration, 'ms\n');
    console.log('📊 Graph Statistics:');
    console.log('  - Success:', result.success);
    console.log('  - Entities:', result.graphrag_data?.entities?.length ?? 0);
    console.log('  - Relationships:', result.graphrag_data?.relationships?.length ?? 0);
    console.log('  - Source chunks:', result.graphrag_data?.source_chunks?.length ?? 0);
    console.log('  - Communities:', result.graphrag_data?.communities?.length ?? 0);

    if (result.graphrag_data?.entities) {
      console.log('\n📋 Sample Entities (first 10):');
      result.graphrag_data.entities.slice(0, 10).forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.name} (${e.type}) - ${e.source_commune}`);
      });

      // Count entities by commune
      const communeCounts = {};
      result.graphrag_data.entities.forEach(e => {
        const commune = e.source_commune || 'Unknown';
        communeCounts[commune] = (communeCounts[commune] || 0) + 1;
      });

      console.log('\n🏛️  Entities by Commune (top 10):');
      Object.entries(communeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([commune, count], i) => {
          console.log(`  ${i + 1}. ${commune}: ${count} entities`);
        });
    }

    if (result.graphrag_data?.relationships?.length > 0) {
      console.log('\n🔗 Sample Relationships (first 5):');
      result.graphrag_data.relationships.slice(0, 5).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.source} --[${r.type}]--> ${r.target}`);
      });
    }

    // Check for expected behavior
    console.log('\n🔍 Validation:');
    const hasEntities = result.graphrag_data?.entities?.length > 0;
    const hasMinimumEntities = result.graphrag_data?.entities?.length >= 100;
    const hasRelationships = result.graphrag_data?.relationships?.length > 0;
    const hasCivicProvenance = result.graphrag_data?.entities?.every(e => e.source_commune);

    console.log('  ✓ Has entities:', hasEntities ? '✅' : '❌');
    console.log('  ✓ Has 100+ entities:', hasMinimumEntities ? '✅' : '❌');
    console.log('  ✓ Has relationships:', hasRelationships ? '✅' : '❌');
    console.log('  ✓ All entities have commune:', hasCivicProvenance ? '✅' : '❌');

    if (hasEntities && hasMinimumEntities && hasRelationships && hasCivicProvenance) {
      console.log('\n🎉 All checks passed! The endpoint is working correctly.');
    } else {
      console.log('\n⚠️  Some checks failed. Review the output above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFullGraph().catch(console.error);
