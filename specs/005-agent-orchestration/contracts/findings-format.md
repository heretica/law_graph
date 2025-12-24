# Contract: Findings Format

**Version**: 1.0.0
**Date**: 2024-12-24
**Status**: Active

## Purpose

Définit le format standardisé des findings (observations) produits par les agents lors de l'analyse du système.

## File Location

```
specs/005-agent-orchestration/findings/cycle-{N}/all-findings.md
```

## Format Specification

### YAML Frontmatter (Required)

```yaml
---
cycle: string              # Numéro du cycle (ex: 001)
generated_at: string       # ISO 8601
total_findings: integer    # Nombre total
by_severity:
  critical: integer
  major: integer
  minor: integer
  info: integer
by_agent:
  ontology-agent: integer
  data-agent: integer
  mcp-agent: integer
  interface-agent: integer
  uxui-chief: integer
  product-chief: integer
---
```

### Markdown Body (Required)

```markdown
# Findings Report - Cycle {N}

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| Critical | {n} | Immediate |
| Major | {n} | This cycle |
| Minor | {n} | Next cycle |
| Info | {n} | Optional |

## Critical Findings

### [FINDING-001] {Title}

- **Agent**: {agent-id}
- **Category**: {category}
- **Severity**: Critical
- **Status**: Open | Resolved

**Description**:
{Detailed description of the issue}

**Evidence**:
{Code snippets, file paths, or data samples}

**Action Required**:
{Specific steps to resolve}

**Resolution** (if resolved):
{How it was fixed, by whom, when}

---

## Major Findings

### [FINDING-002] {Title}
...

## Minor Findings

### [FINDING-003] {Title}
...

## Informational

### [FINDING-004] {Title}
...
```

## Finding Categories

| Category | Description | Typical Agent |
|----------|-------------|---------------|
| `ontology` | Schema conformity, entity types, relations | ontology-agent |
| `data` | VectorStore, GraphStore, embeddings | data-agent |
| `mcp` | Provenance chain, tool responses | mcp-agent |
| `interface` | Data binding, component contracts | interface-agent |
| `ux` | Accessibility, responsiveness, interactions | uxui-chief |
| `branding` | Visual identity, Datack compliance | uxui-chief |
| `product` | Business model, commercialization | product-chief |
| `constitution` | Principle violations | any agent |

## Severity Definitions

### Critical (Immediate Action)

- System is non-functional or data integrity compromised
- Constitution principle violated
- Security vulnerability exposed
- User-facing errors blocking core functionality

**SLA**: Must be addressed before next deployment

### Major (This Cycle)

- Significant deviation from specification
- Performance degradation affecting user experience
- Missing functionality defined in requirements
- Branding inconsistency visible to users

**SLA**: Must be addressed before cycle completion

### Minor (Next Cycle)

- Minor deviations from best practices
- Non-critical improvements identified
- Documentation gaps
- Minor visual inconsistencies

**SLA**: Track for next cycle, optional immediate fix

### Info (Optional)

- Observations for awareness
- Potential future improvements
- Code quality suggestions
- Performance optimization opportunities

**SLA**: No action required, document for reference

## Example: Complete Findings File

```markdown
---
cycle: 001
generated_at: 2024-12-24T15:00:00Z
total_findings: 7
by_severity:
  critical: 1
  major: 2
  minor: 3
  info: 1
by_agent:
  ontology-agent: 2
  data-agent: 1
  mcp-agent: 1
  interface-agent: 1
  uxui-chief: 2
  product-chief: 0
---

# Findings Report - Cycle 001

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| Critical | 1 | Immediate |
| Major | 2 | This cycle |
| Minor | 3 | Next cycle |
| Info | 1 | Optional |

## Critical Findings

### [FINDING-001] Noeuds orphelins dans GraphML exporté

- **Agent**: data-agent
- **Category**: constitution
- **Severity**: Critical
- **Status**: Open

**Description**:
12 noeuds avec `degree=0` détectés dans le fichier GraphML exporté, violant le Principe III de la Constitution (No Orphan Nodes).

**Evidence**:
```
File: public/data/grand-debat.graphml
Orphan nodes: ["node_1234", "node_5678", ...]
Communes affectées: Rochefort (8), La Rochelle (4)
```

**Action Required**:
1. Appliquer `filterOrphanNodes()` avant export GraphML
2. Ajouter validation dans pipeline d'export
3. Corriger données source dans communes affectées

---

## Major Findings

### [FINDING-002] Type de relation UNKNOWN non défini

- **Agent**: ontology-agent
- **Category**: ontology
- **Severity**: Major
- **Status**: Open

**Description**:
5 relations utilisent le type `UNKNOWN` qui n'est pas défini dans `model.mmd`.

**Evidence**:
```
Occurrences:
- Saintes: 2 relations UNKNOWN
- Royan: 3 relations UNKNOWN
Pattern: Toutes concernent des liens Contribution → Opinion
```

**Action Required**:
1. Identifier le type correct (probablement `EXPRIME` ou `CONTIENT`)
2. Mettre à jour prompt extraction dans nano_graphrag
3. Réextraire les entités des communes affectées

---

### [FINDING-003] Touch targets < 44px sur mobile

- **Agent**: uxui-chief
- **Category**: ux
- **Severity**: Major
- **Status**: Open

**Description**:
Les boutons de l'EntityDetailModal ont une taille de 32px, inférieure au minimum WCAG de 44px pour les cibles tactiles.

**Evidence**:
```
File: components/EntityDetailModal.tsx
Line: 145
Current: className="p-2" (32px)
Required: className="p-3" (48px) minimum
```

**Action Required**:
1. Augmenter padding des boutons à p-3 minimum
2. Vérifier tous les éléments interactifs
3. Ajouter test automatique pour touch targets

---

## Minor Findings

### [FINDING-004] Police Cormorant Garamond encore présente

- **Agent**: uxui-chief
- **Category**: branding
- **Severity**: Minor
- **Status**: Open

**Description**:
La police Cormorant Garamond (Borges) est encore référencée alors que le rebranding Datack requiert Inter.

**Evidence**:
```
File: src/app/layout.tsx
Line: 12
import { Cormorant_Garamond } from 'next/font/google'
```

**Action Required**:
Remplacer par Inter dans le cadre du rebranding Phase 4.

---

### [FINDING-005] Variable CSS borges-* non renommées

- **Agent**: uxui-chief
- **Category**: branding
- **Severity**: Minor
- **Status**: Open

**Description**:
Les variables CSS utilisent encore le namespace `borges-*` au lieu de `datack-*`.

**Action Required**:
Renommer dans globals.css et tailwind.config.js.

---

### [FINDING-006] source_commune manquant

- **Agent**: ontology-agent
- **Category**: data
- **Severity**: Minor
- **Status**: Open

**Description**:
3 entités sur 8,418 n'ont pas l'attribut `source_commune`, empêchant la traçabilité civique.

**Action Required**:
Ajouter validation dans extraction et corriger les 3 entités.

---

## Informational

### [FINDING-007] Optimisation possible chargement GraphML

- **Agent**: interface-agent
- **Category**: interface
- **Severity**: Info
- **Status**: Open

**Description**:
Le fichier GraphML (2.4MB) pourrait être compressé avec gzip pour réduire le temps de chargement initial.

**Suggestion**:
Configurer compression côté serveur ou utiliser GraphML binaire.

---

**Report Generated**: 2024-12-24T15:00:00Z
**Next Review**: Cycle 002
```

## Parsing Rules

### For Roadmap Generation

1. Filter findings with `severity: critical` or `severity: major`
2. Group by `category` for thematic organization
3. Extract `Action Required` as task descriptions
4. Prioritize by severity: critical → major → minor

### For Task Generation

```python
# Pseudo-code for speckit.tasks integration
for finding in findings:
    if finding.severity in ['critical', 'major']:
        task = {
            'title': finding.title,
            'description': finding.action_required,
            'priority': 'P1' if finding.severity == 'critical' else 'P2',
            'labels': [finding.category, finding.agent],
            'source': f'FINDING-{finding.id}'
        }
        create_task(task)
```

### Resolution Tracking

When a finding is resolved:
1. Update `Status: Open` → `Status: Resolved`
2. Add `Resolution` section with details
3. Reference fix commit or PR
4. Update `by_severity` counts in frontmatter

---

**Contract Status**: ACTIVE
**Consumers**: Chef Designer, speckit.tasks, roadmap.md
