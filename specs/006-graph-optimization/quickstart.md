# Quickstart: Graph Performance Optimization

**Feature**: 006-graph-optimization
**Date**: 2025-12-25

## Performance Benchmarking Guide

This guide explains how to measure and validate the performance improvements.

---

## Prerequisites

1. **Browser DevTools**: Chrome/Firefox with Performance tab
2. **Terminal**: For backend measurements
3. **Network throttling**: Optional, for mobile simulation

---

## Benchmark 1: Startup Time

### What to Measure
Time from page navigation to first interactive graph.

### How to Measure

1. Open browser DevTools → Performance tab
2. Clear cache (DevTools → Application → Clear storage)
3. Start recording
4. Navigate to `http://localhost:3000`
5. Stop recording when graph is interactive (can rotate/zoom)

### Key Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| First Contentful Paint | ~2s | <1s |
| Time to Interactive | 11s | <3s |
| Total Blocking Time | ~7s | <1s |

### Where to Look
- DevTools Performance → Main thread flame chart
- Look for long tasks (>50ms) in gray
- Check for `setTimeout` calls in batching

---

## Benchmark 2: Query Response Time

### What to Measure
Time from query submission to answer display.

### How to Measure

```javascript
// Add to browser console before querying
const start = performance.now()
// Submit query via UI
// When answer appears:
console.log(`Query time: ${performance.now() - start}ms`)
```

### Test Cases

| Test Case | Baseline | Target |
|-----------|----------|--------|
| Single commune query | 15-30s | <10s |
| 5 communes query | 45-75s | <20s |
| 15 communes query | 120-195s | <30s |
| 50 communes (all) query | 300-500s | <90s |

### Network Tab Analysis
1. Open DevTools → Network tab
2. Filter by "law-graphrag"
3. Check timing breakdown:
   - Stalled: Should be <100ms (session pooling working)
   - Waiting (TTFB): Main optimization target
   - Content Download: Should be minimal

---

## Benchmark 3: Rendering Performance

### What to Measure
Frame rate during graph interaction.

### How to Measure

1. Open DevTools → Performance tab
2. Start recording
3. Rotate graph continuously for 5 seconds
4. Zoom in and out
5. Stop recording

### Key Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Average FPS | Variable (15-60) | >30fps stable |
| Frame drops | Frequent | <5% of frames |
| Long frames (>50ms) | Many | <10 total |

### React DevTools Analysis
1. Install React DevTools extension
2. Open Profiler tab
3. Start recording during interaction
4. Check component re-render frequency
5. Target: BorgesLibrary should NOT re-render on every frame

---

## Benchmark 4: Memory Usage

### What to Measure
Browser heap size during operation.

### How to Measure

1. Open DevTools → Memory tab
2. Take heap snapshot before loading
3. Navigate to app, let graph load
4. Take heap snapshot after load
5. Submit a query
6. Take heap snapshot after query

### Key Metrics
| State | Baseline | Target |
|-------|----------|--------|
| Initial load | ~100MB | <150MB |
| After query (15 communes) | ~300MB | <300MB |
| After 5 queries | ~400MB | <400MB |
| Maximum sustained | ~600MB | <500MB |

---

## Quick Validation Script

Run this in browser console to get quick metrics:

```javascript
// Performance Quick Check
const metrics = {
  startup: performance.getEntriesByType('navigation')[0]?.domInteractive,
  memory: performance.memory?.usedJSHeapSize / 1024 / 1024,
  fps: null
};

// FPS check (run during interaction)
let frameCount = 0;
let lastTime = performance.now();
function checkFPS() {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    metrics.fps = frameCount;
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(checkFPS);
}
checkFPS();

console.table(metrics);
```

---

## Backend Performance Check

### Server-Side Timing

Add to query for timing info:
```bash
curl -X POST http://localhost:8000/query \
  -H "X-Request-Start: $(date +%s%3N)" \
  -d '{"query": "test", "communes": ["rochefort"]}' \
  | jq '.timing'
```

### Check MAX_CONCURRENT Effect
```bash
# Watch concurrent queries
watch -n 1 "ps aux | grep python | grep -c query"
```

---

## Validation Checklist

Before marking optimization complete:

- [ ] Startup < 3s (fresh cache)
- [ ] Startup < 1s (cached)
- [ ] Single commune query < 10s
- [ ] 15 commune query < 30s
- [ ] FPS > 30 during rotation
- [ ] Memory < 500MB after 5 queries
- [ ] No console errors
- [ ] Graph still displays correctly
- [ ] Entity selection still works
- [ ] Answer panel still displays
- [ ] Debug info still available (RAG observability)

---

## Troubleshooting

### Startup Still Slow
- Check Network tab for large payloads
- Verify GraphML file is cached
- Check for hydration errors

### Query Still Slow
- Verify MAX_CONCURRENT is 6 (not 2)
- Check if LLM cache is working
- Monitor backend logs for timeouts

### FPS Drops
- Check React DevTools for re-renders
- Verify useMemo/useCallback applied
- Check for memory leaks

### Cache Not Working
- Verify Cache-Control header changed
- Check browser cache settings
- Test with incognito window
