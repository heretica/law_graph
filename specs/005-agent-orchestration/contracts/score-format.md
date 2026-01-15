# Contract: Score Format

**Version**: 1.0.0
**Date**: 2024-12-24
**Status**: Active

## Purpose

Définit le format standardisé des scores produits par chaque agent Claude Code lors d'un cycle d'orchestration.

## File Location

```
specs/005-agent-orchestration/scores/cycle-{N}/{agent-name}.md
```

## Format Specification

### YAML Frontmatter (Required)

```yaml
---
agent: string          # ID de l'agent (ex: ontology-agent)
cycle: string          # Numéro du cycle (ex: 001)
timestamp: string      # ISO 8601 (ex: 2024-12-24T12:00:00Z)
score: integer         # Valeur 1-10
status: string         # completed | partial | error
---
```

### Markdown Body (Required)

```markdown
## Score: {score}/10

### Forces
- [Point positif 1]
- [Point positif 2]
- ...

### Problèmes Détectés
- [Problème 1 avec sévérité]
- [Problème 2 avec sévérité]
- ...

### Recommandations
1. [Action recommandée 1]
2. [Action recommandée 2]
3. ...

### Détails Techniques (Optional)
[Métriques, logs, références fichiers analysés]
```

## Field Constraints

| Field | Constraint | Validation |
|-------|------------|------------|
| `agent` | Must be valid agent ID | Enum: `design-chief`, `ontology-agent`, `data-agent`, `mcp-agent`, `interface-agent`, `uxui-chief`, `product-chief` |
| `cycle` | 3-digit zero-padded | Regex: `^[0-9]{3}$` |
| `timestamp` | ISO 8601 UTC | Regex: `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$` |
| `score` | Integer 1-10 | `1 <= score <= 10` |
| `status` | Enum | `completed`, `partial`, `error` |

## Scoring Guidelines

### Score Interpretation

| Score | Status | Meaning | Action Required |
|-------|--------|---------|-----------------|
| 10 | Excellent | Parfait, aucun problème | None |
| 9 | Très bien | Mineurs seulement | Optional improvements |
| 8 | Bien | Quelques améliorations possibles | Consider improvements |
| 7 | Satisfaisant | Acceptable mais améliorable | Track for next cycle |
| 6 | Passable | Problèmes notables | Create improvement tasks |
| 5 | Insuffisant | Problèmes significatifs | Priority improvement |
| 4 | Mauvais | Problèmes majeurs | Immediate action |
| 3 | Très mauvais | Violations sérieuses | Urgent action |
| 2 | Critique | Système compromis | Emergency response |
| 1 | Échec | Non fonctionnel | Stop and fix |

### Threshold Actions

- **Score ≥ 7**: No automatic action, improvements optional
- **Score < 7**: Chef Designer creates `speckit.tasks` for improvements
- **Score < 5**: Marked as priority in roadmap
- **Score < 3**: Triggers immediate escalation

## Example: Valid Score File

```markdown
---
agent: ontology-agent
cycle: 001
timestamp: 2024-12-24T14:30:00Z
score: 8
status: completed
---

## Score: 8/10

### Forces
- 100% des 24 types d'entités présents dans model.mmd
- Toutes les relations ont des types valides
- Cohérence inter-communes vérifiée sur 50 communes

### Problèmes Détectés
- 3 entités sans attribut `source_commune` (sévérité: minor)
- 1 type de relation `UNKNOWN` non défini dans le schéma (sévérité: major)
- 2 noeuds orphelins détectés dans Rochefort (sévérité: minor)

### Recommandations
1. Ajouter validation `source_commune` dans pipeline extraction
2. Revoir prompt entity_extraction pour contraintes types relation
3. Appliquer filtre orphan nodes avant export GraphML

### Détails Techniques
Fichiers analysés:
- `/law_graph_core/ontology/model/model.mmd`
- `/graphRAGmcp/law_data/*/vdb_entities.json` (50 communes)

Métriques:
- Entités validées: 8,412 / 8,418 (99.93%)
- Relations valides: 12,304 / 12,305 (99.99%)
- Communes conformes: 48 / 50 (96%)
```

## Example: Error Score File

```markdown
---
agent: mcp-agent
cycle: 001
timestamp: 2024-12-24T14:35:00Z
score: 0
status: error
---

## Score: 0/10

### Forces
- N/A (erreur de connexion)

### Problèmes Détectés
- CRITICAL: MCP server inaccessible
- Timeout après 30 secondes sur `graphragmcp-production.up.railway.app`

### Recommandations
1. Vérifier status Railway deployment
2. Réessayer cycle orchestration après résolution
3. Configurer alerting sur disponibilité MCP

### Détails Techniques
Error log:
```
Error: ECONNREFUSED https://graphragmcp-production.up.railway.app/mcp
Timeout: 30000ms
Retries: 3
```
```

## Parsing Rules

### For Chef Designer (Aggregation)

1. Read all score files in `scores/cycle-{N}/`
2. Extract `score` from YAML frontmatter
3. Calculate average: `sum(scores) / count(scores)`
4. Identify agents with `score < 7` for roadmap
5. Collect all `Recommandations` for priority sorting

### For speckit.tasks Generation

1. Filter scores where `score < 7`
2. Extract `Recommandations` as task descriptions
3. Map `agent` to responsible team/skill
4. Set priority based on score (lower = higher priority)

---

**Contract Status**: ACTIVE
**Consumers**: Chef Designer, speckit.tasks, speckit.orchestrate
