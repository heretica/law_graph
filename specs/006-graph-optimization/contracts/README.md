# API Contracts: Graph Performance Optimization

**Feature**: 006-graph-optimization
**Date**: 2025-12-25

## No New API Contracts

This optimization feature does **not** introduce new API endpoints or modify existing API contracts.

### Rationale

1. **Internal Optimization**: All changes are internal performance improvements
2. **Backward Compatibility**: Existing MCP tool calls remain unchanged
3. **No Breaking Changes**: Response formats are preserved

### Affected Layers

| Layer | Change Type | Contract Impact |
|-------|-------------|-----------------|
| Frontend State | Internal refactor | None |
| Client Cache | New internal structure | None |
| Session Pool | New internal structure | None |
| Backend Cache | New internal structure | None |
| MCP Tools | Unchanged | None |

### Existing MCP Tools (Unchanged)

```
grand_debat_list_communes    → No changes
grand_debat_query            → No changes (faster response)
grand_debat_query_all        → No changes (faster response)
grand_debat_search_entities  → No changes
grand_debat_get_communities  → No changes
grand_debat_get_contributions→ No changes
```

### Performance Improvements (Non-Contract)

The following improvements are transparent to API consumers:

- Response times reduced (120s → 30s for 15 communes)
- Session reuse (no handshake per request)
- Cached responses for repeated queries
- Reduced LLM calls via caching

### Future Considerations

If streaming responses (Phase 5) are implemented, this would require:
- New SSE endpoint or WebSocket upgrade
- Documented separately in a future spec
