"""Status metric for tracking query success/failure."""

from __future__ import annotations

from opik.evaluation.metrics import BaseMetric
from opik.evaluation.metrics.score_result import ScoreResult


class StatusMetric(BaseMetric):
    """Custom metric for tracking success/failure status.

    Converts status strings to binary scores for aggregation:
    - 1.0 for 'success'
    - 0.0 for 'timeout', 'error:*', or any other status
    """

    def __init__(self, name: str = "status") -> None:
        """Initialize status metric.

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
        status: str = "unknown",
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score a response by its status.

        Args:
            output: The RAG response text (unused for status).
            status: Query status ('success', 'timeout', or 'error: ...').
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with 1.0 for success, 0.0 otherwise.
        """
        success = status == "success"
        return ScoreResult(
            name=self._name,
            value=1.0 if success else 0.0,
            reason=status,
        )

    async def ascore(
        self,
        output: str,
        status: str = "unknown",
        **ignored_kwargs,
    ) -> ScoreResult:
        """Async version of score() for concurrent evaluation.

        Args:
            output: The RAG response text (unused for status).
            status: Query status ('success', 'timeout', or 'error: ...').
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with 1.0 for success, 0.0 otherwise.
        """
        return self.score(output, status=status, **ignored_kwargs)
