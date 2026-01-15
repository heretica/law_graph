# Quickstart: RAG Observability Comparison

**Feature**: 003-rag-observability-comparison
**Date**: 2025-12-23

Get up and running with the RAG comparison system in 5 minutes.

---

## Prerequisites

- Python 3.11+
- Access to Dust API (API key provided)
- Access to GraphRAG API (Railway deployment)
- OPIK account with "law_graphRAG" project

---

## 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install opik aiohttp python-dotenv
```

---

## 2. Configure Environment

Create a `.env` file in your project root:

```bash
# Dust Configuration
DUST_API_KEY=sk-05f2716408b598265e45af33c122d02e
DUST_WORKSPACE_ID=your_workspace_id  # Get from Dust dashboard
DUST_AGENT_ID=beTfWHdTC6

# GraphRAG Configuration
GRAPHRAG_API_URL=https://reconciliation-api-production.up.railway.app

# OPIK Configuration
OPIK_API_KEY=PoW5aZXyT2CsSIEoSvBBN4eTU
OPIK_PROJECT_NAME=law_graphRAG
OPIK_DATASET_NAME=civic-law-eval
```

---

## 3. Run Your First Experiment

```python
import asyncio
from dotenv import load_dotenv
import os

# Load configuration
load_dotenv()

# Import comparison components
from rag_comparison import ExperimentRunner, DustClient, GraphRAGClient
from opik.evaluation.metrics import Contains, Equals

async def main():
    # Initialize clients
    dust = DustClient(
        api_key=os.getenv("DUST_API_KEY"),
        workspace_id=os.getenv("DUST_WORKSPACE_ID"),
        agent_id=os.getenv("DUST_AGENT_ID")
    )

    graphrag = GraphRAGClient(
        api_url=os.getenv("GRAPHRAG_API_URL")
    )

    # Create experiment runner
    runner = ExperimentRunner(
        dust_client=dust,
        graphrag_client=graphrag,
        opik_api_key=os.getenv("OPIK_API_KEY"),
        project_name=os.getenv("OPIK_PROJECT_NAME")
    )

    # Run comparison experiment
    result = await runner.run_experiment(
        dataset_name="civic-law-eval",
        experiment_name="quick-comparison-test",
        metrics=[
            Contains(case_sensitive=False),
            Equals()
        ],
        sample_size=5  # Start small for testing
    )

    # Print summary
    print(f"Experiment completed: {result.experiment_name}")
    print(f"Questions evaluated: {result.question_count}")
    print(f"\nDust metrics:")
    print(f"  Success rate: {result.dust_metrics.success_rate:.1%}")
    print(f"  Avg latency: {result.dust_metrics.avg_latency_ms:.0f}ms")
    print(f"\nGraphRAG metrics:")
    print(f"  Success rate: {result.graphrag_metrics.success_rate:.1%}")
    print(f"  Avg latency: {result.graphrag_metrics.avg_latency_ms:.0f}ms")
    print(f"\nView results: {result.get_opik_url()}")

# Run
asyncio.run(main())
```

---

## 4. View Results in OPIK Dashboard

1. Navigate to [Comet OPIK](https://www.comet.com/opik)
2. Open project "law_graphRAG"
3. Find your experiment in the Experiments tab
4. Compare Dust vs GraphRAG scores side-by-side

---

## 5. Customize Metrics

Add more heuristic metrics:

```python
from opik.evaluation.metrics import Contains, Equals, RegexMatch, LevenshteinRatio

metrics = [
    Contains(case_sensitive=False),     # Substring match
    Equals(),                            # Exact match
    RegexMatch(regex="^[A-Z].*"),       # Starts with capital
    LevenshteinRatio(),                  # Fuzzy similarity
]
```

Add latency tracking:

```python
from rag_comparison.metrics import LatencyMetric, StatusMetric

metrics.extend([
    LatencyMetric(),
    StatusMetric()
])
```

---

## 6. Run Full Dataset Evaluation

```python
# Remove sample_size limit for full evaluation
result = await runner.run_experiment(
    dataset_name="civic-law-eval",
    experiment_name="full-comparison-v1",
    metrics=metrics,
    parallel_workers=8  # Adjust for your rate limits
)
```

---

## Common Issues

### "Workspace ID not found"
- Get your Dust workspace ID from the Dust dashboard URL
- Format: `https://dust.tt/w/{workspace_id}/...`

### "Rate limit exceeded"
- Reduce `parallel_workers` in experiment config
- Add delays between requests if needed

### "Connection timeout"
- Check that GraphRAG API is accessible
- Try: `curl https://reconciliation-api-production.up.railway.app/health`

### "Dataset not found"
- Verify "civic-law-eval" exists in your OPIK project
- Create it with: `client.get_or_create_dataset(name="civic-law-eval")`

---

## Next Steps

1. **Add questions to dataset**: Populate "civic-law-eval" with civic law Q&A pairs
2. **Create custom metrics**: Implement domain-specific evaluation logic
3. **Automate experiments**: Set up scheduled comparison runs
4. **Track over time**: Compare experiment results across versions

---

## File Structure

After implementation, your project will have:

```
rag_comparison/
├── __init__.py
├── clients/
│   ├── dust_client.py      # Dust API client
│   └── graphrag_client.py  # GraphRAG API client
├── metrics/
│   ├── latency.py          # Latency metric
│   └── status.py           # Success/failure metric
├── runner.py               # ExperimentRunner
└── config.py               # Configuration handling

scripts/
├── run_experiment.py       # CLI entry point
└── setup_dataset.py        # Dataset population helper
```
