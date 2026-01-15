"""Error classes for RAG comparison operations."""

from __future__ import annotations

from typing import Optional


class RAGComparisonError(Exception):
    """Base exception for RAG comparison errors.

    All custom exceptions in this package inherit from this class,
    enabling catch-all handling when needed.
    """

    pass


class DustAPIError(RAGComparisonError):
    """Error from Dust Conversations API.

    Raised when the Dust API returns an error response or
    fails to parse the SSE stream correctly.
    """

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(f"Dust API error ({status_code}): {message}")


class GraphRAGAPIError(RAGComparisonError):
    """Error from GraphRAG Reconciliation API.

    Raised when the GraphRAG API returns an error response
    or the response format is unexpected.
    """

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(f"GraphRAG API error ({status_code}): {message}")


class OPIKError(RAGComparisonError):
    """Error from OPIK SDK operations.

    Raised when OPIK dataset loading, experiment logging,
    or metric computation fails.
    """

    pass


class TimeoutError(RAGComparisonError):
    """Query timeout error.

    Raised when a RAG query exceeds the configured timeout.
    Captures which system timed out and the timeout duration.
    """

    def __init__(self, system: str, timeout_seconds: float) -> None:
        self.system = system
        self.timeout_seconds = timeout_seconds
        super().__init__(f"{system} query timed out after {timeout_seconds}s")


class LLMJudgeError(RAGComparisonError):
    """Error from LLM-as-judge evaluation.

    Raised when the OpenAI API call fails or the response
    cannot be parsed as valid JSON with score/reasoning.
    """

    def __init__(self, message: str, response: Optional[str] = None) -> None:
        self.message = message
        self.response = response
        detail = f" (raw: {response[:100]}...)" if response and len(response) > 100 else ""
        detail = f" (raw: {response})" if response and len(response) <= 100 else detail
        super().__init__(f"LLM judge error: {message}{detail}")
