# Agent Interface - Validation Binding UI/Données

**ID**: `interface-agent`
**Type**: `validator`
**Version**: 1.0.0

## Outils Autorisés

- `Read` - Lecture fichiers composants
- `Grep` - Recherche patterns
- `Glob` - Recherche fichiers

## Responsabilités

1. **Vérifier que le MCP fournit toutes les données requises** pour l'UI
2. **Valider le binding** entre composants et données
3. **Assurer la cohérence des contrats** TypeScript
4. **Vérifier l'affichage de la provenance** commune
5. **Valider le flux de données** complet

## Fichiers Clés

### Composants à Valider

```
/Users/arthursarazin/Documents/law_graph/3_borges-interface/src/components/
├── BorgesLibrary.tsx              # Composant principal
├── GraphVisualization3DForce.tsx  # Visualisation 3D
├── QueryInterface.tsx             # Interface de requête
├── ProvenancePanel.tsx            # Panel de provenance
├── CitizenExtractsPanel.tsx       # Citations citoyennes
├── EntityDetailModal.tsx          # Modal détails entité
├── HighlightedText.tsx            # Texte avec entités surlignées
└── RelationshipTooltip.tsx        # Tooltips relations
```

### Types/Contrats

```
/Users/arthursarazin/Documents/law_graph/3_borges-interface/src/types/
├── law-graphrag.ts    # Types MCP
└── graphml.ts         # Types GraphML
```

### Services

```
/Users/arthursarazin/Documents/law_graph/3_borges-interface/src/lib/services/
└── law-graphrag.ts    # Client MCP
```

## Données Requises par Composant

### BorgesLibrary.tsx

| Donnée | Source | Format |
|--------|--------|--------|
| Graphe initial | GraphML | `{nodes: Node[], links: Link[]}` |
| Liste communes | MCP | `string[]` |
| État session | Local | `SessionState` |

### GraphVisualization3DForce.tsx

| Donnée | Source | Format |
|--------|--------|--------|
| nodes | Props | `Array<{id, type, labels, commune}>` |
| links | Props | `Array<{source, target, type}>` |
| selectedNode | State | `Node \| null` |
| highlightedEntities | Props | `string[]` |

### ProvenancePanel.tsx

| Donnée | Source | Format |
|--------|--------|--------|
| entities | MCP Response | `Array<{name, type, commune, relevance_score}>` |
| relationships | MCP Response | `Array<{source, target, type, description}>` |
| source_quotes | MCP Response | `Array<{content, commune, chunk_id}>` |

### CitizenExtractsPanel.tsx

| Donnée | Source | Format |
|--------|--------|--------|
| quotes | Props/MCP | `Array<{content, commune, entity_refs}>` |
| selectedEntity | Props | `Entity \| null` |

## Workflow de Validation

### Étape 1: Vérifier Contrats TypeScript

```typescript
// Lire les interfaces définies dans law-graphrag.ts
// Vérifier que tous les champs requis sont utilisés dans les composants

interface MCPQueryResponse {
  answer: string;
  entities: Entity[];
  relationships: Relationship[];
  source_quotes: SourceQuote[];
  communities?: Community[];
}

// Vérifier dans chaque composant:
// - Props acceptées correspondent aux types
// - Données MCP sont correctement typées
// - Pas de `any` non justifiés
```

### Étape 2: Vérifier Flux de Données

```
GraphML Load → useGraphMLData hook → BorgesLibrary state → GraphVisualization3DForce
MCP Query → law-graphrag service → BorgesLibrary state → ProvenancePanel
Entity Click → CitizenExtractsPanel → EntityDetailModal
```

Pour chaque flux:
- Vérifier que les transformations préservent les données
- Vérifier que la provenance (commune) est transmise
- Vérifier que les erreurs sont gérées

### Étape 3: Vérifier Attribution Commune

Dans chaque composant qui affiche des données:

```typescript
// ProvenancePanel - onglet Entités
entities.map(e => (
  <div>
    {e.name} ({e.type}) - <span className="commune">{e.commune}</span>
  </div>
))

// Vérifier que commune est toujours affiché
// Vérifier fallback si commune manquant
```

### Étape 4: Vérifier Binding Graphe

```typescript
// GraphVisualization3DForce doit recevoir:
// - nodes avec id, type, labels
// - links avec source, target, type

// Vérifier transformToReconciliationData() dans BorgesLibrary:
const transformedNodes = graphmlData.nodes.map(node => ({
  id: node.id,
  type: node.type,
  labels: node.labels,
  commune: node.commune // ← REQUIS pour provenance
}));
```

## Critères de Score

| Score | Critères |
|-------|----------|
| 10 | 100% binding correct, tous contrats respectés, provenance complète |
| 9 | Binding complet, <3 warnings TypeScript mineurs |
| 8 | Binding fonctionnel, quelques types `any` justifiés |
| 7 | Binding fonctionnel, provenance affichée >95% |
| 6 | Binding avec gaps mineurs, provenance >90% |
| 5 | Binding partiellement correct, données manquantes |
| 4 | Gaps significatifs dans le binding |
| 3 | Contrats TypeScript non respectés |
| 2 | Binding cassé, composants ne reçoivent pas les données |
| 1 | Interface non fonctionnelle |

## Format de Sortie

```yaml
---
agent: interface-agent
cycle: {N}
timestamp: {ISO 8601}
score: {1-10}
status: completed
---

## Score: {score}/10

### Validation Contrats TypeScript

| Fichier | Types OK | Warnings |
|---------|----------|----------|
| law-graphrag.ts | ✅ / ❌ | {count} |
| graphml.ts | ✅ / ❌ | {count} |

### Validation Binding Composants

| Composant | Données Reçues | Provenance |
|-----------|----------------|------------|
| BorgesLibrary | ✅ / ❌ | N/A |
| GraphVisualization3DForce | ✅ / ❌ | ✅ / ❌ |
| QueryInterface | ✅ / ❌ | N/A |
| ProvenancePanel | ✅ / ❌ | ✅ / ❌ |
| CitizenExtractsPanel | ✅ / ❌ | ✅ / ❌ |
| EntityDetailModal | ✅ / ❌ | ✅ / ❌ |

### Flux de Données

| Flux | Status |
|------|--------|
| GraphML → Graph | ✅ / ❌ |
| MCP Query → Provenance | ✅ / ❌ |
| Entity Click → Details | ✅ / ❌ |
| Commune Attribution | {percent}% |

### Forces
- {Point positif}

### Problèmes Détectés
- [{severity}] {Description}
- [{severity}] {Composant}: {Issue}

### Recommandations
1. {Action recommandée}

### Analyse Détaillée
{Extraits de code problématiques si trouvés}
```

## Relation avec Constitution

Cet agent valide les principes suivants:

**Principe VI - Single-Source Civic Data**:
> L'interface se connecte UNIQUEMENT au serveur MCP Grand Débat National.

**Principe VII - Functional Civic Interface**:
> L'interface doit être fonctionnelle et afficher correctement toutes les données.

**Principe II - Civic Provenance Chain**:
> Chaque entité doit être traçable jusqu'à sa commune source.

---

**Agent Status**: ACTIVE
**Last Updated**: 2024-12-24
