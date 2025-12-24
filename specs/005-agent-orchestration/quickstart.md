# Quickstart: Agent Orchestration Grand Débat National

**Feature**: 005-agent-orchestration
**Time to first cycle**: ~10 minutes

## Prerequisites

- [ ] Claude Code CLI installé (`claude` command available)
- [ ] Repository `law_graph` cloné
- [ ] Branch `005-agent-orchestration` checkout
- [ ] MCP Server Railway accessible (`graphragmcp-production.up.railway.app`)

## Quick Setup

### 1. Verify Branch

```bash
git checkout 005-agent-orchestration
git status  # Should show clean working tree
```

### 2. Verify Agent Files Exist

```bash
ls -la .claude/agents/
# Expected output:
# design-chief.md
# ontology-agent.md
# data-agent.md
# mcp-agent.md
# interface-agent.md
# uxui-chief.md
# product-chief.md
```

### 3. Verify Skill Exists

```bash
ls -la .claude/skills/orchestrate/
# Expected: SKILL.md
```

### 4. Run First Orchestration Cycle

```bash
claude "Run /speckit.orchestrate"
```

### 5. Check Results

```bash
ls specs/005-agent-orchestration/scores/cycle-001/
# Should contain: ontology.md, data.md, mcp.md, interface.md, uxui.md, product.md, summary.md
```

## Manual Agent Invocation

To run a specific agent manually:

```bash
# Run Ontology Agent
claude "Invoke the ontology-agent to validate the current state"

# Run MCP Agent
claude "Invoke the mcp-agent to check interpretability"

# Run UX/UI Chief
claude "Invoke the uxui-chief to validate branding"
```

## Automatic Triggering

After any `speckit.implement` command, orchestration runs automatically via post-implement hook.

To disable:
```bash
# Comment out or remove the hook
# .claude/hooks/post-implement.sh
```

## Scores Directory Structure

```
specs/005-agent-orchestration/
├── scores/
│   ├── cycle-001/
│   │   ├── ontology.md      # Score 1-10 + findings
│   │   ├── data.md
│   │   ├── mcp.md
│   │   ├── interface.md
│   │   ├── uxui.md
│   │   ├── product.md
│   │   └── summary.md       # Aggregated by Chef Designer
│   ├── cycle-002/
│   │   └── ...
│   └── latest -> cycle-002/ # Symlink to latest cycle
├── findings/
│   └── cycle-001/
│       └── all-findings.md  # Consolidated findings
└── roadmap.md               # Generated improvement roadmap
```

## Interpreting Results

### Score Thresholds

| Score | Status | Action |
|-------|--------|--------|
| ≥ 8 | 🟢 Excellent | No action needed |
| 7 | 🟡 Good | Optional improvements |
| 5-6 | 🟠 Acceptable | Improvements recommended |
| < 5 | 🔴 Critical | Immediate action required |

### Reading Summary

Open `scores/latest/summary.md` to see:
- Average system score
- Per-agent breakdown
- Priority improvements
- Generated roadmap tasks

## Troubleshooting

### MCP Server Unreachable

```bash
# Test MCP connectivity
curl -s https://graphragmcp-production.up.railway.app/health

# If failed, check Railway status
# MCP agent will score 0 and document the error
```

### Agent Not Found

```bash
# Ensure agents are in correct location
ls .claude/agents/*.md

# If missing, re-run speckit.implement for feature 005
claude "Run /speckit.implement for 005-agent-orchestration"
```

### Cycle Timeout

If a cycle takes > 5 minutes:
- Status becomes `partial`
- Only completed agents' scores are recorded
- Check `summary.md` for which agents timed out

## Next Steps

1. **Review first cycle scores** in `scores/cycle-001/summary.md`
2. **Address critical findings** (score < 5)
3. **Complete Datack rebranding** if not done
4. **Run second cycle** to verify improvements

## Key Files Reference

| Purpose | File |
|---------|------|
| Main orchestrator | `.claude/agents/design-chief.md` |
| Orchestration skill | `.claude/skills/orchestrate/SKILL.md` |
| Score contract | `specs/005-agent-orchestration/contracts/score-format.md` |
| Findings contract | `specs/005-agent-orchestration/contracts/findings-format.md` |
| Data model | `specs/005-agent-orchestration/data-model.md` |

---

**Need help?** Run `claude "Explain the agent orchestration system"`
