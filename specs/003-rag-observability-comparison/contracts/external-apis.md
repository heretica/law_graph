# External API Contracts

**Feature**: 003-rag-observability-comparison
**Date**: 2025-12-23

This document defines the expected interfaces for external APIs consumed by the RAG comparison system.

---

## 1. Dust Conversations API

### Create Conversation & Send Message

```yaml
POST /api/v1/w/{workspaceId}/assistant/conversations
```

**Headers**:
```yaml
Authorization: Bearer {api_key}
Content-Type: application/json
Accept: text/event-stream
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workspaceId | string | Yes | Dust workspace identifier |

**Request Body**:
```json
{
  "message": "string",
  "agent_id": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | The user's question |
| agent_id | string | Yes | Agent identifier, e.g., "beTfWHdTC6" |

**Response**: Server-Sent Events (SSE) stream

**Event Types**:
```
event: generation_tokens
data: {"type": "generation_tokens", "text": "partial response..."}

event: agent_message_success
data: {"type": "agent_message_success", "message": {...}}

event: agent_error
data: {"type": "agent_error", "error": {"code": "...", "message": "..."}}
```

**Error Responses**:
| Status | Description |
|--------|-------------|
| 401 | Invalid or missing API key |
| 404 | Workspace or agent not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## 2. GraphRAG Query API

### Query Endpoint

```yaml
POST /query
Host: reconciliation-api-production.up.railway.app
```

**Headers**:
```yaml
Content-Type: application/json
```

**Request Body**:
```json
{
  "query": "string",
  "mode": "string",
  "book_id": "string"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| query | string | Yes | - | The question to ask |
| mode | string | No | "local" | Query mode: "local", "global", "naive" |
| book_id | string | No | "a_rebours_huysmans" | Book to query |

**Response Body** (200 OK):
```json
{
  "success": true,
  "query": "string",
  "answer": "string",
  "context": {
    "mode": "string"
  },
  "search_path": {
    "entities": [],
    "relations": [],
    "communities": []
  },
  "timestamp": "string (ISO 8601)",
  "query_id": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Request success status |
| query | string | Original query echoed back |
| answer | string | GraphRAG-generated response |
| context.mode | string | Query mode used |
| search_path | object | Graph traversal details (for provenance) |
| timestamp | string | Response timestamp |
| query_id | string | Provenance tracking ID |

**Error Response** (400):
```json
{
  "success": false,
  "error": "Query is required"
}
```

---

## 3. OPIK Python SDK Interfaces

### Dataset Interface

```python
from opik import Opik

client = Opik()

# Get dataset
dataset = client.get_dataset(name: str) -> Dataset

# Dataset methods
dataset.get_items(nb_samples: int = None) -> List[Dict]
dataset.to_pandas() -> pd.DataFrame
```

**Dataset Item Schema**:
```json
{
  "input": "string",
  "expected_output": "string",
  "metadata": {}
}
```

### Evaluation Interface

```python
from opik.evaluation import evaluate

result = evaluate(
    dataset: Dataset,
    task: Callable[[str, str], Dict],
    scoring_metrics: List[BaseMetric],
    experiment_name: str,
    project_name: str = None,
    verbose: int = 1,
    nb_samples: int = None,
    task_threads: int = 16,
    experiment_config: Dict = None
) -> EvaluationResult
```

**Task Function Signature**:
```python
def evaluation_task(
    input: str,                    # From dataset
    expected_output: str = None    # From dataset
) -> Dict:
    """
    Returns dict with keys expected by metrics:
    - "output": str (the LLM response)
    - "input": str (echoed)
    - "expected_output": str (echoed)
    - Custom keys for custom metrics
    """
```

### Metric Interfaces

```python
from opik.evaluation.metrics import BaseMetric, ScoreResult

class Contains(BaseMetric):
    def __init__(self, case_sensitive: bool = True): ...
    def score(self, output: str, reference: str) -> ScoreResult: ...

class RegexMatch(BaseMetric):
    def __init__(self, regex: str): ...
    def score(self, output: str) -> ScoreResult: ...

class Equals(BaseMetric):
    def score(self, output: str, reference: str) -> ScoreResult: ...
```

**ScoreResult Structure**:
```python
ScoreResult(
    name: str,      # Metric name
    value: float,   # Score (0-1 for heuristics)
    reason: str     # Explanation
)
```

---

## 4. Configuration Requirements

### Dust Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| DUST_API_KEY | Bearer token for authentication | sk-05f2716408b598265e45af33c122d02e |
| DUST_WORKSPACE_ID | Workspace identifier | (to be configured) |
| DUST_AGENT_ID | Agent to use for queries | beTfWHdTC6 |

### GraphRAG Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| GRAPHRAG_API_URL | API base URL | https://reconciliation-api-production.up.railway.app |
| GRAPHRAG_TIMEOUT | Request timeout in seconds | 30 |

### OPIK Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| OPIK_API_KEY | Comet API key | PoW5aZXyT2CsSIEoSvBBN4eTU |
| OPIK_PROJECT_NAME | Target project | law_graphRAG |
| OPIK_DATASET_NAME | Evaluation dataset | civic-law-eval |
