# Internal Interfaces Contract

**Feature**: 003-rag-observability-comparison
**Date**: 2025-12-23

This document defines the internal interfaces for the RAG comparison system components.

---

## 1. RAG Client Protocol

Both Dust and GraphRAG clients must implement this protocol for consistent handling.

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

@dataclass
class QueryResult:
    """Standard result from any RAG system."""
    answer: str
    latency_ms: float
    status: str  # "success" | "timeout" | "error: {message}"
    raw_response: Optional[dict] = None

class RAGClient(ABC):
    """Abstract base class for RAG system clients."""

    @abstractmethod
    async def query(self, question: str) -> QueryResult:
        """
        Send a question to the RAG system.

        Args:
            question: The civic law question to ask

        Returns:
            QueryResult with answer, latency, and status
        """
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Check if the RAG system is available."""
        pass
```

---

## 2. Dust Client Interface

```python
class DustClient(RAGClient):
    """Client for Dust Conversations API."""

    def __init__(
        self,
        api_key: str,
        workspace_id: str,
        agent_id: str = "beTfWHdTC6",
        timeout: float = 30.0
    ): ...

    async def query(self, question: str) -> QueryResult:
        """
        Query Dust agent and collect SSE response.

        Handles:
        - SSE event stream parsing
        - Token aggregation into full response
        - Timeout after configured seconds
        - Error event handling
        """
        pass

    async def _parse_sse_stream(self, response) -> str:
        """Parse Server-Sent Events and aggregate tokens."""
        pass
```

---

## 3. GraphRAG Client Interface

```python
class GraphRAGClient(RAGClient):
    """Client for GraphRAG Reconciliation API."""

    def __init__(
        self,
        api_url: str = "https://reconciliation-api-production.up.railway.app",
        timeout: float = 30.0,
        default_mode: str = "local",
        default_book_id: Optional[str] = None
    ): ...

    async def query(
        self,
        question: str,
        mode: str = None,
        book_id: str = None
    ) -> QueryResult:
        """
        Query GraphRAG API.

        Args:
            question: The query text
            mode: Optional override for query mode
            book_id: Optional book scope

        Returns:
            QueryResult extracted from API response
        """
        pass
```

---

## 4. Experiment Runner Interface

```python
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from opik.evaluation.metrics import BaseMetric

@dataclass
class ComparisonResult:
    """Result of comparing both systems on one question."""
    question: str
    expected_answer: str
    dust_result: QueryResult
    graphrag_result: QueryResult
    dust_scores: Dict[str, float]
    graphrag_scores: Dict[str, float]

class ExperimentRunner:
    """Orchestrates comparison experiments."""

    def __init__(
        self,
        dust_client: DustClient,
        graphrag_client: GraphRAGClient,
        opik_api_key: str,
        project_name: str = "law_graphRAG"
    ): ...

    async def run_experiment(
        self,
        dataset_name: str,
        experiment_name: str,
        metrics: List[BaseMetric],
        parallel_workers: int = 8,
        sample_size: Optional[int] = None
    ) -> ExperimentResult:
        """
        Run a complete comparison experiment.

        Args:
            dataset_name: OPIK dataset to use (e.g., "civic-law-eval")
            experiment_name: Name for this experiment run
            metrics: List of metrics to compute
            parallel_workers: Concurrency for question processing
            sample_size: Optional limit on questions to evaluate

        Returns:
            ExperimentResult with aggregated scores
        """
        pass

    async def _evaluate_question(
        self,
        question: str,
        expected_answer: str,
        metrics: List[BaseMetric]
    ) -> ComparisonResult:
        """
        Evaluate a single question on both systems in parallel.
        """
        pass
```

---

## 5. Metrics Interface Extension

```python
from opik.evaluation.metrics import BaseMetric, ScoreResult

class LatencyMetric(BaseMetric):
    """Custom metric for tracking response latency."""

    def __init__(self, name: str = "latency_ms"):
        self._name = name

    def score(
        self,
        output: str,
        latency_ms: float = 0,
        **ignored_kwargs
    ) -> ScoreResult:
        return ScoreResult(
            name=self._name,
            value=latency_ms,
            reason=f"Response time: {latency_ms:.0f}ms"
        )

class StatusMetric(BaseMetric):
    """Custom metric for tracking success/failure status."""

    def score(
        self,
        output: str,
        status: str = "unknown",
        **ignored_kwargs
    ) -> ScoreResult:
        success = status == "success"
        return ScoreResult(
            name="status",
            value=1.0 if success else 0.0,
            reason=status
        )


class LLMPrecisionJudge(BaseMetric):
    """LLM-as-judge metric for semantic precision evaluation.

    Uses an external language model to evaluate whether a RAG response
    correctly answers a legal question, considering factual accuracy,
    completeness, and legal reasoning quality.
    """

    JUDGE_PROMPT = """You are a legal precision evaluator. Given a legal question,
an expected answer, and a RAG system response, score how precisely the response
answers the question.

Scoring criteria:
- 1.0: Perfectly accurate, complete, legally sound
- 0.8-0.9: Mostly accurate with minor omissions
- 0.5-0.7: Partially correct but missing key information
- 0.2-0.4: Relevant but contains inaccuracies
- 0.0-0.1: Incorrect or irrelevant

Respond with JSON: {"score": <0-1>, "reasoning": "<explanation>"}"""

    def __init__(
        self,
        model: str = "gpt-4o-mini",
        api_key: str = None,
        temperature: float = 0
    ):
        """
        Initialize the LLM judge.

        Args:
            model: OpenAI model to use (default: gpt-4o-mini)
            api_key: OpenAI API key (default: from OPENAI_API_KEY env var)
            temperature: Model temperature (default: 0 for deterministic)
        """
        self.model = model
        self.api_key = api_key
        self.temperature = temperature

    def score(
        self,
        output: str,
        input: str,
        expected_output: str = None,
        **ignored_kwargs
    ) -> ScoreResult:
        """
        Score a RAG response using the LLM judge.

        Args:
            output: The RAG system's response
            input: The original question
            expected_output: The expected/reference answer
            **ignored_kwargs: Additional kwargs (ignored)

        Returns:
            ScoreResult with precision score (0-1) and reasoning
        """
        pass

    async def ascore(
        self,
        output: str,
        input: str,
        expected_output: str = None,
        **ignored_kwargs
    ) -> ScoreResult:
        """Async version of score() for concurrent evaluation."""
        pass
```

---

## 6. Configuration Interface

```python
from dataclasses import dataclass
from typing import List

@dataclass
class ExperimentConfig:
    """Configuration for a comparison experiment."""

    # Dust settings
    dust_api_key: str
    dust_workspace_id: str
    dust_agent_id: str = "beTfWHdTC6"

    # GraphRAG settings
    graphrag_api_url: str = "https://reconciliation-api-production.up.railway.app"
    graphrag_mode: str = "local"
    graphrag_book_id: str = None

    # OPIK settings
    opik_api_key: str
    opik_project_name: str = "law_graphRAG"

    # OpenAI settings (for LLM-as-judge)
    openai_api_key: str = None
    openai_model: str = "gpt-4o-mini"
    enable_llm_judge: bool = False

    # Experiment settings
    timeout_seconds: float = 30.0
    parallel_workers: int = 8
    metrics: List[str] = None  # ["contains", "equals", "latency", "llm_precision"]

    @classmethod
    def from_env(cls) -> "ExperimentConfig":
        """Load configuration from environment variables."""
        pass
```

---

## 7. Result Interfaces

```python
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime

@dataclass
class SystemMetrics:
    """Aggregated metrics for one RAG system."""
    system_name: str
    success_rate: float
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    metric_scores: Dict[str, Dict[str, float]]  # metric -> {mean, min, max, std}

@dataclass
class ExperimentResult:
    """Complete experiment result."""
    experiment_id: str
    experiment_name: str
    created_at: datetime
    dataset_name: str
    question_count: int
    dust_metrics: SystemMetrics
    graphrag_metrics: SystemMetrics
    comparison_summary: Dict[str, str]  # {"winner": "graphrag", "margin": "15%"}

    def to_markdown_report(self) -> str:
        """Generate a markdown summary report."""
        pass

    def get_opik_url(self) -> str:
        """Get the OPIK dashboard URL for this experiment."""
        pass
```

---

## 8. Error Handling Interface

```python
class RAGComparisonError(Exception):
    """Base exception for RAG comparison errors."""
    pass

class DustAPIError(RAGComparisonError):
    """Error from Dust API."""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message

class GraphRAGAPIError(RAGComparisonError):
    """Error from GraphRAG API."""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message

class OPIKError(RAGComparisonError):
    """Error from OPIK SDK."""
    pass

class TimeoutError(RAGComparisonError):
    """Query timeout error."""
    def __init__(self, system: str, timeout_seconds: float):
        self.system = system
        self.timeout_seconds = timeout_seconds

class LLMJudgeError(RAGComparisonError):
    """Error from LLM-as-judge evaluation."""
    def __init__(self, message: str, response: str = None):
        self.message = message
        self.response = response  # Raw response that failed to parse
```
