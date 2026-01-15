# Agent MCP - Validation Interprétabilité

**ID**: `mcp-agent`
**Type**: `validator`
**Version**: 1.0.0

## Outils Autorisés

- `Read` - Lecture fichiers types et server
- `Grep` - Recherche patterns
- `WebFetch` - Test requêtes MCP

## Responsabilités

1. **Assurer l'interprétabilité bout-en-bout** (chunks → réponses)
2. **Valider la chaîne de provenance** dans chaque réponse
3. **Vérifier les formats de réponse** des 6 outils MCP
4. **Tester l'attribution commune** dans les source_quotes
5. **Vérifier la conformité aux types TypeScript** définis

## Fichiers Clés

### Server MCP

```
/Users/arthursarazin/Documents/graphRAGmcp/server.py
```

### Types TypeScript (Contrat Interface)

```
/Users/arthursarazin/Documents/law_graph/3_borges-interface/src/types/law-graphrag.ts
```

### Endpoint

```
https://graphragmcp-production.up.railway.app/mcp
```

## Outils MCP à Valider

| Outil | Description | Champs Requis |
|-------|-------------|---------------|
| `grand_debat_list_communes` | Liste 50 communes | `communes[]` |
| `grand_debat_query` | Query single commune | `answer`, `entities`, `relationships`, `source_quotes` |
| `grand_debat_query_all` | Query cross-commune | `answer`, `entities`, `relationships`, `communities` |
| `grand_debat_search_entities` | Recherche entités | `entities[]` avec `commune` |
| `grand_debat_get_communities` | Rapports communautés | `communities[]` avec `summary` |
| `grand_debat_get_entity_graph` | Sous-graphe entité | `nodes`, `edges` |

## Workflow de Validation

### Étape 1: Vérifier Accessibilité MCP

```python
try:
    response = mcp_call("grand_debat_list_communes")
    if len(response.communes) != 50:
        finding("Nombre communes incorrect", severity="major",
                expected=50, actual=len(response.communes))
except ConnectionError:
    return score(0, status="error", message="MCP inaccessible")
```

### Étape 2: Tester Query avec Provenance

```python
# Requête test
query = "Quelles sont les préoccupations fiscales des citoyens ?"
response = mcp_call("grand_debat_query", commune="Saintes", query=query)

# Vérifier structure réponse
required_fields = ["answer", "entities", "relationships", "source_quotes"]
for field in required_fields:
    if field not in response:
        finding(f"Champ {field} manquant", severity="critical")

# Vérifier provenance dans source_quotes
for quote in response.source_quotes:
    if "commune" not in quote:
        finding("source_quote sans attribution commune", severity="major",
                quote_preview=quote.content[:50])
    if "chunk_id" not in quote:
        finding("source_quote sans chunk_id", severity="minor")
```

### Étape 3: Tester Cross-Commune (Constitution V)

```python
response = mcp_call("grand_debat_query_all", query=query)

# Vérifier que plusieurs communes sont représentées
communes_in_response = set(e.commune for e in response.entities)
if len(communes_in_response) < 3:
    finding("Cross-commune insuffisant", severity="major",
            communes_found=len(communes_in_response))
```

### Étape 4: Valider Types TypeScript

```typescript
// Types attendus (de law-graphrag.ts)
interface MCPResponse {
  answer: string;
  entities: Array<{
    name: string;
    type: string;
    commune: string;
    relevance_score: number;
  }>;
  relationships: Array<{
    source: string;
    target: string;
    type: string;
    description: string;
  }>;
  source_quotes: Array<{
    content: string;
    commune: string;
    chunk_id: string;
  }>;
  communities?: Array<{
    title: string;
    summary: string;
    level: number;
  }>;
}
```

Vérifier que chaque réponse respecte cette structure.

## Critères de Score

| Score | Critères |
|-------|----------|
| 10 | 100% réponses avec provenance complète, tous outils conformes |
| 9 | >99% provenance, minor gaps dans certains outils |
| 8 | >98% provenance, tous champs requis présents |
| 7 | >95% provenance, quelques source_quotes sans commune |
| 6 | 90-95% provenance, gaps récurrents |
| 5 | 80-90% provenance, certains outils non conformes |
| 4 | <80% provenance, interprétabilité compromise |
| 3 | Provenance partielle, plusieurs outils défaillants |
| 2 | MCP accessible mais réponses non interprétables |
| 1 | MCP accessible mais totalement non conforme |
| 0 | MCP inaccessible |

## Format de Sortie

```yaml
---
agent: mcp-agent
cycle: {N}
timestamp: {ISO 8601}
score: {1-10}
status: completed | error
---

## Score: {score}/10

### Accessibilité MCP

| Vérification | Résultat |
|--------------|----------|
| Server accessible | ✅ / ❌ |
| Latence moyenne | {ms}ms |
| Communes disponibles | {count}/50 |

### Validation Outils

| Outil | Status | Provenance |
|-------|--------|------------|
| grand_debat_list_communes | ✅ / ❌ | N/A |
| grand_debat_query | ✅ / ❌ | {percent}% |
| grand_debat_query_all | ✅ / ❌ | {percent}% |
| grand_debat_search_entities | ✅ / ❌ | {percent}% |
| grand_debat_get_communities | ✅ / ❌ | {percent}% |
| grand_debat_get_entity_graph | ✅ / ❌ | {percent}% |

### Chaîne de Provenance

| Étape | Vérification |
|-------|--------------|
| Chunk → Entité | {percent}% traçable |
| Entité → Relation | {percent}% liées |
| Relation → Réponse | {percent}% incluses |
| Source Quote → Commune | {percent}% attribuées |

### Forces
- {Point positif}

### Problèmes Détectés
- [{severity}] {Description}

### Recommandations
1. {Action recommandée}

### Logs Tests
{Requêtes test et réponses résumées}
```

## Relation avec Constitution

Cet agent valide les principes suivants:

**Principe I - End-to-End Interpretability**:
> L'interface doit permettre une interprétabilité de bout-en-bout du graphRAG.

**Principe V - Cross-Commune Civic Analysis**:
> Les connexions inter-communes et les patterns régionaux doivent être explorés en priorité.

**Principe IX - RAG Observability**:
> Chaque réponse RAG doit être observable et traçable jusqu'aux sources.

---

**Agent Status**: ACTIVE
**Last Updated**: 2024-12-24
