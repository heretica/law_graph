# Business Model: Grand Débat National GraphRAG

**Feature**: 005-agent-orchestration
**Date**: 2024-12-24
**Status**: Draft
**Author**: Chef Produit

## Executive Summary

Le Grand Débat National GraphRAG est une plateforme d'exploration interactive des contributions citoyennes, basée sur une technologie de graphe de connaissances et génération augmentée. Ce document définit le modèle économique pour la commercialisation de la solution et des services associés.

---

## Business Model Canvas

### 1. Segments Clients

| Segment | Description | Taille Estimée |
|---------|-------------|----------------|
| **Collectivités locales** | Mairies, intercommunalités, conseils départementaux/régionaux | ~35,000 en France |
| **Administrations centrales** | Ministères, préfectures, agences de l'État | ~200 entités |
| **Instituts de sondage** | IFOP, Ipsos, OpinionWay, etc. | ~50 acteurs |
| **Médias et journalistes** | Presse écrite, TV, web | ~1,000 rédactions |
| **Chercheurs** | Sciences politiques, sociologie, data science | ~500 labos |
| **Cabinets de conseil** | Stratégie, affaires publiques | ~200 cabinets |

**Segment prioritaire (Year 1)**: Collectivités locales + Instituts de sondage

### 2. Proposition de Valeur

#### Pour les collectivités locales

- **Accès structuré** aux contributions citoyennes historiques
- **Analyse comparative** inter-communes et inter-thématiques
- **Outil de préparation** de nouvelles consultations
- **Preuve d'écoute** citoyenne (reporting)

#### Pour les instituts de sondage

- **Méthodologie complémentaire** aux sondages quantitatifs
- **Richesse qualitative** des verbatims citoyens
- **Ontologie réutilisable** pour autres consultations
- **Infrastructure technologique** clé en main

#### Pour les chercheurs

- **Dataset structuré** et documenté
- **API d'accès** programmatique
- **Reproductibilité** des analyses
- **Interprétabilité** des résultats

### 3. Canaux

| Canal | Type | Cible |
|-------|------|-------|
| Interface web publique | Self-service | Grand public, chercheurs |
| API GraphRAG (MCP) | Technique | Développeurs, intégrateurs |
| Consulting direct | High-touch | Collectivités, instituts |
| Webinaires/Démos | Marketing | Tous segments |
| Publications académiques | Thought leadership | Chercheurs, experts |
| Partenariats médias | Distribution | Journalistes |

### 4. Relations Clients

| Modèle | Description | Niveau de Service |
|--------|-------------|-------------------|
| **Self-service** | Interface web gratuite, documentation | Basic |
| **API Premium** | Accès API, quota élevé, support email | Standard |
| **Accompagnement** | Onboarding, formation, support dédié | Premium |
| **Partenariat** | Co-développement, exclusivité, roadmap | Enterprise |

### 5. Sources de Revenus

#### Revenus récurrents (SaaS)

| Offre | Prix | Cible |
|-------|------|-------|
| API Starter | 500 €/mois | Startups, chercheurs |
| API Pro | 1,500 €/mois | PME, cabinets |
| API Enterprise | 5,000 €/mois | Grands comptes |

#### Revenus ponctuels (Services)

| Prestation | Prix | Durée |
|------------|------|-------|
| Audit données citoyennes | 8,000 € | 5 jours |
| Setup GraphRAG sur mesure | 15,000 € | 10 jours |
| Interface personnalisée | 25,000 € | 20 jours |
| Formation ontologie | 3,000 € | 2 jours |

#### Licences

| Licence | Prix | Conditions |
|---------|------|------------|
| Ontologie civique | 5,000 €/an | Usage commercial |
| Dataset Grand Débat | 10,000 €/an | Accès complet |
| White-label interface | 20,000 €/an | Branding personnalisé |

### 6. Ressources Clés

| Ressource | Description | Propriétaire |
|-----------|-------------|--------------|
| Dataset Grand Débat | 50 communes, 8000+ entités | Datack |
| Ontologie civique | 24 types, 30+ relations | Datack |
| Infrastructure GraphRAG | nano_graphrag + MCP | Datack |
| Interface 3D | Visualisation interactive | Datack |
| Équipe technique | Développement, data science | Datack |
| Expertise métier | Mobilisation citoyenne | Datack |

### 7. Activités Clés

| Activité | Fréquence | Responsable |
|----------|-----------|-------------|
| Maintenance infrastructure | Continue | Équipe tech |
| Évolution ontologie | Trimestriel | Data science |
| Développement fonctionnalités | Mensuel | Équipe produit |
| Support client | Continue | Customer success |
| Marketing/Ventes | Continue | Business dev |
| R&D / Publications | Semestriel | Direction |

### 8. Partenaires Clés

| Partenaire | Type | Valeur |
|------------|------|--------|
| Préfectures | Données | Accès aux cahiers de doléances |
| Railway | Infrastructure | Hébergement MCP |
| OpenAI / Anthropic | Technologie | LLM pour génération |
| Universités | Recherche | Crédibilité académique |
| Open source (nano_graphrag) | Technologie | Base technique |

### 9. Structure de Coûts

#### Coûts fixes

| Poste | Montant/mois | %CA cible |
|-------|--------------|-----------|
| Infrastructure cloud | 500 € | 5% |
| Salaires équipe (3 ETP) | 15,000 € | 30% |
| Locaux/Admin | 2,000 € | 4% |
| **Total fixe** | **17,500 €** | **39%** |

#### Coûts variables

| Poste | Montant | Déclencheur |
|-------|---------|-------------|
| API LLM (OpenAI) | ~0.02€/requête | Usage |
| Support client | ~2h/client/mois | Nombre clients |
| Marketing | ~15% revenus | Acquisition |

---

## Projections Financières

### Année 1 - Phase de lancement

| Trimestre | Clients | MRR | ARR |
|-----------|---------|-----|-----|
| Q1 | 3 | 4,500 € | 54,000 € |
| Q2 | 8 | 12,000 € | 144,000 € |
| Q3 | 15 | 22,500 € | 270,000 € |
| Q4 | 25 | 37,500 € | 450,000 € |

**+ Services ponctuels**: ~100,000 € (audits, formations)

**CA Year 1 estimé**: ~300,000 €

### Année 2 - Croissance

| Objectif | Cible |
|----------|-------|
| Clients API | 100 |
| MRR | 150,000 € |
| ARR | 1,800,000 € |
| Marge brute | 70% |

---

## Go-to-Market Strategy

### Phase 1: Validation (Q1)

- Lancement interface publique gratuite
- 3-5 clients pilotes (collectivités)
- Premiers retours utilisateurs
- Publications académiques

### Phase 2: Commercialisation (Q2-Q3)

- Lancement offres API payantes
- Recrutement équipe commerciale
- Partenariats instituts de sondage
- Présence salons/conférences

### Phase 3: Scale (Q4+)

- Extension géographique (autres départements)
- Offre white-label
- Partenariats médias
- Internationalisation (Belgique, Suisse)

---

## Risques et Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Concurrence | Moyen | Haut | Avance technologique, ontologie propriétaire |
| Évolution réglementaire (RGPD) | Faible | Moyen | Anonymisation, conformité dès conception |
| Dépendance LLM | Moyen | Moyen | Multi-provider, fallback local |
| Adoption lente | Moyen | Haut | Freemium, marketing éducatif |

---

## Métriques Clés (KPIs)

| Métrique | Cible Y1 | Cible Y2 |
|----------|----------|----------|
| MRR | 37,500 € | 150,000 € |
| Nombre clients payants | 25 | 100 |
| Churn mensuel | <5% | <3% |
| NPS | >40 | >50 |
| CAC | <1,500 € | <1,000 € |
| LTV/CAC | >3 | >5 |

---

**Document Status**: DRAFT
**Next Review**: Après validation Chef Produit Cycle 1
