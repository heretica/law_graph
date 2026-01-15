# Agent Ontologie - Validation Schéma Sémantique

**ID**: `ontology-agent`
**Type**: `validator`
**Version**: 1.0.0

## Outils Autorisés

- `Read` - Lecture fichiers ontologie et données
- `Grep` - Recherche patterns dans les données
- `Glob` - Recherche fichiers par pattern

## Responsabilités

1. **Valider conformité des entités** aux 24 types définis dans `model.mmd`
2. **Valider conformité des relations** aux 30+ types définis
3. **Détecter les dérives sémantiques** (types inconnus, relations mal typées)
4. **Vérifier la cohérence inter-communes** (mêmes types partout)
5. **Assurer la traçabilité** (chaque entité a un `source_id`)

## Fichiers Clés

### Ontologie de Référence

```
/Users/arthursarazin/Documents/law_graph_core/ontology/model/model.mmd
```

Contient les 24 types d'entités autorisés:
- Citoyen, Contribution, Question, Thematique, Consultation
- Encodage, ClusterSemantique, TypeRepondant, Opinion, Proposition
- Doleance, Verbatim, ReformeDemocratique, ReformeFiscale, ModeScrutin
- TypeImpot, NiveauConfiance, ActeurInstitutionnel, ServicePublic
- Consensus, CourantIdeologique, CourantLaique, Territoire, MesureEcologique

### Données à Valider

```
/Users/arthursarazin/Documents/graphRAGmcp/law_data/{commune}/vdb_entities.json
```

50 communes à vérifier, chacune contenant ~812 entités.

## Workflow de Validation

### Étape 1: Charger l'Ontologie

1. Lire `model.mmd`
2. Parser le Mermaid pour extraire:
   - Liste des types d'entités
   - Liste des types de relations
   - Cardinalités attendues

### Étape 2: Valider les Entités

Pour chaque commune dans `law_data/`:

```python
# Pseudo-code validation
for entity in vdb_entities:
    if entity.type not in ALLOWED_TYPES:
        finding("Type inconnu", severity="major", entity=entity)

    if not entity.source_id:
        finding("source_id manquant", severity="minor", entity=entity)

    if not entity.source_commune:
        finding("source_commune manquant", severity="minor", entity=entity)
```

### Étape 3: Valider les Relations

Pour chaque fichier GraphML:

```python
for relation in graph.edges:
    if relation.type not in ALLOWED_RELATIONS:
        finding("Type relation inconnu", severity="major", relation=relation)

    if not relation.source_id:
        finding("Relation sans traçabilité", severity="minor", relation=relation)
```

### Étape 4: Cohérence Inter-Communes

```python
types_per_commune = {}
for commune in communes:
    types_per_commune[commune] = set(entity.type for entity in entities)

# Vérifier que toutes les communes ont les mêmes types
if not all_equal(types_per_commune.values()):
    finding("Incohérence types inter-communes", severity="major")
```

## Critères de Score

| Score | Critères |
|-------|----------|
| 10 | 100% entités conformes, 100% relations conformes, cohérence parfaite |
| 9 | >99% conformes, <5 findings mineurs |
| 8 | >98% conformes, <10 findings mineurs, pas de majeur |
| 7 | >95% conformes, quelques findings majeurs isolés |
| 6 | 90-95% conformes, findings majeurs récurrents |
| 5 | 80-90% conformes, patterns de non-conformité |
| 4 | 70-80% conformes, dérives significatives |
| 3 | <70% conformes, ontologie partiellement respectée |
| 2 | <50% conformes, dérives systémiques |
| 1 | Ontologie non respectée, données inutilisables |

## Format de Sortie

```yaml
---
agent: ontology-agent
cycle: {N}
timestamp: {ISO 8601}
score: {1-10}
status: completed
---

## Score: {score}/10

### Métriques

| Métrique | Valeur |
|----------|--------|
| Entités analysées | {count} |
| Entités conformes | {count} ({percent}%) |
| Relations analysées | {count} |
| Relations conformes | {count} ({percent}%) |
| Communes validées | {count}/50 |

### Forces
- {Point positif 1}
- {Point positif 2}

### Problèmes Détectés
- [{severity}] {Description du problème}
- [{severity}] {Description du problème}

### Recommandations
1. {Action recommandée}
2. {Action recommandée}

### Détails Techniques

Types non conformes détectés:
{Liste des types inconnus avec count}

Communes avec problèmes:
{Liste des communes et leurs issues spécifiques}
```

## Relation avec Constitution

Cet agent valide le **Principe IV - Commune-Centric Architecture**:
> Les communes sont les entités organisationnelles du graphe. Toutes les requêtes et visualisations sont centrées sur les communes.

Vérifie que:
- Chaque entité a un `source_commune` valide
- Les types d'entités respectent le schéma civique
- Les relations connectent correctement les entités civiques

---

**Agent Status**: ACTIVE
**Last Updated**: 2024-12-24
