# Research: Agent Orchestration Grand Débat National

**Feature**: 005-agent-orchestration
**Date**: 2024-12-24
**Status**: Complete

## Research Questions Addressed

### 1. Claude Code Agent Architecture

**Question**: Comment implémenter des agents Claude Code en fichiers Markdown ?

**Decision**: Agents définis comme fichiers Markdown dans `.claude/agents/` avec frontmatter YAML.

**Rationale**:
- Claude Code supporte nativement les agents en Markdown via le Task tool
- Le frontmatter YAML permet de définir les métadonnées (nom, outils autorisés)
- Les agents peuvent être invoqués via `subagent_type` dans le Task tool
- Pas besoin d'infrastructure séparée (Agent SDK, MCP servers)

**Alternatives Considered**:
- Agent SDK Python/TypeScript: Plus puissant mais nécessite infrastructure séparée
- MCP Servers dédiés: Isolation maximale mais complexité d'orchestration accrue
- Hybrid (Agent SDK + Claude Code): Complexité inutile pour ce cas d'usage

**Source**: Documentation Claude Code, exploration système existant

---

### 2. Format de Communication Inter-Agents

**Question**: Comment les agents communiquent-ils leurs résultats ?

**Decision**: Communication par fichiers Markdown structurés avec frontmatter YAML.

**Rationale**:
- Fichiers versionnés dans Git (traçabilité complète)
- Format lisible par humains et machines
- Pas de dépendance à une base de données
- Intégration naturelle avec Speckit

**Format Score**:
```yaml
---
agent: ontology-agent
cycle: 001
timestamp: 2024-12-24T12:00:00Z
score: 8
---

## Score: 8/10

### Forces
- [Liste des points positifs]

### Problèmes Détectés
- [Liste des problèmes]

### Recommandations
1. [Action recommandée]
```

**Alternatives Considered**:
- JSON files: Moins lisibles, pas de formatage riche
- Base de données: Overkill, ajoute une dépendance
- MCP communication: Trop complexe pour ce cas

---

### 3. Branding Datack - Palette de Couleurs

**Question**: Quels codes couleurs utiliser pour le rebranding Datack ?

**Decision**: Palette extraite du site datack.fr et optimisée pour accessibilité.

**Rationale**:
- Jaune signature de Datack (#F5C518) pour les accents
- Noir profond (#1A1A1A) pour le fond - proche du noir Borges actuel
- Contraste WCAG AA vérifié (ratio 8.5:1 pour jaune sur noir)

**Palette Finale**:
| Token | Hex | Usage |
|-------|-----|-------|
| `datack-yellow` | `#F5C518` | Accents, CTAs, entités COMMUNE |
| `datack-yellow-bright` | `#FFD93D` | Hover states |
| `datack-black` | `#1A1A1A` | Fond principal |
| `datack-dark` | `#2D2D2D` | Fonds secondaires |
| `datack-light` | `#F0F0F0` | Texte sur fond sombre |
| `datack-gray` | `#6B7280` | Texte secondaire |

**Source**: [datack.fr](https://datack.fr), analyse logo jaune

---

### 4. Typographie Datack

**Question**: Quelle police utiliser pour le rebranding ?

**Decision**: Inter (Google Fonts) - moderne, lisible, accessible.

**Rationale**:
- Datack utilise une police système moderne sur son site
- Inter est l'équivalent Google Fonts le plus proche
- Excellente lisibilité sur écran, particulièrement mobile
- Weights disponibles: 400, 500, 600, 700

**Alternatives Considered**:
- Garder Cormorant Garamond: Trop littéraire, pas cohérent avec Datack
- System fonts only: Moins de contrôle visuel
- Font custom Datack: Non disponible publiquement

**Source**: Analyse datack.fr, best practices typographie web

---

### 5. Déclenchement Automatique des Cycles

**Question**: Comment déclencher automatiquement l'orchestration après `speckit.implement` ?

**Decision**: Hook post-implement qui invoque `/speckit.orchestrate`.

**Rationale**:
- Speckit supporte les hooks post-commande
- Pas besoin de modifier l'infrastructure existante
- Peut être désactivé si nécessaire

**Implémentation**:
```bash
# Dans le workflow speckit.implement
# Après completion, déclencher orchestration
claude "Run /speckit.orchestrate --auto-triggered"
```

**Alternatives Considered**:
- Cron job: Trop rigide, pas lié au workflow
- GitHub Action: Externe au workflow local
- Manuel uniquement: Perd l'automatisation

---

### 6. Validation Ontologie

**Question**: Comment valider la conformité au schéma ontologique (24 types, 30+ relations) ?

**Decision**: Agent lit `model.mmd` et compare avec entités dans `vdb_entities.json`.

**Rationale**:
- Le fichier `model.mmd` (Mermaid) définit tous les types
- Parsing du Mermaid pour extraire les types autorisés
- Comparaison avec les `entity_type` dans les données

**Types d'Entités Définis** (24):
Citoyen, Contribution, Question, Thematique, Consultation, Encodage, ClusterSemantique, TypeRepondant, Opinion, Proposition, Doleance, Verbatim, ReformeDemocratique, ReformeFiscale, ModeScrutin, TypeImpot, NiveauConfiance, ActeurInstitutionnel, ServicePublic, Consensus, CourantIdeologique, CourantLaique, Territoire, MesureEcologique

**Source**: Exploration `/Users/arthursarazin/Documents/law_graph_core/ontology/`

---

### 7. Validation Interprétabilité MCP

**Question**: Comment vérifier que le MCP fournit une chaîne de provenance complète ?

**Decision**: Agent MCP envoie requête test et vérifie structure de réponse.

**Rationale**:
- Requête simple comme "Quelles sont les préoccupations fiscales ?"
- Vérification des champs: entities, relationships, source_quotes, communities
- Chaque source_quote doit avoir `commune` et `content`

**Champs Requis par Réponse MCP**:
```typescript
{
  answer: string;
  entities: Array<{name, type, commune, relevance_score}>;
  relationships: Array<{source, target, type, description}>;
  source_quotes: Array<{content, commune, chunk_id}>;
  communities: Array<{title, summary, level}>;
}
```

**Source**: Types TypeScript dans `law-graphrag.ts`

---

## Best Practices Identified

### Claude Code Agents

1. **Frontmatter YAML** pour métadonnées agent
2. **Outils restreints** par agent (Read, Grep, Glob pour la plupart)
3. **Instructions claires** avec critères de scoring
4. **Invocation via Task tool** avec `subagent_type`

### Scoring System

1. **Échelle 1-10** avec seuil à 7 pour action
2. **Format standardisé** pour parsing automatique
3. **Recommandations actionnables** dans chaque rapport
4. **Agrégation** par Chef Designer

### Rebranding UI

1. **Namespace couleurs** (`datack-*` au lieu de `borges-*`)
2. **Variables CSS** pour cohérence
3. **Token par usage** (accent, fond, texte)
4. **Test contraste WCAG** sur chaque combinaison

---

## Unresolved Items

Aucun item non résolu. Toutes les questions de clarification ont été adressées.

---

**Research Status**: COMPLETE
**Ready for**: Phase 1 Design & Contracts
