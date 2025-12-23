"""Base classes for RAG client implementations."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class QueryResult:
    """Standard result from any RAG system.

    Provides a uniform interface for both Dust and GraphRAG responses,
    enabling consistent metric computation across systems.
    """

    answer: str
    """The RAG system's response text."""

    latency_ms: float
    """Time from request to response in milliseconds."""

    status: str
    """Query status: 'success', 'timeout', or 'error: {message}'."""

    raw_response: Optional[dict] = None
    """Original API response for debugging/provenance."""

    @property
    def is_success(self) -> bool:
        """Check if the query completed successfully."""
        return self.status == "success"

    @property
    def is_timeout(self) -> bool:
        """Check if the query timed out."""
        return self.status == "timeout"

    @property
    def is_error(self) -> bool:
        """Check if the query resulted in an error."""
        return self.status.startswith("error:")

    @classmethod
    def timeout(cls, latency_ms: float) -> QueryResult:
        """Create a timeout result.

        Args:
            latency_ms: How long we waited before timing out.

        Returns:
            QueryResult with timeout status.
        """
        return cls(answer="", latency_ms=latency_ms, status="timeout")

    @classmethod
    def error(cls, message: str, latency_ms: float = 0) -> QueryResult:
        """Create an error result.

        Args:
            message: Error description.
            latency_ms: Time elapsed before error occurred.

        Returns:
            QueryResult with error status.
        """
        return cls(answer="", latency_ms=latency_ms, status=f"error: {message}")


class RAGClient(ABC):
    """Abstract base class for RAG system clients.

    All RAG clients must implement query() and health_check() methods
    to ensure consistent behavior across different backends.
    """

    @abstractmethod
    async def query(self, question: str) -> QueryResult:
        """Send a question to the RAG system.

        Args:
            question: The civic law question to ask.

        Returns:
            QueryResult with answer, latency, and status.
        """
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the RAG system is available.

        Returns:
            True if the system is responsive, False otherwise.
        """
        ...

    @property
    @abstractmethod
    def system_name(self) -> str:
        """Get the system identifier for logging/metrics.

        Returns:
            Human-readable system name (e.g., 'dust', 'graphrag').
        """
        ...
