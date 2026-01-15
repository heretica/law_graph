---
agent: mcp
cycle: "004"
timestamp: 2024-12-25T01:00:00Z
score: 7
previous_score: 8
status: FAIL
---

# Agent MCP - Cycle 004 Validation

## Score: 7/10 (regression from Cycle 003: 8/10)

### Executive Summary

MCP server connectivity is **CONFIRMED** but critical implementation issues remain:
- ✅ Server accessible at `https://graphragmcp-production.up.railway.app/mcp`
- ✅ JSON-RPC initialization working (SSE format)
- ⚠️ Session ID handling has potential issues
- ❌ **CRITICAL BUG**: `document_id: 'unknown'` still present in route.ts (line 211)
- ⚠️ MCP tool coverage incomplete (67% in Cycle 003)

**Status**: FAIL - Document ID bug from Cycle 003 not addressed in Cycle 004

---

## 1. MCP Server Connectivity Test ✅

### Test 1: MCP Initialization
```bash
curl -X POST https://graphragmcp-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"initialize",...}'
```

**Result**: ✅ SUCCESS
```
HTTP Status: 200
event: message
data: {
  "jsonrpc":"2.0",
  "id":1,
  "result":{
    "protocolVersion":"2024-11-05",
    "capabilities":{...},
    "serverInfo":{"name":"graphrag_mcp","version":"1.25.0"}
  }
}
```

**Server Version**: 1.25.0 (confirmed operational)

### Test 2: Health Endpoint
```bash
curl -X POST https://graphragmcp-production.up.railway.app/health
```

**Result**: ❌ 404 Not Found
- Health endpoint does not exist at `/health`
- MCP protocol uses `/mcp` endpoint exclusively
- Route.ts GET handler implements health check via `grand_debat_list_communes` tool ✅

---

## 2. MCP Service Implementation Review

### File: `/3_borges-interface/src/lib/services/law-graphrag.ts`

| Method | Status | Notes |
|--------|--------|-------|
| `query()` | ✅ | Correctly proxies to `/api/law-graphrag` |
| `fetchFullGraph()` | ✅ | Uses `grand_debat_query_all` with mode='global' |
| `transformToGraphData()` | ✅ | Proper entity/relationship mapping |
| `checkHealth()` | ✅ | GET request to proxy route |

**Strengths**:
- Clean separation: service → proxy → MCP
- Proper error handling with try/catch
- Graph data transformation preserves provenance

**Issues**:
- Line 122: Comment says "Mode is ignored" - should clarify this behavior
- Line 132: `max_communes` not passed in `fetchFullGraph()` (defaults to route.ts value)

---

## 3. MCP Proxy Route Implementation

### File: `/3_borges-interface/src/app/api/law-graphrag/route.ts`

#### POST Handler Analysis

| Line | Component | Status | Issue |
|------|-----------|--------|-------|
| 13 | Environment Variable | ✅ | `LAW_GRAPHRAG_API_URL` correctly configured |
| 21-54 | Session Initialization | ⚠️ | Session ID extraction fragile (see below) |
| 59-104 | Tool Calling | ✅ | Correct JSON-RPC format |
| 111-135 | Query Logic | ✅ | Single vs multi-commune routing |
| 186-222 | Response Transform | ❌ | **BUG: Line 211** |

#### CRITICAL BUG: document_id Handling (Line 211)

**Current Code**:
```typescript
source_chunks: (provenance.source_quotes || [])
  .filter((q): q is NonNullable<typeof q> => q != null && q.content != null)
  .map((q, i) => ({
    chunk_id: `chunk-${q.chunk_id ?? i}`,
    content: q.content!,
    document_id: q.commune || 'unknown'  // ❌ BUG HERE
  }))
```

**Problem**:
- When MCP returns `source_quotes` without `.commune` field, defaults to `'unknown'`
- Violates **Constitution Principle VII: Civic Provenance Chain**
- Impacts 25% of queries (single-commune mode per Cycle 003 report)

**Expected Behavior**:
- Should use `commune_id` from query context when `.commune` is missing
- Should log warning when provenance chain is broken
- Should never show `'unknown'` to end users

**Recommended Fix**:
```typescript
document_id: q.commune || commune_id || 'PROVENANCE_MISSING'
// Then filter these out or handle gracefully in UI
```

#### Session ID Extraction Issue (Lines 44-51)

**Current Code**:
```typescript
const sessionId = response.headers.get('mcp-session-id')
if (!sessionId) {
  // Try to parse from SSE response
  const text = await response.text()
  console.log('MCP init response:', text)
  throw new Error('No session ID in MCP response')
}
```

**Problem**:
- Assumes session ID comes from HTTP header `mcp-session-id`
- Fallback reads entire SSE stream but doesn't extract session ID
- May fail silently if MCP server sends session ID in response body

**Test Result**:
From our curl test, the MCP server responds with SSE format:
```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{...}}
```

No `mcp-session-id` header was observed in the test. This suggests:
1. Server may not be sending session IDs via header
2. Or session management is handled differently

**Recommendation**:
- Test actual session ID flow with working MCP client
- Add logging to capture session ID source (header vs body)
- Document expected session lifecycle

---

## 4. Civic Provenance Chain Verification

### Constitution Principle VII Implementation

| Component | Requirement | Status |
|-----------|-------------|--------|
| Entity → Commune | `source_commune` field | ✅ Supported |
| Chunk → Commune | `document_id` field | ❌ **BUG: defaults to 'unknown'** |
| Relationship → Context | Provenance metadata | ✅ Supported |
| Query → Result | `query_id` tracking | ⚠️ Not implemented |

**Provenance Chain Flow**:
```
Citizen Text → Chunk (document_id) → Entity (source_commune) → Relationship → RAG Answer
      ✅              ❌                     ✅                  ✅             ✅
```

**Broken Link**: Chunk → Commune mapping fails when MCP doesn't provide `.commune`

---

## 5. MCP Tool Coverage (from Cycle 003)

| Tool | Status | Usage |
|------|--------|-------|
| `grand_debat_list_communes` | ✅ | Health check (route.ts:253) |
| `grand_debat_query` | ✅ | Single commune queries (route.ts:121) |
| `grand_debat_query_all` | ✅ | Initial graph load (route.ts:129) |
| `grand_debat_get_communities` | ✅ | Global mode queries |
| `grand_debat_search_entities` | ❌ | **Not used** |
| `grand_debat_get_entity_details` | ❌ | **Not used** |

**Tool Utilization**: 4/6 (67%)

**Missing Functionality**:
- No entity search capability in UI
- No detailed entity exploration
- Limits graph navigation features

---

## 6. Type Safety Analysis

### File: `/3_borges-interface/src/types/law-graphrag.ts`

| Type | Constitution Principle | Status |
|------|------------------------|--------|
| `LegalSourceChunk` (lines 50-58) | Principle VII: Civic Provenance | ✅ |
| `LegalEntity` (lines 24-31) | Principle II: Commune-Centric | ✅ |
| `LegalRelationship` (lines 36-44) | Principle III: Cross-Commune | ✅ |
| `GrandDebatProvenance` (lines 142-156) | Principle V: Interpretability | ✅ |

**Key Fields**:
- ✅ `source_commune` on entities (line 29)
- ✅ `document_id` on chunks (line 54) - **but implementation broken**
- ✅ `commune` on CitizenExtract (line 123)
- ⚠️ `query_id` optional (line 102) - should be required for provenance

**Type Alignment**: Types are well-defined, but runtime implementation doesn't match

---

## 7. Environment Configuration

### `.env.local`
```env
LAW_GRAPHRAG_API_URL=https://graphragmcp-production.up.railway.app
```

✅ Correct endpoint
✅ No trailing `/mcp` (added in route.ts)
✅ Production Railway deployment

---

## 8. Integration Points

### BorgesLibrary.tsx Usage

| Integration Point | Line | Status |
|-------------------|------|--------|
| Full graph load | 388 | ✅ `fetchFullGraph()` |
| Query submission | 538 | ✅ `query({ query, mode })` |
| Health check | - | ❌ Not called from UI |

**Integration Quality**: Service is properly integrated into component lifecycle

---

## 9. Constitution Compliance

| Principle | Requirement | Status | Score |
|-----------|-------------|--------|-------|
| I | No orphan nodes | ✅ | 10/10 |
| II | Commune-centric | ✅ | 10/10 |
| III | Cross-commune analysis | ✅ | 9/10 |
| IV | Visual spacing | N/A (MCP layer) | - |
| V | End-to-end interpretability | ⚠️ | 6/10 |
| VI | Single-source | ✅ | 10/10 |
| VII | Civic provenance chain | ❌ | 4/10 |

**Principle V (Interpretability)**: Partial failure due to missing `query_id` tracking
**Principle VII (Provenance)**: Major failure due to `document_id: 'unknown'` bug

---

## 10. Findings Summary

### Critical Issues (Must Fix)
1. **Document ID Bug** (route.ts:211): `document_id: q.commune || 'unknown'`
   - Impact: 25% of queries show broken provenance
   - Fix: Use query context `commune_id` as fallback
   - Priority: **P0 - BLOCKER**

2. **Session ID Extraction** (route.ts:44-51): May fail if server format changes
   - Impact: All MCP requests fail if session handling breaks
   - Fix: Robust header + body parsing with logging
   - Priority: **P1 - HIGH**

### Medium Priority
3. **Missing Query ID**: No unique tracking for provenance chains
   - Impact: Cannot trace specific query execution
   - Fix: Generate and log query_id for each request
   - Priority: **P2 - MEDIUM**

4. **Incomplete Tool Coverage**: 67% of MCP tools used
   - Impact: Missing entity search/detail features
   - Fix: Implement UI for `search_entities` and `get_entity_details`
   - Priority: **P2 - MEDIUM**

### Low Priority
5. **Health Check**: Not exposed in UI
   - Impact: Manual server status verification only
   - Fix: Add status indicator component
   - Priority: **P3 - LOW**

---

## 11. Recommendations

### Immediate Actions (Cycle 005)
1. **Fix document_id bug** in route.ts
2. **Add comprehensive logging** for session ID flow
3. **Implement query_id** generation and tracking
4. **Add integration tests** for MCP tool calls

### Future Enhancements
1. Implement entity search tool integration
2. Add detailed entity view with `get_entity_details`
3. Create health status indicator in UI
4. Add MCP response caching for performance

---

## Score Justification

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Server Connectivity | 20% | 10/10 | 2.0 |
| Service Implementation | 20% | 9/10 | 1.8 |
| Proxy Route Quality | 20% | 5/10 | 1.0 |
| Provenance Chain | 25% | 4/10 | 1.0 |
| Constitution Compliance | 15% | 7/10 | 1.05 |
| **TOTAL** | **100%** | **7.0/10** | **6.85** |

**Rounded Score**: **7/10**

**Regression Analysis**:
- Cycle 003: 8/10
- Cycle 004: 7/10
- Change: **-1 point**

**Reason for Regression**:
Critical bug from Cycle 003 (`document_id: 'unknown'`) was not addressed in Cycle 004, despite being identified. This represents a failure in the development cycle to prioritize bug fixes.

---

## Conclusion

**MCP Integration Status**: Partially functional with critical provenance bug

**Primary Blocker**: Document ID fallback to 'unknown' breaks Constitution Principle VII

**Next Steps**:
1. Fix route.ts line 211 (document_id mapping)
2. Verify session ID handling with live traffic logs
3. Implement query_id tracking for full interpretability
4. Expand MCP tool usage to 100% (all 6 tools)

**Recommendation**: **FAIL** - Must fix document_id bug before Cycle 005 validation

---

*Generated by MCP Agent - Cycle 004 Validation*
*Timestamp: 2024-12-25T01:00:00Z*
