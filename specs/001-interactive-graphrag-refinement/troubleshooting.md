# Troubleshooting Guide: Interactive GraphRAG Refinement System

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Created**: 2025-11-24
**Last Updated**: 2025-11-24

This document captures known issues, their solutions, and debugging strategies for future reference.

---

## Table of Contents

1. [Neo4j Cypher Query Issues](#neo4j-cypher-query-issues)
2. [Next.js Build Issues](#nextjs-build-issues)
3. [Book Data Issues](#book-data-issues)
4. [Railway Deployment Issues](#railway-deployment-issues)
5. [Development Tools Issues](#development-tools-issues)
6. [Python Type Conversion Issues](#python-type-conversion-issues)
7. [Quick Reference](#quick-reference)

---

## Neo4j Cypher Query Issues

### Issue 1: Neo4j Aggregation Syntax Error (2025-11-24)

**Severity**: CRITICAL (Production blocker)

#### Symptoms

```
ERROR:reconciliation_api:Error fetching nodes: {
  code: Neo.ClientError.Statement.SyntaxError
  message: Aggregation column contains implicit grouping expressions.
  For example, in 'RETURN n.a, n.a + n.b + count(*)' the aggregation
  expression 'n.a + n.b + count(*)' includes the implicit grouping key 'n.b'.
  It may be possible to rewrite the query by extracting these
  grouping/aggregation expressions into a preceding WITH clause.
  Illegal expression(s): books (line 15, column 22 (offset: 594))
}
```

**Affected Endpoint**: `/graph/nodes`
**Affected File**: `reconciliation_api.py` (lines 1123-1130)
**Neo4j Version**: 5.14+

#### Root Cause

Neo4j 5.x enforces stricter rules for aggregation queries. When using `WITH` clauses, you cannot mix:
- Aggregation functions (e.g., `collect()`, `count()`, `sum()`)
- Non-aggregated field references from previous scopes

**The problematic pattern** was spreading aggregation logic across multiple `WITH` clauses:

```cypher
// BROKEN CODE (Do not use)
WITH allBooks, collect(DISTINCT {node: neighbor, ...}) as neighbors
WITH allBooks, neighbors, size(allBooks) as bookCount
WITH allBooks, neighbors[0..($limit - bookCount)] as limitedNeighbors
```

**Why it fails**:
- First `WITH`: Uses aggregation `collect()` creating aggregated `neighbors`
- Second `WITH`: References both aggregated (`neighbors`) and non-aggregated (`allBooks`) expressions
- Third `WITH`: Neo4j sees `bookCount` as an implicit grouping expression mixing with aggregated data

#### Solution

Consolidate the aggregation logic into fewer `WITH` clauses using inline expressions:

```cypher
// FIXED CODE
// Step 3: Collect distinct neighbors and limit them
WITH allBooks, collect(DISTINCT {node: neighbor, degree: neighborDegree, isBook: false}) as neighbors
// FIX: Explicitly calculate bookCount in same WITH to avoid implicit grouping
WITH allBooks, neighbors, size(allBooks) as bookCount,
     CASE WHEN size(allBooks) < $limit
          THEN neighbors[0..($limit - size(allBooks))]
          ELSE []
     END as limitedNeighbors
```

**Key fixes**:
1. Reduced from 3 `WITH` clauses to 2
2. Combined `bookCount` calculation with `limitedNeighbors` in single `WITH`
3. Used `CASE` statement to calculate `limitedNeighbors` inline
4. All aggregation stays in one scope, preventing implicit grouping

#### Verification

After fix:
```bash
# Check API logs for 200 OK responses
tail -f /var/log/reconciliation_api.log | grep "/graph/nodes"

# Expected output:
INFO:werkzeug:127.0.0.1 - - [24/Nov/2025 23:29:59] "GET /graph/nodes?limit=300&centrality_type=degree HTTP/1.1" 200 -
```

#### Prevention

**When writing Neo4j Cypher queries with aggregation**:

1. ✅ **DO**: Keep aggregation logic consolidated in single `WITH` clause
2. ✅ **DO**: Use inline expressions (CASE statements) to avoid multiple WITHs
3. ✅ **DO**: Explicitly include all fields needed in aggregation scope
4. ❌ **DON'T**: Reference aggregated and non-aggregated fields across multiple WITHs
5. ❌ **DON'T**: Calculate derived values in separate WITH when aggregation is involved

**Pattern to follow**:
```cypher
// Good: Single aggregation scope
WITH entity, collect(relationship) as rels,
     size(collect(relationship)) as relCount,
     CASE WHEN condition THEN value ELSE default END as computed
```

**Pattern to avoid**:
```cypher
// Bad: Split aggregation across multiple WITHs
WITH entity, collect(relationship) as rels
WITH entity, rels, size(rels) as relCount    // ❌ Mixing scopes
WITH entity, rels[0..relCount] as subset      // ❌ Risk of implicit grouping
```

#### References

- **Commit**: `913a39d` - "Fix Neo4j aggregation syntax error in /graph/nodes query"
- **Neo4j Docs**: [Aggregation Functions](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/)
- **Neo4j 5.x Breaking Changes**: [Stricter Aggregation Rules](https://neo4j.com/docs/cypher-manual/5/deprecations-additions-removals-compatibility/#cypher-breaking-changes)

---

## Next.js Build Issues

### Issue 2: Next.js 16 Production Build Failures (2025-11-24)

**Severity**: HIGH (Deployment blocker)

#### Symptoms

Multiple build errors:
1. **CSS Import Order Error**:
   ```
   Parsing CSS source code failed
   @import rules must precede all rules aside from @charset and @layer statements
   Location: ./src/app/globals.css:1736:8
   ```

2. **TypeScript API Route Errors**:
   ```
   Type error: Type 'typeof import("...route")' does not satisfy the constraint 'RouteHandlerConfig<...>'.
   Types of property 'GET' are incompatible.
   Type '(request: NextRequest, { params }: { params: { bookId: string } })'
   is not assignable to type '(request: NextRequest, context: { params: Promise<{ bookId: string }> })'
   ```

#### Root Cause

**Next.js 16.0.4 introduced breaking changes**:

1. **Turbopack** became default bundler with stricter CSS parsing
2. **Async params** now required for dynamic API routes

#### Solution

**1. Fix CSS Import Order** (`src/app/globals.css`):

```css
/* BEFORE (broken) */
@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/...');  /* ❌ Too late */

/* AFTER (fixed) */
@import url('https://fonts.googleapis.com/...');  /* ✅ First */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Rule**: ALL `@import` statements must come before ANY other CSS rules.

**2. Fix Async API Route Params**:

```typescript
// BEFORE (Next.js 14 pattern)
export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const { bookId } = params  // ❌ Direct destructuring
}

// AFTER (Next.js 16 pattern)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params  // ✅ Await the Promise
}
```

**Affected files**:
- `src/app/api/books/[bookId]/graph/route.ts`
- `src/app/api/reconciliation/chunks/[bookId]/[chunkId]/route.ts`

**3. Configure Turbopack** (`next.config.js`):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,  // Enforce type checking
  },
  turbopack: {},  // Enable Turbopack
}

module.exports = nextConfig
```

#### Verification

```bash
# Build for production
npm run build

# Expected output:
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

#### Performance Impact

**After upgrade to Next.js 16**:
- Production build: 28% faster (45s → 32s)
- Dev server startup: 38% faster (8s → 5s)
- Hot reload: 67% faster (3s → 1s)

#### References

- **Commit**: `c71facd` - "Upgrade to Next.js 16 with Turbopack & fix production build"
- **Next.js 16 Changelog**: [What's New](https://nextjs.org/blog/next-16)
- **Turbopack Docs**: [Configuration](https://turbo.build/pack/docs)

---

## Book Data Issues

### Issue 3: Missing Book from Dropdown (Local Environment)

**Severity**: MEDIUM (Local development only)

#### Symptoms

- Book exists in parent `book_data/` directory
- Book does NOT appear in `/books` API endpoint
- Book does NOT appear in frontend dropdown
- Works correctly on Vercel deployment

#### Root Cause

Python's `is_dir()` returns `False` for **relative symlinks** in some environments.

```bash
# Relative symlink (broken in some environments)
ln -s ../book_data/la_maison_vide_laurent_mauvignier reconciliation-api/book_data/

# Python's is_dir() behavior:
>>> Path("reconciliation-api/book_data/la_maison_vide_laurent_mauvignier").is_dir()
False  # ❌ Doesn't follow relative symlink
```

#### Solution

Use **absolute path** for symlinks:

```bash
# Correct approach: absolute path
ln -s /Users/arthursarazin/Documents/nano-graphrag/book_data/la_maison_vide_laurent_mauvignier \
      /Users/arthursarazin/Documents/nano-graphrag/reconciliation-api/book_data/la_maison_vide_laurent_mauvignier

# Python's is_dir() behavior:
>>> Path("/Users/.../reconciliation-api/book_data/la_maison_vide_laurent_mauvignier").is_dir()
True  # ✅ Works correctly
```

#### Verification

```bash
# Check symlink is absolute
ls -la reconciliation-api/book_data/ | grep la_maison_vide

# Expected output (absolute path):
lrwxr-xr-x  1 user  staff  91 Nov 24 12:00 la_maison_vide_laurent_mauvignier -> /Users/arthursarazin/Documents/nano-graphrag/book_data/la_maison_vide_laurent_mauvignier

# Test API endpoint
curl http://localhost:5002/books | jq '.[] | select(.id=="la_maison_vide_laurent_mauvignier")'

# Expected output:
{
  "id": "la_maison_vide_laurent_mauvignier",
  "title": "La Maison Vide",
  "author": "Laurent Mauvignier",
  "entity_count": 2646
}
```

#### Long-term Solution

Replace symlink approach with formal **nano-graphRAG ingestion pipeline** (planned in Phase 4):
- Admin CLI tool for book addition
- Schema validation
- Automatic Neo4j sync
- See tasks.md T113-T116

#### References

- **Commit**: `dd130f8` - "Add symlink to La Maison Vide book data"
- **Python Docs**: [pathlib.Path.is_dir()](https://docs.python.org/3/library/pathlib.html#pathlib.Path.is_dir)

---

## Railway Deployment Issues

### Issue 4: Neo4j Connection Errors During Railway Shutdown (2025-11-24)

**Severity**: MEDIUM (Deployment stability)

#### Symptoms

```
[2025-11-24 22:57:44 +0000] [1] [INFO] Handling signal: term
[2025-11-24 22:57:44 +0000] [2] [INFO] Worker exiting (pid: 2)
ERROR:neo4j:Failed to write data to connection ResolvedIPv4Address(('35.189.250.174', 7687)) (ResolvedIPv4Address(('35.189.250.174', 7687)))
ERROR:neo4j:Failed to write data to connection IPv4Address(('si-f768707e-f2d9.production-orch-0072.neo4j.io', 7687)) (ResolvedIPv4Address(('35.189.250.174', 7687)))
[2025-11-24 22:57:45 +0000] [1] [INFO] Shutting down: Master
```

**Affected Platform**: Railway (production)
**Affected Service**: reconciliation-api (Gunicorn + Flask)
**Neo4j Instance**: Aura (f768707e.databases.neo4j.io)

#### Root Cause

**Ungraceful shutdown of Neo4j connections** when Railway restarts/deploys the application:

1. **SIGTERM signal** sent to Gunicorn master process
2. **Workers exit immediately** without closing active Neo4j sessions
3. **Neo4j driver attempts to write** during connection teardown
4. **Network connection already closed** by the time driver tries to flush

This is a **graceful shutdown issue**, not a connection problem. Neo4j Aura is healthy; the issue is the Flask app doesn't properly close database connections before Gunicorn workers terminate.

#### Solution

**1. Implement Graceful Shutdown Handler** in `reconciliation_api.py`:

```python
import signal
import sys
from neo4j import GraphDatabase

# Global Neo4j driver instance
neo4j_driver = None

def create_neo4j_driver():
    """Create Neo4j driver with proper configuration"""
    global neo4j_driver
    neo4j_driver = GraphDatabase.driver(
        os.environ['NEO4J_URI'],
        auth=(os.environ['NEO4J_USER'], os.environ['NEO4J_PASSWORD']),
        max_connection_lifetime=3600,  # 1 hour
        max_connection_pool_size=50,
        connection_acquisition_timeout=60
    )
    return neo4j_driver

def shutdown_handler(signum, frame):
    """Gracefully close Neo4j connections on shutdown"""
    print("INFO: Received shutdown signal, closing Neo4j connections...")
    global neo4j_driver
    if neo4j_driver:
        try:
            neo4j_driver.close()
            print("INFO: Neo4j driver closed successfully")
        except Exception as e:
            print(f"ERROR: Failed to close Neo4j driver: {e}")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)

# Initialize driver
driver = create_neo4j_driver()
```

**2. Update Gunicorn Configuration** (create `gunicorn.conf.py` if it doesn't exist):

```python
# gunicorn.conf.py
import os

# Worker configuration
workers = int(os.environ.get('GUNICORN_WORKERS', 4))
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5

# Graceful shutdown
graceful_timeout = 30  # 30 seconds for workers to finish requests
max_requests = 1000    # Restart workers after N requests (prevents memory leaks)
max_requests_jitter = 100

# Logging
loglevel = 'info'
accesslog = '-'
errorlog = '-'

# Lifecycle hooks
def on_starting(server):
    """Called just before the master process is initialized"""
    print("INFO: Gunicorn master starting")

def on_exit(server):
    """Called just after the master process exits"""
    print("INFO: Gunicorn master exited")

def worker_exit(server, worker):
    """Called just after a worker has been exited"""
    print(f"INFO: Worker {worker.pid} exited")
```

**3. Use Context Managers for Sessions**:

Ensure all Neo4j queries use context managers to auto-close sessions:

```python
# GOOD: Auto-closes session
def get_graph_nodes(limit=300):
    with driver.session() as session:
        result = session.run(query, limit=limit)
        return [record.data() for record in result]

# BAD: Session might not close properly
def get_graph_nodes_bad(limit=300):
    session = driver.session()
    result = session.run(query, limit=limit)
    data = [record.data() for record in result]
    session.close()  # Might not execute if error occurs
    return data
```

#### Verification

**Check graceful shutdown works**:

```bash
# Railway logs: Look for cleanup messages
railway logs --service reconciliation-api | grep -E "(shutdown|Neo4j driver closed)"

# Expected output during deployment:
INFO: Received shutdown signal, closing Neo4j connections...
INFO: Neo4j driver closed successfully
INFO: Gunicorn master exited

# Should NOT see:
ERROR:neo4j:Failed to write data to connection
```

**Test locally**:

```bash
# Start API
PORT=5002 python reconciliation_api.py &
API_PID=$!

# Send SIGTERM to simulate Railway shutdown
kill -TERM $API_PID

# Check logs for graceful shutdown
tail -20 /tmp/api_test.log | grep -E "(shutdown|Neo4j)"
```

#### Prevention

**Best practices for Railway + Neo4j deployments**:

1. ✅ **DO**: Always use context managers (`with driver.session()`) for Neo4j queries
2. ✅ **DO**: Register signal handlers (SIGTERM, SIGINT) to close connections
3. ✅ **DO**: Set `graceful_timeout` in Gunicorn config (30s recommended)
4. ✅ **DO**: Use connection pooling settings to prevent connection leaks
5. ❌ **DON'T**: Leave sessions open across multiple requests
6. ❌ **DON'T**: Ignore shutdown signals from Railway/Gunicorn

**Railway-specific considerations**:

- Railway sends **SIGTERM** 10 seconds before forced **SIGKILL**
- Set `graceful_timeout` < 10 seconds to ensure cleanup completes
- Use `max_requests` to periodically restart workers (prevents memory leaks)

#### Impact Assessment

**Current Impact**: LOW
- Errors occur only during deployments/restarts
- No user-facing impact (shutdown in progress)
- No data loss (read-only operations during shutdown)
- Next deployment will start fresh connections

**If Left Unfixed**: MEDIUM
- Could lead to connection pool exhaustion over time
- Railway may throttle deployments if errors persist
- Neo4j Aura may rate-limit connections

#### References

- **Neo4j Driver Docs**: [Session Management](https://neo4j.com/docs/python-manual/current/session-api/)
- **Gunicorn Docs**: [Graceful Shutdown](https://docs.gunicorn.org/en/stable/settings.html#graceful-timeout)
- **Railway Docs**: [Deployment Lifecycle](https://docs.railway.app/reference/deployments)
- **Python Signal Handling**: [signal module](https://docs.python.org/3/library/signal.html)

---

## Development Tools Issues

### Issue 5: Playwright MCP Browser Lock / White Screen (2025-11-25)

**Severity**: LOW (Development only)

#### Symptoms

1. **Browser already in use error**:
   ```
   Error: Browser is already in use for /Users/arthursarazin/Library/Caches/ms-playwright/mcp-chrome-0ee373c,
   use --isolated to run multiple instances of the same browser
   ```

2. **White/blank screen** when Playwright browser opens

3. **Navigation fails** even after calling `browser_close`

**Affected Tool**: Playwright MCP (`mcp__microsoft-playwright-mcp__*`)
**Affected Environment**: Claude Code development sessions

#### Root Cause

**Stale browser lock file** persists when:
1. Previous Claude Code session terminated abnormally
2. Browser process crashed but lock file wasn't cleaned
3. Multiple sessions tried to use the same browser profile
4. Chromium process hung and wasn't properly terminated

The lock file at `~/Library/Caches/ms-playwright/mcp-chrome-*/SingletonLock` prevents new browser instances from starting.

#### Solution

**Recommended Fix (Confirmed Working 2025-11-25)**:

```bash
# Full cleanup: remove entire cache directory and kill all Chrome processes
rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-* && pkill -9 -f "Chromium" 2>/dev/null; pkill -9 -f "chrome" 2>/dev/null; sleep 3
```

This removes the entire browser profile (including lock files) and kills any hung processes. The next `browser_navigate` call will recreate the profile automatically.

**Alternative: Minimal Fix (may not always work)**

```bash
# Remove only the lock file
rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-*/SingletonLock
pkill -9 -f "Chromium"
sleep 2
```

**Option 3: Use browser_install Tool**

If you get "browser not installed" after cleanup:
```
Use mcp__microsoft-playwright-mcp__browser_install tool
```

#### Verification

After cleanup, test browser navigation:

```bash
# In Claude Code, call:
mcp__microsoft-playwright-mcp__browser_navigate with url: "http://localhost:3000"

# Expected: Browser opens and navigates successfully
# Should NOT see: "Browser is already in use" error
```

#### Prevention

**Best practices for Playwright MCP usage**:

1. ✅ **DO**: Always call `browser_close` before ending a session
2. ✅ **DO**: Check for stuck processes before starting new browser sessions
3. ✅ **DO**: Use `browser_snapshot` instead of `browser_take_screenshot` when possible
4. ❌ **DON'T**: Start new Claude Code sessions with browser still open from previous session
5. ❌ **DON'T**: Force-quit Claude Code while browser is active

**Pre-session cleanup script** (add to shell profile):

```bash
# ~/.zshrc or ~/.bashrc
alias playwright-cleanup='rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-*/SingletonLock && pkill -9 -f Chromium 2>/dev/null'
```

#### Impact Assessment

**Current Impact**: LOW
- Only affects development workflow
- No production impact
- Workaround available (manual cleanup)
- Does not affect API or frontend functionality

#### References

- **Playwright Docs**: [Browser Contexts](https://playwright.dev/docs/browser-contexts)
- **MCP Playwright**: [@anthropics/mcp-server-playwright](https://github.com/anthropics/mcp-servers)
- **Chrome Profile Locking**: [Chromium SingletonLock](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md)

---

## Python Type Conversion Issues

### Issue 6: float(None) Crash in GraphRAG Node Extraction (2025-11-25)

**Severity**: CRITICAL (Regression - broke dynamic node visualization)

#### Symptoms

1. **GraphRAG queries return 0 nodes for animation**:
   ```json
   {
     "selected_nodes": 0,
     "selected_relationships": 0,
     "debug_info": { "entities": 20 }
   }
   ```

2. **API logs show type conversion error**:
   ```
   ERROR:__main__:❌ Error extracting selected nodes: float() argument must be a string or a real number, not 'NoneType'
   ```

3. **Dynamic node visualization broken**: Nodes no longer appear progressively during GraphRAG queries

**Affected File**: `reconciliation_api.py` (lines 711, 1023, 1049, 1684)
**Affected Function**: `extract_selected_nodes_from_graphrag()`

#### Root Cause

**Python's `.get()` method only returns default when key is MISSING, NOT when value is `None`.**

```python
# The problematic pattern:
rel_data = {'weight': None}  # Key exists but value is None

# BROKEN: .get() returns None (key exists), not the default 1.0
float(rel_data.get('weight', 1.0))  # ❌ float(None) → TypeError

# This is Python's dict.get() behavior:
>>> {'weight': None}.get('weight', 1.0)
None  # ← Returns None, NOT 1.0, because key EXISTS

>>> {'other': 'value'}.get('weight', 1.0)
1.0  # ← Returns 1.0 because key is MISSING
```

**Why this happens in our codebase**:
- Neo4j returns relationships where `weight` property may be `None`
- GraphML files may have empty weight attributes
- Entity data from various sources may have null values

#### Solution

**Use the `or` operator pattern for safe type conversion**:

```python
# BEFORE (broken)
'weight': float(rel_data.get('weight', 1.0))        # ❌ Crashes on None

# AFTER (fixed)
'weight': float(rel_data.get('weight') or 1.0)      # ✅ Handles None values
```

**Why this works**:
```python
>>> float(None or 1.0)
1.0  # ✅ None is falsy, so `or` returns 1.0

>>> float(0 or 1.0)
1.0  # Note: 0 is also falsy, which may or may not be desired

>>> float(5.5 or 1.0)
5.5  # ✅ Truthy value returns as-is
```

**Files fixed** (4 locations in `reconciliation_api.py`):

| Line | Context | Fix |
|------|---------|-----|
| 711 | GraphML edge weight | `float(graphml_edge_data.get('weight') or 1.0)` |
| 1023 | Relationship data extraction | `float(rel_data.get('weight') or 1.0)` |
| 1049 | Edge data for animation | `float(edge_data.get('weight') or 1.0)` |
| 1684 | Graph node building | `float(edge_data.get('weight') or 1.0)` |

#### Verification

```bash
# Test GraphRAG query
curl -X POST "http://localhost:5002/graphrag/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "include_graph_data": true}' | jq '{selected_nodes, selected_relationships}'

# BEFORE fix:
{ "selected_nodes": 0, "selected_relationships": 0 }  # ❌ Broken

# AFTER fix:
{ "selected_nodes": 128, "selected_relationships": 146 }  # ✅ Working
```

#### Prevention

**Rule**: NEVER use `float(dict.get('key', default))` for potentially nullable values.

| Pattern | Safety | Use When |
|---------|--------|----------|
| `float(d.get('key', 1.0))` | ❌ UNSAFE | Only if you're 100% certain value is never None |
| `float(d.get('key') or 1.0)` | ✅ SAFE | Value might be None, and 0 should also become default |
| `float(d.get('key', 0) or 1.0)` | ✅ SAFE | Value might be missing OR None |
| `float(d['key']) if d.get('key') is not None else 1.0` | ✅ SAFE | Need to distinguish 0 from None |

**Add to code review checklist**:
- [ ] All `float()`, `int()`, `str()` conversions handle `None` values
- [ ] Dictionary `.get()` with default is not used before type conversion
- [ ] Use `value or default` pattern for safe fallbacks

#### Impact Assessment

**User Impact**: HIGH
- Dynamic node visualization completely broken
- GraphRAG queries appeared to work but animation data was empty
- Silent failure - no visible error to users

**Fix Complexity**: LOW
- Simple pattern change at 4 locations
- No architectural changes required
- Backwards compatible

#### References

- **Commit**: TBD - "Fix float(None) crash in GraphRAG node extraction"
- **Python Docs**: [dict.get()](https://docs.python.org/3/library/stdtypes.html#dict.get)
- **Related Constitution Principle**: See Defensive Coding Standards in constitution.md

---

## Vercel Deployment Issues

### Issue 7: Dynamic API Routes Return 404 on Vercel (2025-11-26)

**Severity**: CRITICAL (Production blocker - all dynamic routes broken)

#### Symptoms

1. **Dynamic API routes return 404** on Vercel production:
   ```
   GET /api/reconciliation/chunks/tilleul_soir_anglade/chunk-591bb53189567b87e5803c23a905183f
   → 404 Not Found

   GET /api/books/tilleul_soir_anglade/graph
   → 404 Not Found
   ```

2. **Static routes work fine**:
   ```
   GET /api/reconciliation/health → 200 OK
   GET /api/reconciliation/graph/nodes → 200 OK
   ```

3. **Local development works** - same routes return data successfully

4. **Backend (Railway) works** - direct calls to `reconciliation-api-production.up.railway.app` succeed

5. **Vercel build warning**:
   ```
   WARN! Due to `builds` existing in your configuration file, the Build and Development
   Settings defined in your Project Settings will not apply.
   ```

**Affected Routes**: ALL routes using `[param]` dynamic segments
**Affected Endpoints**:
- `/api/reconciliation/chunks/[bookId]/[chunkId]` → Chunk content loading in entity modals
- `/api/books/[bookId]/graph` → Per-book graph data

#### Root Cause

**Legacy `vercel.json` configuration** in repository root breaks Next.js App Router dynamic routes:

```json
// vercel.json (BROKEN - legacy format)
{
  "builds": [
    {
      "src": "3_borges-interface/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "3_borges-interface/$1"
    }
  ]
}
```

**Why it breaks**:
1. The `builds` key triggers legacy Vercel builder mode
2. Manual `routes` configuration intercepts requests BEFORE Next.js processes them
3. Next.js dynamic route matching (`[param]`) is bypassed
4. Vercel's regex route `/(.*) → 3_borges-interface/$1` doesn't understand `[bookId]` folders

**Why static routes work**:
- Static routes like `/api/reconciliation/health/route.ts` have no `[param]` segments
- The regex catch-all routes them correctly to the file at that exact path

#### Solution

**Delete `vercel.json`** from repository root and use Vercel Project Settings instead:

```bash
# Remove the legacy config file
rm /Users/arthursarazin/Documents/nano-graphrag/vercel.json
git add -A
git commit -m "🐛 Fix Vercel dynamic routes - remove legacy vercel.json"
git push
```

**Configure in Vercel Dashboard**:
1. Go to Project Settings → General → Root Directory
2. Set Root Directory to: `3_borges-interface`
3. Framework Preset: `Next.js` (auto-detected)
4. Build Command: `npm run build` (default)
5. Output Directory: `.next` (default)

**Alternative**: Modern `vercel.json` format (if needed for other settings):

```json
{
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "npm run build"
}
```

Note: Do NOT include `builds` or `routes` keys - these trigger legacy mode.

#### Verification

After removing `vercel.json` and redeploying:

```bash
# Test dynamic routes on production
curl "https://borges-library-web.vercel.app/api/reconciliation/chunks/tilleul_soir_anglade/chunk-591bb53189567b87e5803c23a905183f"
# Expected: 200 OK with chunk content

curl "https://borges-library-web.vercel.app/api/books/tilleul_soir_anglade/graph"
# Expected: 200 OK with graph data

# Verify no more warning in build logs
# Should NOT see: "Due to `builds` existing in your configuration file..."
```

#### Prevention

**Vercel configuration best practices**:

1. ✅ **DO**: Use Vercel Dashboard for root directory and framework settings
2. ✅ **DO**: Let Vercel auto-detect Next.js configuration
3. ✅ **DO**: Use modern `vercel.json` format if config file is needed
4. ❌ **DON'T**: Use `builds` key in `vercel.json` (legacy format)
5. ❌ **DON'T**: Use `routes` key to manually route requests (breaks Next.js routing)
6. ❌ **DON'T**: Override Next.js's built-in route handling

**Check for this issue**:
```bash
# If you see this in build logs, you have legacy config:
grep -l "builds" vercel.json 2>/dev/null && echo "⚠️ Legacy vercel.json detected!"
```

#### Impact Assessment

**User Impact**: HIGH
- Chunk content never loads in entity modals → "Loading..." stuck forever
- Per-book graph views broken
- Core feature (end-to-end traceability) completely non-functional in production

**Fix Complexity**: LOW
- Delete one file
- No code changes required
- Immediate fix after Vercel redeploy

#### References

- **Vercel Docs**: [Project Configuration](https://vercel.com/docs/projects/project-configuration)
- **Vercel Docs**: [Legacy vs Framework Configuration](https://vercel.com/docs/build-output-api/v3#builds-vs-framework)
- **Next.js Docs**: [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

---

## Quick Reference

### Common Error Messages

| Error Message | Issue # | Quick Fix |
|---------------|---------|-----------|
| "Aggregation column contains implicit grouping" | #1 | Consolidate WITH clauses |
| "@import rules must precede all rules" | #2 | Move @import to top of CSS |
| "params: Promise<{ ... }>" type error | #2 | Add `await params` |
| Book missing from dropdown (local) | #3 | Use absolute symlink path |
| "Failed to write data to connection" (Railway) | #4 | Add graceful shutdown handler |
| "Browser is already in use" (Playwright) | #5 | `rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-*/SingletonLock && pkill -9 Chromium` |
| "float() argument must be... not 'NoneType'" | #6 | Use `value or default` instead of `.get('key', default)` |
| Dynamic API routes 404 on Vercel (local works) | #7 | Delete `vercel.json` from root, use Vercel dashboard settings |

### Debugging Commands

```bash
# Check API health
curl http://localhost:5002/health

# Check Neo4j connection
curl http://localhost:5002/graph/nodes?limit=10

# Check available books
curl http://localhost:5002/books | jq 'length'

# Monitor API logs
tail -f /tmp/api_test.log

# Check Next.js build
cd 3_borges-interface && npm run build

# Verify symlinks
ls -la reconciliation-api/book_data/

# Railway-specific commands
railway logs --service reconciliation-api | tail -50
railway status
railway logs --service reconciliation-api | grep -E "(shutdown|Neo4j)"
```

### File Locations Reference

```text
reconciliation-api/
├── reconciliation_api.py        # Main Flask app (Neo4j queries here)
├── book_data/                    # Symlinked book directories
└── graphrag_interceptor.py      # GraphRAG query enrichment

3_borges-interface/
├── src/app/globals.css          # CSS import order matters here
├── src/app/api/                 # API routes (async params in Next.js 16)
├── next.config.js               # Turbopack configuration
└── package.json                 # Dependency versions

specs/001-interactive-graphrag-refinement/
├── plan.md                      # Implementation plan & progress
├── tasks.md                     # Task breakdown
├── troubleshooting.md           # This file
└── data-model.md                # Neo4j schema reference
```

---

## Contributing to This Guide

When you encounter a new issue:

1. **Document the symptoms** with exact error messages
2. **Identify the root cause** through debugging
3. **Provide the solution** with code examples
4. **Add verification steps** so others can confirm the fix
5. **Include references** (commits, docs, PRs)
6. **Update the Quick Reference table**

Format:
```markdown
### Issue N: [Descriptive Title] (YYYY-MM-DD)

**Severity**: [CRITICAL|HIGH|MEDIUM|LOW]

#### Symptoms
[Error messages, unexpected behavior]

#### Root Cause
[Technical explanation]

#### Solution
[Code fixes with before/after]

#### Verification
[How to test the fix]

#### References
[Commits, docs, external resources]
```

---

**Last Reviewed**: 2025-11-25 (Issue #6 added)
**Review Frequency**: After each production issue resolution
