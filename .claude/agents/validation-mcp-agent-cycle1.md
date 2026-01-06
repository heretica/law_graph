---
agent: mcp-agent
cycle: 1
timestamp: 2026-01-03T14:30:00Z
score: 2/10
status: completed
---

## Score: 2/10

**Status**: CRITICAL FAILURE - Chunk Retrieval Broken

### Accessibilité MCP

| Vérification | Résultat |
|--------------|----------|
| Server accessible | ✅ |
| Latence moyenne | ~10,000ms |
| Communes disponibles | 50/50 |

### Validation Outils

| Outil | Status | Provenance |
|-------|--------|------------|
| grand_debat_list_communes | ✅ | N/A |
| grand_debat_query | ⚠️ | Unknown (not tested) |
| grand_debat_query_all | ⚠️ | Unknown (not tested) |
| grand_debat_query_fast | ❌ | **0.15%** |
| grand_debat_search_entities | ⚠️ | Unknown (not tested) |
| grand_debat_get_communities | ⚠️ | Unknown (not tested) |

### Chaîne de Provenance

| Étape | Vérification |
|-------|--------------|
| Chunk → Entité | ❌ **0% traçable** |
| Entité → Relation | ✅ 100% liées |
| Relation → Réponse | ✅ 100% incluses |
| Source Quote → Commune | ❌ **0.15%** attribuées |

## PROBLÈME CRITIQUE IDENTIFIÉ

### Symptômes (Données Expérimentales)

D'après l'analyse des traces expérimentales:
- **1,318 traces** enregistrées avec `grand_debat_query_fast`
- **Seulement 2 traces** (0.15%) contiennent des `source_quotes` avec du texte citoyen réel
- **1,316 traces** (99.85%) retournent des labels d'entités au lieu de chunks de texte

### Root Cause Analysis

**DÉCOUVERTE CRITIQUE**: Les GraphML ne contiennent PAS d'edges `HAS_SOURCE`

#### Investigation du Code

**Fichier**: `/Users/arthursarazin/Documents/graphRAGmcp/server.py`

**Fonction**: `grand_debat_query_fast()` (lignes 1745-1763)

```python
# Code actuel (BROKEN)
for seed_id in all_seeds[:100]:  # seed_id = "FISCALITÉ", "CSG", etc.
    chunks = index.get_chunks_for_entity(seed_id)  # ← Appelle GraphIndex
    # ... traite les chunks
```

**Fichier**: `/Users/arthursarazin/Documents/graphRAGmcp/graph_index.py`

**Fonction**: `get_chunks_for_entity()` (ligne 391)

```python
def get_chunks_for_entity(self, entity_id: str) -> List[ChunkMetadata]:
    chunks = []
    for edge in self.get_neighbors(entity_id):
        if edge.rel_type == "HAS_SOURCE" and edge.target in self._chunks:
            chunks.append(self._chunks[edge.target])
    return chunks  # ← Retourne [] car HAS_SOURCE n'existe pas!
```

#### Investigation GraphML (Preuve Empirique)

**Fichier analysé**: `law_data/Andilly/graph_chunk_entity_relation.graphml`

**Edge types présents dans GraphML**:
```
✅ FAIT_PARTIE_DE
✅ FAIT_REMONTER
✅ RELATED_TO
❌ HAS_SOURCE (ABSENT!)
```

**Structure réelle des données**:
```xml
<node id="CSG">
  <data key="entity_type">REFORMEFISCALE</data>
  <data key="source_id">contrib-ad5d...958<SEP>contrib-6e0d...058</data>
  <!-- ↑ Les chunk IDs sont dans l'ATTRIBUT source_id, pas dans des edges -->
</node>
```

**Conséquence**:
```
Entity "FISCALITÉ" → get_chunks_for_entity("FISCALITÉ")
                   → Cherche edges HAS_SOURCE
                   → Trouve 0 edges (HAS_SOURCE n'existe pas)
                   → Retourne []
                   → source_quotes = []
```

### Pourquoi 0.15% Fonctionnent?

Les 2 cas sur 1,318 qui fonctionnent sont probablement dus à:
1. Fallback vers les community reports (qui ont des `chunk_ids`)
2. Ou parsing accidentel de `source_id` dans certaines conditions

### Impact Constitution

#### Principe I - No Orphaned Nodes
❌ **VIOLÉ**: Les chunks sont orphelins - aucune edge ne les relie aux entités

#### Principe V - End-to-End Interpretability
❌ **VIOLÉ**: Impossible de remonter du chunk au RAG (chaîne brisée)

#### Principe VII - Civic Provenance Chain
❌ **VIOLÉ**: 99.85% des réponses n'ont pas de provenance textuelle

## Solutions Proposées

### Option 1: Parser source_id au lieu de HAS_SOURCE (RAPIDE)

**Fichier**: `graph_index.py`

Modifier `get_chunks_for_entity()`:

```python
def get_chunks_for_entity(self, entity_id: str) -> List[ChunkMetadata]:
    """Get chunks by parsing source_id attribute instead of HAS_SOURCE edges."""
    chunks = []

    # NEW: Get entity metadata
    entity = self._entities.get(entity_id)
    if not entity:
        return chunks

    # NEW: Parse source_id from entity node (stored during GraphML load)
    # Assuming we store source_ids during _load_commune_graphml()
    source_ids = entity.source_ids  # List[str] from parsing source_id attribute

    for chunk_id in source_ids:
        if chunk_id in self._chunks:
            chunks.append(self._chunks[chunk_id])

    return chunks
```

**Modifications requises**:
1. Stocker `source_id` dans `EntityMetadata` lors du parsing GraphML
2. Splitter les IDs séparés par `<SEP>`
3. Retourner les chunks correspondants depuis `_chunks`

**Avantage**: Pas besoin de régénérer les GraphML

### Option 2: Régénérer GraphML avec edges HAS_SOURCE (PROPRE)

**Fichier**: Pipeline d'indexation

Ajouter la création explicite d'edges pendant l'indexation:

```python
# Dans le pipeline nano_graphrag
for entity_node in entities:
    for chunk_id in entity_node.source_ids:
        graph.add_edge(
            source=entity_node.id,
            target=chunk_id,
            relationship_type="HAS_SOURCE",
            weight=1.0
        )
```

**Avantage**: Architecture propre, respecte le design original

**Inconvénient**: Nécessite re-indexation des 50 communes

### Option 3: Fallback hybride (ROBUSTE)

Combiner les deux approches:

```python
def get_chunks_for_entity(self, entity_id: str) -> List[ChunkMetadata]:
    chunks = []

    # Strategy 1: Try HAS_SOURCE edges (future-proof)
    for edge in self.get_neighbors(entity_id):
        if edge.rel_type == "HAS_SOURCE" and edge.target in self._chunks:
            chunks.append(self._chunks[edge.target])

    # Strategy 2: Fallback to source_id attribute (current data)
    if not chunks:
        entity = self._entities.get(entity_id)
        if entity and hasattr(entity, 'source_ids'):
            for chunk_id in entity.source_ids:
                if chunk_id in self._chunks:
                    chunks.append(self._chunks[chunk_id])

    return chunks
```

## Recommandations

### Priorité 1: FIX IMMÉDIAT (Option 1)
1. ✅ Modifier `EntityMetadata` pour stocker `source_ids: List[str]`
2. ✅ Parser `source_id` lors du chargement GraphML dans `graph_index.py`
3. ✅ Modifier `get_chunks_for_entity()` pour utiliser `source_ids`
4. ✅ Tester avec query test: "Quelles sont les préoccupations fiscales ?"
5. ✅ Vérifier que `source_quotes` contient >10 chunks avec texte réel

**Temps estimé**: 2 heures
**Impact**: Restaure interprétabilité de 0.15% → 95%+

### Priorité 2: VALIDATION (1 jour)
1. Exécuter 100 queries de test
2. Mesurer taux de chunks réels vs labels
3. Vérifier que chaque `source_quote` a:
   - `content` (texte citoyen, pas label)
   - `commune` (attribution)
   - `chunk_id` (traçabilité)

### Priorité 3: ARCHITECTURE (1 semaine)
1. Régénérer GraphML avec edges HAS_SOURCE explicites
2. Passer à Option 3 (fallback hybride) pour robustesse
3. Ajouter tests unitaires pour `get_chunks_for_entity()`

## Forces

- ✅ GraphIndex fonctionne (expansion multi-hop correcte)
- ✅ Entities et relations sont bien extraites
- ✅ Performance <10s respectée
- ✅ Communes bien identifiées dans les réponses

## Problèmes Détectés

- [CRITICAL] `get_chunks_for_entity()` retourne `[]` pour 99.85% des queries
- [CRITICAL] GraphML n'a pas d'edges `HAS_SOURCE` - chunks liés via attribut `source_id`
- [MAJOR] Violation Constitution Principe V (End-to-End Interpretability)
- [MAJOR] Violation Constitution Principe VII (Civic Provenance Chain)
- [MINOR] Pas de test de validation automatique pour chunk retrieval

## Logs Tests

### Test GraphML Structure
```bash
$ python3 analyze_graphml.py law_data/Andilly/graph_chunk_entity_relation.graphml

Edge types found:
  - FAIT_PARTIE_DE
  - FAIT_REMONTER
  - RELATED_TO

HAS_SOURCE edges: 0
Entities with source_id attribute: 421

Sample entity:
  ID: "CSG"
  Type: "REFORMEFISCALE"
  source_id: "contrib-ad5d...958<SEP>contrib-6e0d...058<SEP>..."
```

### Test GraphIndex Chunk Retrieval
```python
index = await ensure_graph_index_initialized()
chunks = index.get_chunks_for_entity("FISCALITÉ")
print(f"Chunks found: {len(chunks)}")  # Result: 0 ❌

# Expected: ~5-10 chunks
# Actual: 0 chunks
```

### Test Production Endpoint
```
Query: "Quelles sont les préoccupations fiscales des citoyens ?"
Tool: grand_debat_query_fast

Response.provenance.source_quotes: []
Response.provenance.entities: 145 entities ✅
Response.provenance.relationships: 83 paths ✅

Issue: Entities returned, but NO citizen text chunks!
```

## Relation avec Constitution

**Constitution v3.1.0 - Principe V**:
> "L'interface doit permettre une interprétabilité de bout-en-bout du graphRAG.
> On doit pouvoir naviguer du chunk de texte citoyen jusqu'à la réponse du RAG."

**Status**: ❌ VIOLÉ (99.85% échec)

**Constitution v3.1.0 - Principe VII**:
> "Chaque entité doit être traçable jusqu'à sa commune source et au texte citoyen original."

**Status**: ❌ VIOLÉ (pas de texte citoyen dans source_quotes)

---

**Agent Status**: VALIDATION FAILED
**Next Action**: IMPLEMENT FIX (Option 1)
**Revalidation**: After fix deployed
**Last Updated**: 2026-01-03
