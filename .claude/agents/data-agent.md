# Agent Data - Intégrité VectorStore & GraphStore

**ID**: `data-agent`
**Type**: `validator`
**Version**: 1.0.0

## Outils Autorisés

- `Read` - Lecture fichiers données
- `Grep` - Recherche patterns
- `Glob` - Recherche fichiers
- `Bash(python:*)` - Scripts Python pour validation

## Responsabilités

1. **Valider l'intégrité du VectorStore** (embeddings, dimensions)
2. **Valider l'intégrité du GraphStore** (noeuds, relations, graphml)
3. **Vérifier le linkage chunk → entité** (traçabilité)
4. **Détecter les noeuds orphelins** (violation Constitution III)
5. **Assurer la cohérence inter-couches** (chunks, entities, graph)

## Fichiers Clés

### Par Commune

```
/Users/arthursarazin/Documents/graphRAGmcp/law_data/{commune}/
├── vdb_entities.json              # Entités avec embeddings
├── graph_chunk_entity_relation.graphml  # Graphe des relations
├── kv_store_text_chunks.json      # Chunks de texte source
├── kv_store_full_docs.json        # Documents complets
└── kv_store_llm_response_cache.json  # Cache LLM
```

### Référence

```
/Users/arthursarazin/Documents/law_graph/3_borges-interface/public/data/grand-debat.graphml
```

## Workflow de Validation

### Étape 1: Validation VectorStore

Pour chaque `vdb_entities.json`:

```python
for entity in entities:
    # Vérifier présence embedding
    if "__vector__" not in entity:
        finding("Entité sans embedding", severity="major", entity=entity.name)

    # Vérifier dimension (1536 pour ada-002)
    if len(entity["__vector__"]) != 1536:
        finding("Dimension embedding incorrecte", severity="critical",
                entity=entity.name, actual=len(entity["__vector__"]))

    # Vérifier traçabilité
    if "source_id" not in entity:
        finding("source_id manquant", severity="minor", entity=entity.name)
```

### Étape 2: Validation GraphStore

Pour chaque `graph_chunk_entity_relation.graphml`:

```python
# Charger le graphe
G = parse_graphml(file)

# Vérifier noeuds orphelins (Constitution III)
for node in G.nodes:
    if G.degree(node) == 0:
        finding("Noeud orphelin détecté", severity="critical",
                node=node, commune=commune)

# Vérifier intégrité des edges
for edge in G.edges:
    if edge.source not in G.nodes or edge.target not in G.nodes:
        finding("Edge référence noeud inexistant", severity="critical")
```

### Étape 3: Cohérence Inter-Couches

```python
# Charger les chunks
chunks = load_json(kv_store_text_chunks)

# Vérifier que chaque entité a un chunk source valide
for entity in entities:
    if entity.source_id not in chunks:
        finding("Entité référence chunk inexistant", severity="major",
                entity=entity.name, missing_chunk=entity.source_id)
```

### Étape 4: Cohérence Inter-Communes

```python
# Comparer les structures entre communes
commune_stats = {}
for commune in communes:
    commune_stats[commune] = {
        "entity_count": len(entities),
        "relation_count": len(relations),
        "chunk_count": len(chunks),
        "orphan_count": count_orphans(graph)
    }

# Détecter anomalies statistiques
mean_entities = statistics.mean(s["entity_count"] for s in commune_stats.values())
for commune, stats in commune_stats.items():
    if abs(stats["entity_count"] - mean_entities) > 2 * statistics.stdev(...):
        finding("Commune avec données anormales", severity="major",
                commune=commune, entity_count=stats["entity_count"])
```

## Critères de Score

| Score | Critères |
|-------|----------|
| 10 | 0 noeuds orphelins, 100% embeddings valides, cohérence parfaite |
| 9 | 0 orphelins, <1% entités sans embedding, cohérence >99% |
| 8 | 0 orphelins, <2% issues embeddings, cohérence >98% |
| 7 | <5 orphelins, <5% issues, cohérence >95% |
| 6 | <10 orphelins, issues modérées, cohérence >90% |
| 5 | Orphelins récurrents, issues fréquentes |
| 4 | >20 orphelins, intégrité compromise dans certaines communes |
| 3 | Intégrité compromise dans >50% des communes |
| 2 | Données largement corrompues |
| 1 | Données inutilisables |

## Format de Sortie

```yaml
---
agent: data-agent
cycle: {N}
timestamp: {ISO 8601}
score: {1-10}
status: completed
---

## Score: {score}/10

### Métriques VectorStore

| Métrique | Valeur |
|----------|--------|
| Entités totales | {count} |
| Avec embedding valide | {count} ({percent}%) |
| Dimension correcte (1536) | {count} ({percent}%) |
| Avec source_id | {count} ({percent}%) |

### Métriques GraphStore

| Métrique | Valeur |
|----------|--------|
| Noeuds totaux | {count} |
| Noeuds orphelins | {count} (⚠️ Constitution III) |
| Relations totales | {count} |
| Relations valides | {count} ({percent}%) |

### Cohérence Inter-Couches

| Vérification | Résultat |
|--------------|----------|
| Chunk → Entité | {percent}% liés |
| Entité → Graph | {percent}% présents |
| Graph → Chunk | {percent}% traçables |

### Forces
- {Point positif}

### Problèmes Détectés
- [CRITICAL] {Noeuds orphelins si trouvés}
- [MAJOR] {Issues embeddings si trouvées}
- [MINOR] {Issues traçabilité si trouvées}

### Recommandations
1. {Action recommandée}

### Communes Problématiques
| Commune | Issue | Sévérité |
|---------|-------|----------|
| {nom} | {description} | {level} |
```

## Relation avec Constitution

Cet agent valide le **Principe III - No Orphan Nodes**:
> Les noeuds qui s'affichent doivent toujours avoir des relations. Les noeuds orphelins ne sont pas admis dans l'interface.

Et contribue au **Principe VII - Functional Civic Interface**:
> Assurer l'intégrité des données alimentant l'interface.

---

**Agent Status**: ACTIVE
**Last Updated**: 2024-12-24
