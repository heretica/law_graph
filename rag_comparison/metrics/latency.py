"""Latency metric for tracking response times."""

from __future__ import annotations

from opik.evaluation.metrics import BaseMetric
from opik.evaluation.metrics.score_result import ScoreResult


class LatencyMetric(BaseMetric):
    """Custom metric for tracking response latency.

    Records the time from request to response in milliseconds,
    enabling fair latency comparison between RAG systems.
    """

    def __init__(self, name: str = "latency_ms") -> None:
        """Initialize latency metric.

        Args:
            name: Metric name for OPIK logging.
        """
        self._name = name

    @property
    def name(self) -> str:
        """Get the metric name."""
        return self._name

    def score(
        self,
        output: str,
        latency_ms: float = 0,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score a response by its latency.

        Args:
            output: The RAG response text (unused for latency).
            latency_ms: Response time in milliseconds.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with latency value in milliseconds.
        """
        return ScoreResult(
            name=self._name,
            value=latency_ms,
            reason=f"Response time: {latency_ms:.0f}ms",
        )

    async def ascore(
        self,
        output: str,
        latency_ms: float = 0,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Async version of score() for concurrent evaluation.

        Args:
            output: The RAG response text (unused for latency).
            latency_ms: Response time in milliseconds.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with latency value in milliseconds.
        """
        return self.score(output, latency_ms=latency_ms, **ignored_kwargs)
