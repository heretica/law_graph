# Implementation Plan: Agent Orchestration Grand Débat National

**Branch**: `005-agent-orchestration` | **Date**: 2024-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-agent-orchestration/spec.md`

## Summary

Cette feature implémente une orchestration de 7 agents Claude Code spécialisés pour optimiser continuellement le graphe du Grand Débat National. Les agents valident la cohérence entre les 5 couches architecturales (Data, Ontologie, GraphRAG, MCP, Interface) et produisent des scores 1-10 guidant les améliorations. Le rebranding complet vers l'identité visuelle Datack est inclus.

**Approche technique** : Agents Claude Code en fichiers Markdown (`.claude/agents/`), communication par fichiers de scores, déclenchement automatique post `speckit.implement`, nouveau skill `speckit.orchestrate`.

## Technical Context

**Language/Version**: TypeScript 5.2.2 (Interface), Python 3.11 (Agents si scripts), Markdown (Agents Claude Code)
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS 3.3.5, 3d-force-graph 1.79.0, Inter (Google Fonts)
**Storage**: Fichiers Markdown pour scores/findings, GraphML pour données graphe
**Testing**: Validation manuelle, vérification visuelle, tests de contraste WCAG
**Target Platform**: Web (Desktop + Mobile responsive), Claude Code CLI
**Project Type**: Web application avec agents CLI intégrés
**Performance Goals**: Cycle orchestration < 5 min, FCP mobile < 3s, score moyen ≥ 8/10
**Constraints**: Branding Datack (jaune #F5C518, noir #1A1A1A, Inter), 44px touch targets, WCAG AA
**Scale/Scope**: 7 agents, 50 communes, ~8,000 entités, 12 composants UI à rebrander

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Feature Impact |
|-----------|--------|----------------|
| **I. End-to-End Interpretability** | PASS | Agent MCP valide la chaîne de provenance complète |
| **II. Civic Provenance Chain** | PASS | Agent Interface vérifie attribution commune dans UI |
| **III. No Orphan Nodes** | PASS | Agent Data valide degree > 0 pour tous noeuds |
| **IV. Commune-Centric Architecture** | PASS | Scoring par commune, agrégation cross-commune |
| **V. Cross-Commune Civic Analysis** | PASS | Agent MCP vérifie `grand_debat_query_all` |
| **VI. Single-Source Civic Data** | PASS | Pas de multi-source, MCP unique |
| **VII. Functional Civic Interface** | PASS | Rebranding Datack respecte 4-5 couleurs, 2 fonts |
| **VIII. Mobile-First Responsiveness** | PASS | Chef UX/UI valide 44px touch, 16px min text |
| **IX. RAG Observability** | PASS | Agent MCP vérifie provenance dans réponses |

**GATE STATUS**: PASS - Aucune violation détectée.

## Project Structure

### Documentation (this feature)

```text
specs/005-agent-orchestration/
├── spec.md              # Spécification feature
├── plan.md              # Ce fichier
├── research.md          # Recherche Phase 0
├── data-model.md        # Modèle de données agents
├── quickstart.md        # Guide démarrage rapide
├── contracts/           # Contrats API
│   ├── score-format.md  # Format scores agents
│   └── findings-format.md # Format findings
├── checklists/
│   └── requirements.md  # Checklist qualité spec
├── scores/              # Scores des cycles (runtime)
│   └── cycle-001/       # Premier cycle
└── tasks.md             # Tâches (généré par speckit.tasks)
```

### Source Code (repository root)

```text
# Agents Claude Code
.claude/
├── agents/
│   ├── design-chief.md      # Orchestrateur principal
│   ├── ontology-agent.md    # Validation ontologie
│   ├── data-agent.md        # Validation VectorStore/GraphStore
│   ├── mcp-agent.md         # Validation interprétabilité MCP
│   ├── interface-agent.md   # Validation binding UI/données
│   ├── uxui-chief.md        # Tests UX, mobile, branding
│   └── product-chief.md     # Business model, commercialisation
└── skills/
    └── orchestrate/
        └── SKILL.md         # Skill speckit.orchestrate

# Interface (rebranding Datack)
3_borges-interface/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Font Inter
│   │   ├── globals.css      # Variables Datack
│   │   ├── page.tsx         # Header Datack
│   │   └── about/
│   │       └── page.tsx     # NOUVEAU - Page À propos
│   ├── components/
│   │   ├── DatackLibrary.tsx    # Renommé de BorgesLibrary
│   │   ├── Navigation.tsx       # NOUVEAU - Nav Datack
│   │   ├── Footer.tsx           # NOUVEAU - Footer Datack
│   │   ├── QueryInterface.tsx   # Màj couleurs Datack
│   │   ├── ProvenancePanel.tsx  # Màj couleurs Datack
│   │   └── GraphVisualization3DForce.tsx # Màj couleurs noeuds
│   └── lib/
│       └── utils/
│           └── datack-colors.ts # Constantes couleurs
├── public/
│   ├── logo-datack.png      # Logo Datack jaune
│   └── favicon.ico          # Favicon Datack
└── tailwind.config.js       # Palette Datack
```

**Structure Decision**: Architecture hybride - agents Claude Code en Markdown pour l'orchestration, interface Next.js existante pour le rebranding. Séparation claire entre logique d'orchestration (`.claude/`) et interface utilisateur (`3_borges-interface/`).

## Complexity Tracking

> **Aucune violation de Constitution détectée - section vide.**

## Implementation Phases

### Phase 1: Infrastructure Agents (Jour 1)

1. Créer structure `.claude/agents/`
2. Définir format agent (frontmatter YAML + instructions)
3. Créer templates score-format.md et findings-format.md
4. Implémenter Chef Designer (orchestrateur)

### Phase 2: Agents Core (Jour 2)

1. Implémenter Agent Ontologie (validation 24 types)
2. Implémenter Agent Data (VectorStore + GraphStore)
3. Implémenter Agent MCP (interprétabilité)
4. Implémenter Agent Interface (binding UI)

### Phase 3: Agents Leadership (Jour 3)

1. Implémenter Chef UX/UI (tests, mobile, branding)
2. Implémenter Chef Produit (business model)
3. Créer skill `speckit.orchestrate`

### Phase 4: Rebranding Datack (Jour 4-5)

1. Télécharger logo Datack
2. Mettre à jour tailwind.config.js (palette Datack)
3. Remplacer fonts (Inter)
4. Renommer BorgesLibrary → DatackLibrary
5. Màj couleurs tous composants
6. Créer Navigation, Footer, Page À propos

### Phase 5: Intégration & Test (Jour 6)

1. Configurer hook post-implement
2. Tester cycle orchestration complet
3. Valider scores et roadmap générée

### Phase 6: Livrables Produit (Jour 7)

1. Rédiger contenu page À propos
2. Documenter business model
3. Préparer offre consulting
4. Définir grille tarifaire

## Risk Mitigation

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| MCP inaccessible | Faible | Haut | Timeout + score 0, cycle continue |
| Données corrompues | Faible | Moyen | Exclusion commune, tâche correction |
| Conflits agents | Moyen | Faible | Chef Designer réconcilie |
| Rebranding incomplet | Faible | Moyen | Checklist visuelle composant par composant |

## Dependencies

- Constitution v3.0.0 (validée)
- Feature 004-ui-consistency (complète)
- MCP Server Railway (accessible)
- Ontologie model.mmd (stable)
- Speckit skills existants (fonctionnels)
