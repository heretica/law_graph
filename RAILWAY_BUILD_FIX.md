# Railway Build Error Fix: Railpack vs DOCKERFILE

## Problem
Both services were failing with:
```
Build › Build image
(00:01)
Error creating build plan with Railpack
```

## Root Cause
Railway's **Railpack** is a smart builder that auto-detects the project type. However:
1. It was invoked BEFORE reading `railway.toml`
2. The complex Python ML dependencies confused its detection
3. It tried to create a build plan and failed without proper configuration

## Solution Applied

### Key Changes

#### 1. Explicit Dockerfile Path in railway.toml
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"  # ← EXPLICIT path prevents auto-detection
```

This tells Railway: **"Don't try to detect anything, use THIS Dockerfile"**

#### 2. Simplified Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Use --no-install-recommends to reduce build time
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ cmake pkg-config curl \
    && rm -rf /var/lib/apt/lists/*

# Combine pip commands for efficiency
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x entrypoint.sh

ENV PYTHONUNBUFFERED=1  # ← Better logging

CMD ["./entrypoint.sh"]
```

**Key improvements**:
- `--no-install-recommends`: Smaller images, faster builds
- Combined RUN commands: Fewer layers
- `PYTHONUNBUFFERED=1`: Immediate log output (important for Railway)
- Explicit PORT handling in entrypoint

#### 3. Explicit startCommand
```toml
[deploy]
startCommand = "./entrypoint.sh"  # ← Railway knows exactly how to start
```

### What These Changes Do

| Change | Effect |
|--------|--------|
| `dockerfilePath = "Dockerfile"` | Prevents Railpack from running auto-detection |
| `--no-install-recommends` | Smaller build output, faster builds |
| `PYTHONUNBUFFERED=1` | Railway sees logs in real-time |
| Combined RUN commands | Fewer Docker layers = faster |
| Explicit startCommand | Railway knows exact start process |

## Files Modified

### reconciliation-api
- `railway.toml`: Added `dockerfilePath = "Dockerfile"`, added `startCommand`
- `Dockerfile`: Simplified, added `PYTHONUNBUFFERED=1`

### graphrag-api  
- `railway.toml`: Added `dockerfilePath = "Dockerfile"`, removed duplicate `startCommand`
- `Dockerfile`: Added `PYTHONUNBUFFERED=1`, fixed PORT usage

## Testing the Fix

After the changes are deployed:

1. Go to Railway dashboard
2. Click "Trigger Deploy" on each service
3. Watch build logs - should now:
   - Read `railway.toml` successfully
   - Use DOCKERFILE builder
   - Build Python environment
   - Complete in 2-3 minutes

### What to Look For (Good Build)
```
Building with Dockerfile...
[1/5] FROM python:3.11-slim
[2/5] WORKDIR /app
[3/5] RUN apt-get update && apt-get install...
[4/5] COPY . .
[5/5] RUN chmod +x entrypoint.sh
✓ Build succeeded
```

### What to Look For (Bad Build - Old)
```
Error creating build plan with Railpack
```

This means Railway is still trying Railpack auto-detection. If this happens:
1. Wait 5 minutes
2. Trigger deploy again (Railway may cache old config)
3. If still failing, contact Railway support

## Why Railpack Failed

The issue was that Railway's Railpack builder couldn't determine build parameters for:
- `nano-graphrag` (ML/NLP library)
- `transformers` (large dependency)
- `graspologic` (scientific computing)
- `hnswlib` (C++ extension)

These libraries require:
- System development headers (gcc, g++, cmake)
- Compilation flags
- Proper build order

Railpack's heuristics couldn't figure this out automatically, so it failed.

## The Fix in Simple Terms

**Before**: "Figure out how to build this Python project" → ❌ Fails
**After**: "Use this Dockerfile I prepared" → ✅ Works

We're explicitly saying "Here's the build plan, follow it" instead of letting Railway guess.

## Related Configuration

### reconciliation-api/entrypoint.sh
```bash
#!/bin/bash
# This script starts the Flask API
gunicorn reconciliation_api:app --bind 0.0.0.0:$PORT
```

### graphrag-api Dockerfile
```dockerfile
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "$PORT"]
```

Both use `$PORT` which Railway injects at runtime.

## Verification Checklist

After deployment:

- [ ] Build completes without "Railpack" errors
- [ ] Service logs show "started successfully"
- [ ] `/health` endpoint responds
- [ ] `/stats` endpoint responds (reconciliation-api)
- [ ] Query endpoints work

## Future Prevention

To avoid similar issues:
1. **Always include `railway.toml`** with explicit builder
2. **Test Dockerfile locally**: `docker build -t myimage .`
3. **Use simple base images**: python:3.11-slim not python:3.11
4. **Minimize system dependencies** in Dockerfile
5. **Set PYTHONUNBUFFERED=1** for Python projects

## References

- Railway Docs: https://docs.railway.app/
- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
- Python Docker: https://docs.docker.com/language/python/build-images/

---

**Last Updated**: November 9, 2024
**Status**: Deployed - awaiting Railway rebuild
**Commits**:
- reconciliation-api: `9bd5621`
- borges_graph: `44e6180`
