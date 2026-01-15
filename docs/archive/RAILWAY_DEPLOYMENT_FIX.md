# Railway Deployment Fix: Railpack Build Error Resolution

## Problem
Both Railway services were failing with:
```
Build › Build image
(00:01)
Error creating build plan with Railpack
```

## Root Cause
- Railway's Railpack builder was having issues with complex Python dependency combinations
- `nano-graphrag` and related ML libraries have complex build requirements
- NIXPACKS builder configuration was causing detection failures

## Solution

### 1. Reconciliation API (`reconciliation-api`)
Already configured correctly:
- `railway.toml`: `builder = "DOCKERFILE"`
- `Dockerfile`: Explicit Python 3.11-slim with proper dependency installation
- Status: ✅ Ready for deployment

### 2. Borges Graph / GraphRAG API (`graphrag-api`)
**Changes Made**:
- Modified `railway.toml`: `NIXPACKS` → `DOCKERFILE`
- Created explicit `Dockerfile` for FastAPI application
- Status: ✅ Ready for deployment

## Files Modified

### graphrag-api/railway.toml
```toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "uvicorn app:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
```

### graphrag-api/Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Deployment Status

### Reconciliation API
- Repository: https://github.com/ArthurSrz/reconciliation-api
- Latest commit: `8d57965` 🔍 Add sequential multi-book GraphRAG query endpoint
- Status: ✅ Pushed to GitHub, ready for Railway deployment

### Borges Graph API
- Repository: https://github.com/ArthurSrz/borges_graph
- Latest commit: `2e6966a` 🐳 Fix Railway builds: switch to DOCKERFILE builder
- Status: ✅ Pushed to GitHub, ready for Railway deployment

## Next Steps

1. **Trigger Manual Redeploy on Railway**
   - Go to Railway dashboard
   - Select each service (reconciliation-api and borges_graph)
   - Click "Trigger Deploy"
   - Monitor build logs

2. **Verify Deployments**
   - Check service URLs are responding
   - Test `/health` endpoints
   - Verify multi-book query endpoint is accessible

3. **Monitor Logs**
   - Check Railway logs for any runtime errors
   - Verify database connections (Neo4j)
   - Confirm Google Drive data loading

## Technical Details

### Why Dockerfile Over Railpack
- **Explicit control**: Direct control over dependencies and build steps
- **Reproducible**: Same build locally and on Railway
- **Faster iterations**: No detection/planning overhead
- **Better debugging**: Full control over pip installation flags

### Key Build Flags
- `--no-cache-dir`: Reduces image size
- `--upgrade pip setuptools wheel`: Ensures latest tools for building wheels
- Python 3.11-slim: Minimal base image with needed headers for compilation

## Testing After Deployment

### Test Reconciliation API
```bash
curl -X GET https://reconciliation-api-production.up.railway.app/stats
```

### Test GraphRAG API  
```bash
curl -X GET https://borgesgraph-production.up.railway.app/health
```

### Test Multi-Book Query
```bash
curl -X POST https://reconciliation-api-production.up.railway.app/query/multi-book \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Qu'\''est-ce que l'\''alpinisme ?",
    "mode": "global",
    "debug_mode": true
  }'
```

## Related Issues
- Both services depend on complex ML libraries (transformers, graspologic, etc.)
- Google Drive data download happens on first query
- Neo4j connection required for reconciliation API

## Documentation
See `MULTI_BOOK_QUERY_IMPLEMENTATION.md` for the feature that these services support.

---

**Fix Date**: November 9, 2024
**Status**: Ready for Railway redeployment
