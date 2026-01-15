# Feature Specification: Agent Orchestration Grand Débat National

**Feature Branch**: `005-agent-orchestration`
**Created**: 2024-12-24
**Status**: Draft
**Input**: Orchestration d'agents pour optimiser le graphe du Grand Débat National. 7 agents spécialisés (Chef Designer, Agent Ontologie, Agent Data, Agent MCP, Agent Interface, Chef UX/UI, Chef Produit) collaborent pour assurer la cohérence architecturale entre les 5 couches du système. Inclut rebranding complet Datack.

## Executive Summary

Cette feature met en place une orchestration de 7 agents Claude Code pour optimiser continuellement le graphe du Grand Débat National. Les agents collaborent pour valider la cohérence entre les 5 couches architecturales (Data, Ontologie, GraphRAG, MCP, Interface) et produisent des scores 1-10 guidant les améliorations. Le rebranding complet vers l'identité visuelle Datack est inclus.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cycle d'Orchestration Automatique (Priority: P1)

Le Chef Designer coordonne automatiquement un cycle de validation après chaque feature complétée, collectant les scores de tous les agents et générant une roadmap d'amélioration.

**Why this priority**: Le cycle d'orchestration est le coeur du système - sans lui, les autres agents ne peuvent pas être coordonnés efficacement.

**Independent Test**: Après l'exécution de `speckit.implement`, le système déclenche automatiquement un cycle complet et produit un rapport de scores dans `specs/005-agent-orchestration/scores/`.

**Acceptance Scenarios**:

1. **Given** une feature vient d'être implémentée via `speckit.implement`, **When** le hook post-implement se déclenche, **Then** le Chef Designer lance un cycle d'orchestration complet avec les 7 agents.

2. **Given** tous les agents ont terminé leur validation, **When** le Chef Designer agrège les résultats, **Then** un fichier de scores est créé avec le score moyen et les recommandations.

3. **Given** un agent retourne un score < 7, **When** le Chef Designer analyse les résultats, **Then** des tâches d'amélioration sont automatiquement créées via `speckit.tasks`.

---

### User Story 2 - Validation Ontologique (Priority: P1)

L'Agent Ontologie vérifie que toutes les entités et relations du graphe respectent le schéma ontologique défini (24 types d'entités, 30+ types de relations).

**Why this priority**: L'ontologie est le fondement sémantique du système - des dérives ici compromettent toute la chaîne de valeur.

**Independent Test**: L'agent peut être invoqué isolément pour valider une commune spécifique et retourner un rapport de conformité.

**Acceptance Scenarios**:

1. **Given** les fichiers `vdb_entities.json` d'une commune, **When** l'Agent Ontologie les analyse, **Then** il identifie le pourcentage d'entités conformes au schéma `model.mmd`.

2. **Given** une entité avec un type non défini dans l'ontologie, **When** l'Agent Ontologie la détecte, **Then** elle est signalée comme "type inconnu" dans les findings.

3. **Given** une relation sans `source_id` traçable, **When** l'Agent Ontologie la valide, **Then** elle est signalée comme violation de traçabilité.

---

### User Story 3 - Validation Interprétabilité MCP (Priority: P1)

L'Agent MCP s'assure que le serveur MCP fournit une chaîne de provenance complète de bout en bout (chunks → entités → relations → réponse).

**Why this priority**: L'interprétabilité est un principe constitutionnel (Principe I) - sans elle, le système perd sa valeur de transparence citoyenne.

**Independent Test**: L'agent envoie une requête test au MCP et vérifie que la réponse contient tous les éléments de provenance.

**Acceptance Scenarios**:

1. **Given** une requête GraphRAG au serveur MCP, **When** l'Agent MCP analyse la réponse, **Then** il vérifie la présence de `entities`, `relationships`, `source_quotes`, et `communities`.

2. **Given** un `source_quote` retourné par le MCP, **When** l'Agent MCP vérifie son attribution, **Then** le champ `commune` doit être présent et valide.

3. **Given** les 6 outils MCP exposés, **When** l'Agent MCP les invoque, **Then** chacun retourne des données de provenance conformes aux types TypeScript définis.

---

### User Story 4 - Rebranding Interface Datack (Priority: P2)

Le Chef UX/UI supervise la refonte complète de l'identité visuelle de Borges vers Datack, incluant palette de couleurs, typographie, et nouveaux composants.

**Why this priority**: Le rebranding est essentiel pour la commercialisation mais peut être implémenté après l'infrastructure d'orchestration.

**Independent Test**: L'interface affiche les couleurs Datack (jaune #F5C518, noir #1A1A1A), la police Inter, et le logo Datack.

**Acceptance Scenarios**:

1. **Given** la configuration Tailwind actuelle (Borges), **When** le Chef UX/UI valide le rebranding, **Then** toutes les couleurs utilisent le namespace `datack-*` au lieu de `borges-*`.

2. **Given** un composant UI quelconque, **When** le Chef UX/UI l'inspecte sur mobile (< 768px), **Then** les touch targets sont ≥ 44px et le texte ≥ 16px.

3. **Given** la page À propos créée, **When** le Chef UX/UI la valide, **Then** elle affiche le slogan Datack "Créer des rencontres, Activer les publics".

---

### User Story 5 - Validation Binding Interface/Données (Priority: P2)

L'Agent Interface vérifie que le MCP fournit toutes les données requises par l'UI (graphe complet, réponse RAG, sous-graphe, chunks sources).

**Why this priority**: Sans données complètes, l'interface ne peut pas fonctionner correctement.

**Independent Test**: L'agent simule un cycle de requête et vérifie que toutes les données attendues par chaque composant UI sont disponibles.

**Acceptance Scenarios**:

1. **Given** le composant `GraphVisualization3DForce`, **When** l'Agent Interface vérifie les données reçues, **Then** les noeuds contiennent `id`, `type`, `labels`, et les relations contiennent `source`, `target`, `type`.

2. **Given** le composant `ProvenancePanel`, **When** l'Agent Interface vérifie après une requête, **Then** les 3 onglets (entités, relations, chunks) sont peuplés avec attribution commune.

3. **Given** le composant `CitizenExtractsPanel`, **When** un utilisateur clique sur une entité, **Then** les citations citoyennes associées sont disponibles avec leur commune d'origine.

---

### User Story 6 - Business Model et Commercialisation (Priority: P3)

Le Chef Produit définit le business model, rédige la page À propos, et prépare l'offre de consulting pour l'ontologie + ingénierie GraphRAG.

**Why this priority**: Les livrables produit peuvent être développés en parallèle une fois l'infrastructure en place.

**Independent Test**: Les documents business model, offre consulting, et grille tarifaire sont créés et cohérents.

**Acceptance Scenarios**:

1. **Given** la page À propos créée, **When** un visiteur la consulte, **Then** il comprend la mission du projet, l'équipe Datack, et la valeur de la base citoyenne.

2. **Given** le document business model, **When** le Chef Produit le valide, **Then** il contient les segments clients, proposition de valeur, sources de revenus, et structure de coûts.

3. **Given** l'offre consulting, **When** un prospect la consulte, **Then** il comprend les prestations (ontologie, GraphRAG, déploiement) avec tarification indicative.

---

### User Story 7 - Intégrité Données VectorStore/GraphStore (Priority: P2)

L'Agent Data vérifie l'intégrité des données stockées (embeddings, graphe, chunks) et leur traçabilité inter-couches.

**Why this priority**: Des données corrompues ou incomplètes compromettent toutes les requêtes.

**Independent Test**: L'agent analyse les fichiers d'une commune et produit un rapport d'intégrité.

**Acceptance Scenarios**:

1. **Given** le fichier `vdb_entities.json` d'une commune, **When** l'Agent Data le valide, **Then** chaque entité a un `__vector__` de dimension 1536 et un `source_id` valide.

2. **Given** le fichier `graph_chunk_entity_relation.graphml`, **When** l'Agent Data l'analyse, **Then** aucun noeud orphelin n'existe (degree > 0 pour tous).

3. **Given** les 50 communes du dataset, **When** l'Agent Data les valide toutes, **Then** la cohérence inter-communes est vérifiée (mêmes types d'entités partout).

---

### Edge Cases

- Que se passe-t-il si un agent ne peut pas se connecter au MCP ? → L'agent retourne un score 0 avec finding "MCP inaccessible" et le cycle continue.
- Comment gérer les conflits entre agents (scores divergents) ? → Le Chef Designer déclenche une réconciliation et documente la décision.
- Que faire si le cycle d'orchestration prend plus de 5 minutes ? → Timeout avec rapport partiel des agents ayant répondu.
- Comment traiter une commune avec données corrompues ? → Elle est signalée et exclue du score global, avec tâche de correction créée.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT fournir 7 agents Claude Code spécialisés (Chef Designer, Agent Ontologie, Agent Data, Agent MCP, Agent Interface, Chef UX/UI, Chef Produit).
- **FR-002**: Le système DOIT déclencher automatiquement un cycle d'orchestration après chaque `speckit.implement`.
- **FR-003**: Chaque agent DOIT produire un score de 1 à 10 avec justification et recommandations.
- **FR-004**: Le Chef Designer DOIT agréger les scores et générer une roadmap d'amélioration.
- **FR-005**: Le système DOIT créer automatiquement des tâches d'amélioration pour tout agent avec score < 7.
- **FR-006**: L'Agent Ontologie DOIT valider la conformité avec les 24 types d'entités et 30+ relations définis.
- **FR-007**: L'Agent MCP DOIT vérifier la chaîne de provenance complète (chunk → entité → relation → réponse).
- **FR-008**: L'Agent Interface DOIT valider que le MCP fournit toutes les données requises (graphe, réponse, sous-graphe, chunks).
- **FR-009**: Le Chef UX/UI DOIT appliquer et valider le branding Datack (couleurs, typographie, composants).
- **FR-010**: Le Chef Produit DOIT produire les livrables commerciaux (business model, page À propos, offre consulting).
- **FR-011**: Le système DOIT stocker les scores de chaque cycle dans `specs/005-agent-orchestration/scores/`.
- **FR-012**: Le système DOIT fournir un skill `/speckit.orchestrate` pour déclencher manuellement un cycle.

### Key Entities

- **Agent**: Représente un agent spécialisé avec son nom, ses responsabilités, outils autorisés, et critères de scoring.
- **Cycle**: Un cycle d'orchestration avec timestamp, agents participants, scores collectés, et roadmap générée.
- **Score**: Évaluation 1-10 d'un agent avec forces, faiblesses, et recommandations.
- **Finding**: Observation spécifique d'un agent avec niveau de sévérité et action recommandée.
- **Roadmap**: Plan d'amélioration généré par le Chef Designer basé sur les scores agrégés.

### Responsive Design *(for rebranding)*

**Breakpoints**:
- Mobile (< 768px): Navigation en hamburger menu, panels empilés verticalement, graphe plein écran
- Tablet (768-1024px): Layout 2 colonnes (graphe + panel), navigation horizontale
- Desktop (> 1024px): Layout 3 colonnes complet

**Touch Interactions**:
- Graphe 3D: tap (sélection), pinch (zoom), drag (rotation/pan), double-tap (focus)
- Touch targets MUST être ≥ 44x44 pixels sur tous les éléments interactifs

**Mobile-Specific Considerations**:
- [x] Navigation Datack adapte en hamburger sur mobile
- [x] Modals/panels scrollables et dismissibles
- [x] Font sizes minimum 16px body text (Inter)
- [x] Images/SVG (logo Datack) scale sans overflow
- [x] Performance: < 3s FCP sur 3G

**Branding Datack**:
- Palette: jaune #F5C518 (accent), noir #1A1A1A (fond), gris #6B7280 (secondaire)
- Font: Inter (Google Fonts) - weights 400, 500, 600, 700
- Logo: datack-jaune.png en header
- Slogan: "Créer des rencontres, Activer les publics"

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le cycle d'orchestration complet s'exécute en moins de 5 minutes.
- **SC-002**: Le score moyen système atteint ≥ 8/10 après 3 cycles d'amélioration.
- **SC-003**: 100% des entités du graphe sont conformes à l'ontologie définie.
- **SC-004**: 100% des réponses MCP incluent une chaîne de provenance complète.
- **SC-005**: L'interface rebrandée Datack passe les tests WCAG AA de contraste.
- **SC-006**: Les touch targets sont ≥ 44px sur 100% des éléments interactifs.
- **SC-007**: Le FCP sur mobile 3G est < 3 secondes.
- **SC-008**: Les livrables produit (business model, À propos, consulting) sont créés et approuvés.

## Assumptions

- Le serveur MCP `graphragmcp-production.up.railway.app` reste accessible.
- Les 50 communes du dataset sont complètes et sans corruption majeure.
- L'ontologie `model.mmd` est stable et ne change pas pendant l'implémentation.
- Le logo Datack jaune est disponible sur le site datack.fr.
- La police Inter est disponible via Google Fonts.

## Dependencies

- Constitution v3.0.0 (9 principes à respecter)
- Feature 004-ui-consistency (base GraphML et visualisation 3D)
- Serveur MCP déployé sur Railway
- Ontologie définie dans `/law_graph_core/ontology/`
- Speckit skills existants (specify, plan, tasks, implement)

## Out of Scope

- Migration des données existantes (les 50 communes sont considérées comme source de vérité)
- Développement de nouveaux outils MCP
- Modification de l'algorithme GraphRAG (nano_graphrag)
- Internationalisation de l'interface (français uniquement)
- Tests automatisés E2E (validation manuelle pour cette phase)
