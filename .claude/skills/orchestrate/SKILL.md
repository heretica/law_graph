# Skill: speckit.orchestrate

**Version**: 1.0.0
**Date**: 2024-12-24
**Author**: Feature 005-agent-orchestration

## Description

Déclenche un cycle d'orchestration complet des 7 agents Claude Code pour valider et optimiser le système Grand Débat National.

## Usage

```bash
/speckit.orchestrate [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--cycle=N` | Forcer un numéro de cycle spécifique | Auto-incrémenté |
| `--agents=list` | Agents à exécuter (virgule séparée) | `all` |
| `--verbose` | Afficher logs détaillés | `false` |
| `--skip-roadmap` | Ne pas générer de roadmap | `false` |
| `--timeout=N` | Timeout par agent en secondes | `60` |

## Agents Disponibles

- `ontology` - Agent Ontologie (validation schéma)
- `data` - Agent Data (intégrité stores)
- `mcp` - Agent MCP (interprétabilité)
- `interface` - Agent Interface (binding UI)
- `uxui` - Chef UX/UI (mobile, branding)
- `product` - Chef Produit (business model)
- `all` - Tous les agents (défaut)

## Exemples

```bash
# Cycle complet standard
/speckit.orchestrate

# Cycle avec numéro spécifique
/speckit.orchestrate --cycle=005

# Uniquement agents techniques
/speckit.orchestrate --agents=ontology,data,mcp

# Cycle verbose sans roadmap
/speckit.orchestrate --verbose --skip-roadmap
```

## Workflow

### 1. Initialisation

```
1. Lire .specify/memory/constitution.md
2. Déterminer numéro de cycle (dernier + 1)
3. Créer répertoire scores/cycle-{N}/
4. Logger: "🚀 Cycle {N} démarré à {timestamp}"
```

### 2. Exécution Agents

```
Pour chaque agent dans [ontology, data, mcp, interface, uxui, product]:
  1. Invoquer via Task tool:
     Task(
       subagent_type: "{agent}-agent" | "{agent}-chief",
       prompt: "Exécuter validation cycle {N} et produire score",
       description: "Agent {name} - Cycle {N}"
     )
  2. Attendre résultat (timeout: 60s)
  3. Écrire score dans scores/cycle-{N}/{agent}.md
  4. Logger: "✅ {agent}: {score}/10"
```

### 3. Agrégation

```
1. Lire tous les scores
2. Calculer moyenne: sum(scores) / count
3. Identifier violations (score < 7)
4. Consolider findings
5. Écrire summary.md
```

### 4. Roadmap (si --skip-roadmap non spécifié)

```
1. Pour chaque agent avec score < 7:
   - Extraire recommandations
   - Créer tâches d'amélioration
2. Mettre à jour roadmap.md
3. Si score moyen < 7:
   - Invoquer speckit.tasks pour créer les tâches
```

### 5. Finalisation

```
1. Créer symlink latest → cycle-{N}
2. Logger résumé final
3. Retourner statut et score moyen
```

## Output

### Structure Fichiers

```
specs/005-agent-orchestration/scores/
├── cycle-{N}/
│   ├── ontology.md
│   ├── data.md
│   ├── mcp.md
│   ├── interface.md
│   ├── uxui.md
│   ├── product.md
│   └── summary.md
└── latest -> cycle-{N}/

specs/005-agent-orchestration/findings/
└── cycle-{N}/
    └── all-findings.md

specs/005-agent-orchestration/roadmap.md
```

### Console Output

```
🚀 Orchestration Cycle 001 démarré

📊 Exécution des agents:
  ✅ ontology-agent: 8/10
  ✅ data-agent: 9/10
  ✅ mcp-agent: 7/10
  ✅ interface-agent: 8/10
  ✅ uxui-chief: 6/10  ⚠️ < 7
  ✅ product-chief: 5/10  ⚠️ < 7

📈 Résumé Cycle 001:
  Score moyen: 7.2/10
  Agents < 7: 2 (uxui, product)
  Findings: 12 (2 critical, 4 major, 6 minor)

📋 Roadmap mise à jour:
  - 3 tâches créées pour améliorations

✅ Cycle 001 terminé en 4m 32s
```

## Trigger Automatique

Ce skill peut être déclenché automatiquement après `speckit.implement` via un hook:

```bash
# .claude/hooks/post-implement.sh
#!/bin/bash
echo "🔄 Déclenchement orchestration post-implement..."
claude "Run /speckit.orchestrate --auto-triggered"
```

Pour activer le trigger automatique:
```bash
chmod +x .claude/hooks/post-implement.sh
```

## Gestion des Erreurs

### Timeout Agent

Si un agent ne répond pas dans le délai:
- Score = 0
- Status = "timeout"
- Finding créé: "Agent timeout après {N}s"
- Cycle continue avec les autres agents

### MCP Inaccessible

Si le serveur MCP est inaccessible:
- Agent MCP retourne score = 0
- Finding: "MCP server inaccessible"
- Autres agents continuent normalement

### Erreur Critique

Si une erreur bloque le cycle:
- Status cycle = "failed"
- Logs d'erreur dans summary.md
- Notification dans console

## Intégration Speckit

Ce skill s'intègre avec:

| Skill | Interaction |
|-------|-------------|
| `speckit.implement` | Trigger post-execution |
| `speckit.tasks` | Création tâches amélioration |
| `speckit.analyze` | Vérification cohérence |
| `speckit.constitution` | Lecture principes |

## Constitution

Ce skill fait respecter les 9 principes de la Constitution v3.0.0 via les agents spécialisés:

1. **I. End-to-End Interpretability** → Agent MCP
2. **II. Civic Provenance Chain** → Agent Interface
3. **III. No Orphan Nodes** → Agent Data
4. **IV. Commune-Centric Architecture** → Agent Ontologie
5. **V. Cross-Commune Civic Analysis** → Agent MCP
6. **VI. Single-Source Civic Data** → Agent Interface
7. **VII. Functional Civic Interface** → Chef UX/UI
8. **VIII. Mobile-First Responsiveness** → Chef UX/UI
9. **IX. RAG Observability** → Agent MCP

---

**Skill Status**: ACTIVE
**Maintainer**: Feature 005-agent-orchestration
