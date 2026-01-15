"""Retrieval time metric for tracking retrieval phase duration."""

from __future__ import annotations

from opik.evaluation.metrics import BaseMetric
from opik.evaluation.metrics.score_result import ScoreResult


class RetrievalTimeMetric(BaseMetric):
    """Custom metric for tracking retrieval phase duration.

    Records the time spent in the retrieval phase (before LLM generation)
    in milliseconds, enabling fair retrieval comparison between RAG systems.
    """

    def __init__(self, name: str = "retrieval_time_ms") -> None:
        """Initialize retrieval time metric.

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
        retrieval_time_ms: float = -1,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score a response by its retrieval time.

        Args:
            output: The RAG response text (unused for retrieval time).
            retrieval_time_ms: Retrieval phase time in milliseconds. -1 if not available.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with retrieval time value in milliseconds.
        """
        if retrieval_time_ms < 0:
            reason = "Retrieval time not available"
        else:
            reason = f"Retrieval time: {retrieval_time_ms:.0f}ms"

        return ScoreResult(
            name=self._name,
            value=retrieval_time_ms,
            reason=reason,
        )

    async def ascore(
        self,
        output: str,
        retrieval_time_ms: float = -1,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Async version of score() for concurrent evaluation.

        Args:
            output: The RAG response text (unused for retrieval time).
            retrieval_time_ms: Retrieval phase time in milliseconds.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with retrieval time value in milliseconds.
        """
        return self.score(output, retrieval_time_ms=retrieval_time_ms, **ignored_kwargs)
