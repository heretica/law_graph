# Research: RAG Observability Comparison

**Feature**: 003-rag-observability-comparison
**Date**: 2025-12-23

## 1. Dust API Integration

### Decision: Use Dust Conversations API with Server-Sent Events

**Endpoint Structure**:
```
POST https://dust.tt/api/v1/w/{workspaceId}/assistant/conversations
```

**Authentication**:
```
Authorization: Bearer sk-05f2716408b598265e45af33c122d02e
Content-Type: application/json
```

**Request Body** (inferred from documentation):
```json
{
  "message": "Your civic law question here",
  "agent_id": "beTfWHdTC6"
}
```

**Response Handling**:
- Dust uses Server-Sent Events (SSE) for streaming
- Key events: `generation_tokens` (streaming text), `agent_message_success` (completion)
- Must aggregate token events to form complete response

**Rationale**: The Conversations API is the standard way to interact with Dust agents. The agent ID "beTfWHdTC6" is passed directly in the request body.

**Alternatives Considered**:
- Dust Apps API: Deprecated as of October 2025
- JavaScript SDK (@dust-tt/sdk): Python implementation preferred for OPIK integration

### Technical Note: Workspace ID

The Dust API key format `sk-*` requires a workspace ID in the URL path. This needs to be provided as configuration or extracted from the Dust dashboard. The workspace ID is a separate identifier from the API key.

---

## 2. GraphRAG API Integration

### Decision: Use existing `/query` endpoint

**Endpoint**: `POST https://reconciliation-api-production.up.railway.app/query`

**Request Body**:
```json
{
  "query": "Civic law question",
  "mode": "local",
  "book_id": "optional_book_id"
}
```

**Response Structure**:
```json
{
  "success": true,
  "query": "Original query",
  "answer": "GraphRAG response text",
  "context": {"mode": "local"},
  "timestamp": "2025-12-23T10:00:00Z",
  "query_id": "provenance_id"
}
```

**Key Fields for Comparison**:
- `answer`: The response text to compare against Dust
- `processing_time`: Internal timing (if returned in `graphrag_data`)

**Rationale**: The existing `/query` endpoint already provides structured responses with answer text suitable for comparison.

**Alternatives Considered**:
- `/query/multi-book`: For cross-book queries (not needed for single dataset evaluation)
- Direct nano-graphrag integration: Adds complexity without benefit

---

## 3. OPIK SDK Integration

### Decision: Use OPIK Python SDK with heuristic metrics

**Connection**:
```python
import opik
opik.configure(api_key="PoW5aZXyT2CsSIEoSvBBN4eTU")
client = opik.Opik()
```

**Dataset Loading**:
```python
dataset = client.get_dataset(name="civic-law-eval")
items = dataset.get_items()  # Returns list of {"input": "...", "expected_output": "..."}
```

**Experiment Execution**:
```python
from opik.evaluation import evaluate
from opik.evaluation.metrics import Contains, RegexMatch, Equals

result = evaluate(
    dataset=dataset,
    task=evaluation_task,
    scoring_metrics=[Contains(case_sensitive=False), Equals()],
    experiment_name="dust-vs-graphrag-v1",
    project_name="law_graphRAG"
)
```

**Custom Metric for Latency**:
```python
from opik.evaluation.metrics import BaseMetric, ScoreResult

class LatencyMetric(BaseMetric):
    def score(self, output: str, latency_ms: float = 0, **kwargs) -> ScoreResult:
        return ScoreResult(
            name="latency_ms",
            value=latency_ms,
            reason=f"Response time: {latency_ms}ms"
        )
```

**Rationale**: OPIK provides built-in heuristic metrics (Contains, Equals, RegexMatch) that don't require LLM-as-judge overhead. Custom metrics can track latency.

**Alternatives Considered**:
- LLM-as-judge metrics: Higher cost, slower execution
- Manual evaluation: Not scalable
- MLflow: OPIK specifically designed for LLM evaluation

---

## 4. Parallel Execution Strategy

### Decision: Use asyncio with concurrent API calls

**Rationale**: To ensure fair latency comparison, both Dust and GraphRAG must be queried simultaneously for each question.

**Implementation Pattern**:
```python
import asyncio
import aiohttp
import time

async def query_both_systems(question: str):
    start_time = time.perf_counter()

    async with aiohttp.ClientSession() as session:
        dust_task = asyncio.create_task(query_dust(session, question))
        graphrag_task = asyncio.create_task(query_graphrag(session, question))

        dust_result, graphrag_result = await asyncio.gather(
            dust_task, graphrag_task, return_exceptions=True
        )

    return {
        "dust": dust_result,
        "graphrag": graphrag_result,
        "dust_latency": dust_result.get("latency_ms"),
        "graphrag_latency": graphrag_result.get("latency_ms")
    }
```

**Alternatives Considered**:
- Sequential calls: Unfair latency comparison due to network variance
- ThreadPoolExecutor: asyncio more appropriate for I/O-bound HTTP calls

---

## 5. Heuristic Metrics Selection

### Decision: Use Contains as primary metric, with optional Equals and RegexMatch

**Primary Metric - Contains**:
```python
Contains(case_sensitive=False)
```
- Checks if expected answer keywords appear in response
- Handles paraphrased answers well
- Score: 1 (contains) or 0 (doesn't contain)

**Secondary Metrics**:
- `Equals()`: Exact match (strict, rarely passes)
- `RegexMatch(regex="^...")`: Pattern validation for legal citations
- `LevenshteinRatio()`: Fuzzy string matching (0-1 scale)

**Rationale**: "Contains" is ideal for RAG comparison because it tests whether key information is present without requiring exact wording.

**Alternatives Considered**:
- ROUGE/BLEU: More suited for translation/summarization
- BERTScore: Adds complexity and computational cost

---

## 6. LLM-as-Judge Metric (OpenAI)

### Decision: Use OpenAI Chat Completions API for semantic precision scoring

**Rationale**: Heuristic metrics (Contains, RegexMatch) only catch surface-level matches. For legal precision evaluation, we need semantic understanding to determine if an answer is correct even when phrased differently.

**Endpoint**:
```
POST https://api.openai.com/v1/chat/completions
```

**Authentication**:
```
Authorization: Bearer {OPENAI_API_KEY}
Content-Type: application/json
```

**Recommended Model**: `gpt-4o-mini` (cost-effective for evaluation, still strong reasoning)

**Request Body**:
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a legal precision evaluator. Given a legal question, an expected answer, and a RAG system response, score how precisely the response answers the question on a scale of 0 to 1. Consider: (1) factual accuracy, (2) completeness, (3) legal reasoning quality. Respond with JSON: {\"score\": 0.X, \"reasoning\": \"...\"}"
    },
    {
      "role": "user",
      "content": "Question: {question}\n\nExpected Answer: {expected}\n\nRAG Response: {response}"
    }
  ],
  "temperature": 0,
  "response_format": {"type": "json_object"}
}
```

**Response Parsing**:
```python
import json

response_json = json.loads(completion.choices[0].message.content)
precision_score = response_json["score"]  # 0.0 to 1.0
reasoning = response_json["reasoning"]     # Explanation of the score
```

**Custom Metric Implementation**:
```python
from opik.evaluation.metrics import BaseMetric, ScoreResult
from opik.evaluation.models import LiteLLMChatModel
import json

class LLMPrecisionJudge(BaseMetric):
    """LLM-as-judge metric for semantic precision evaluation."""

    JUDGE_PROMPT = """You are a legal precision evaluator. Given a legal question, an expected answer, and a RAG system response, score how precisely the response answers the question.

Scoring criteria:
- 1.0: Perfectly accurate, complete, legally sound
- 0.8-0.9: Mostly accurate with minor omissions
- 0.5-0.7: Partially correct but missing key information
- 0.2-0.4: Relevant but contains inaccuracies
- 0.0-0.1: Incorrect or irrelevant

Respond with JSON: {"score": <0-1>, "reasoning": "<explanation>"}"""

    def __init__(self, model: str = "gpt-4o-mini"):
        self.model = LiteLLMChatModel(model=model, temperature=0)

    def score(
        self,
        output: str,
        input: str,
        expected_output: str = None,
        **ignored_kwargs
    ) -> ScoreResult:
        prompt = f"""Question: {input}

Expected Answer: {expected_output or 'Not provided'}

RAG Response: {output}"""

        try:
            response = self.model.generate_text(
                prompt=prompt,
                system_prompt=self.JUDGE_PROMPT
            )
            result = json.loads(response)
            return ScoreResult(
                name="llm_precision",
                value=float(result["score"]),
                reason=result["reasoning"]
            )
        except Exception as e:
            return ScoreResult(
                name="llm_precision",
                value=0.0,
                reason=f"Evaluation failed: {str(e)}"
            )
```

**Cost Estimation** (gpt-4o-mini @ $0.15/1M input, $0.60/1M output):
- Average prompt: ~500 tokens input, ~100 tokens output
- Per evaluation: ~$0.00008 + ~$0.00006 = ~$0.00014
- 50-question dataset with 2 systems: 100 evaluations ≈ $0.014

**Alternatives Considered**:
- `gpt-4o`: More accurate but 10x more expensive
- `gpt-3.5-turbo`: Cheaper but weaker legal reasoning
- Claude: Similar capability but adds another dependency
- Local models: No API cost but requires GPU and setup

---

## 7. Error Handling Strategy

### Decision: Record failures, continue experiment

**Pattern**:
```python
def safe_query(system_name: str, query_func, question: str):
    try:
        start = time.perf_counter()
        result = await query_func(question)
        latency = (time.perf_counter() - start) * 1000
        return {"answer": result, "latency_ms": latency, "status": "success"}
    except asyncio.TimeoutError:
        return {"answer": "", "latency_ms": 30000, "status": "timeout"}
    except Exception as e:
        return {"answer": "", "latency_ms": 0, "status": f"error: {str(e)}"}
```

**Rationale**: Experiments should complete even if one system fails for some questions. Failure data is still valuable for comparison.

---

## Resolved Unknowns Summary

| Unknown | Resolution |
|---------|------------|
| Dust API authentication | Bearer token in Authorization header |
| Dust agent specification | Pass `agent_id` in request body |
| Dust response extraction | Parse SSE `generation_tokens` events |
| GraphRAG endpoint | Use existing `/query` POST endpoint |
| OPIK dataset loading | `client.get_dataset(name="civic-law-eval")` |
| OPIK experiment API | `evaluate()` function with metrics list |
| Parallel execution | asyncio.gather() with aiohttp |
| Latency measurement | time.perf_counter() before/after requests |
| LLM-as-judge model | OpenAI `gpt-4o-mini` via LiteLLMChatModel |
| LLM judge prompt | Legal precision evaluator with 0-1 scoring |
| LLM judge integration | Custom BaseMetric subclass with JSON response parsing |
