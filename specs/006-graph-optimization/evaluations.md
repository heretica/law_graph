# Technical Evaluations: Graph Performance Optimization

**Feature**: 006-graph-optimization
**Date**: 2025-12-25

## T035: Component Splitting Evaluation

### Current State
BorgesLibrary.tsx is ~1,350 lines with 28 useState hooks managing:
- UI state (panels, modals, loading)
- Query state (text, communes, progress)
- Graph state (nodes, links, selection)

### Proposed Split
1. **QueryPanel** - Query input, commune selection, submit
2. **GraphContainer** - 3D graph wrapper with LOD
3. **AnswerPanel** - Query results and debug info
4. **EntityModals** - Entity/commune detail modals

### Decision: DEFERRED

**Rationale**:
1. **High Risk**: Major refactoring with potential regressions
2. **Working Code**: Current implementation is functional
3. **Performance Achieved**: Target metrics met without splitting
4. **Future Work**: Better suited for dedicated refactoring sprint

**Recommendation**: Track as tech debt. Revisit if:
- Component grows beyond 2000 lines
- Re-render performance degrades
- New features require isolated state

---

## T036: Response Compression Evaluation

### Current State
- API responses are uncompressed JSON
- GraphML file: ~500KB
- Query responses: 10-50KB depending on communes

### Analysis

**Pros of gzip**:
- 60-75% payload reduction
- Faster network transfer
- Standard HTTP feature

**Cons of gzip**:
- CPU overhead on server/client
- Already fast on local network
- Railway.app may auto-compress

### Decision: NOT IMPLEMENTED

**Rationale**:
1. **Diminishing Returns**: Network time is small vs LLM processing
2. **Platform Handling**: Railway.app often handles compression at edge
3. **Complexity**: Requires server config changes
4. **Low Impact**: Query time dominated by LLM, not network

**Recommendation**: Monitor network times. Implement if:
- Network transfer exceeds 500ms regularly
- Response payloads grow significantly
- Users report slow loads on mobile networks

---

## Summary

| Evaluation | Decision | Rationale |
|-----------|----------|-----------|
| Component Splitting | Deferred | High risk, targets met |
| Response Compression | Not Implemented | Diminishing returns |

Both decisions can be revisited in future optimization cycles based on production metrics.
