"""Shared pytest fixtures for RAG comparison tests."""

from __future__ import annotations

from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest

from rag_comparison.clients.base import QueryResult, RAGClient
from rag_comparison.config import ExperimentConfig


# Sample data fixtures


@pytest.fixture
def sample_legal_questions() -> list[dict[str, str]]:
    """Sample legal questions for testing."""
    return [
        {
            "input": "Qu'est-ce que l'article 1382 du Code Civil?",
            "expected_output": "L'article 1382 du Code Civil établit le principe de la responsabilité civile délictuelle.",
        },
        {
            "input": "Quelles sont les conditions de la responsabilité civile?",
            "expected_output": "La responsabilité civile requiert une faute, un dommage et un lien de causalité.",
        },
        {
            "input": "Comment fonctionne la prescription en droit civil?",
            "expected_output": "La prescription extinctive est de 5 ans en droit commun selon l'article 2224.",
        },
    ]


@pytest.fixture
def sample_query_result() -> QueryResult:
    """Sample successful query result."""
    return QueryResult(
        answer="L'article 1382 établit la responsabilité civile délictuelle.",
        latency_ms=1234.5,
        status="success",
        raw_response={"source": "test"},
    )


@pytest.fixture
def sample_timeout_result() -> QueryResult:
    """Sample timeout query result."""
    return QueryResult.timeout(latency_ms=30000.0)


@pytest.fixture
def sample_error_result() -> QueryResult:
    """Sample error query result."""
    return QueryResult.error("Connection refused", latency_ms=100.0)


# Mock client fixtures


class MockRAGClient(RAGClient):
    """Mock RAG client for testing."""

    def __init__(self, name: str = "mock", responses: list[QueryResult] | None = None) -> None:
        self._name = name
        self._responses = responses or []
        self._call_count = 0

    async def query(self, question: str) -> QueryResult:
        if self._responses:
            result = self._responses[self._call_count % len(self._responses)]
            self._call_count += 1
            return result
        return QueryResult(
            answer=f"Mock answer to: {question}",
            latency_ms=100.0,
            status="success",
        )

    async def health_check(self) -> bool:
        return True

    @property
    def system_name(self) -> str:
        return self._name


@pytest.fixture
def mock_dust_client(sample_query_result: QueryResult) -> MockRAGClient:
    """Mock Dust client that returns successful responses."""
    return MockRAGClient(name="dust", responses=[sample_query_result])


@pytest.fixture
def mock_graphrag_client(sample_query_result: QueryResult) -> MockRAGClient:
    """Mock GraphRAG client that returns successful responses."""
    return MockRAGClient(name="graphrag", responses=[sample_query_result])


# Configuration fixtures


@pytest.fixture
def test_config() -> ExperimentConfig:
    """Test configuration with dummy values."""
    return ExperimentConfig(
        dust_api_key="test-dust-key",
        dust_workspace_id="test-workspace",
        dust_agent_id="test-agent",
        graphrag_api_url="http://localhost:5002",
        opik_api_key="test-opik-key",
        opik_project_name="test-project",
        openai_api_key="test-openai-key",
        enable_llm_judge=False,
        timeout_seconds=5.0,
        parallel_workers=2,
    )


@pytest.fixture
def test_config_with_llm_judge(test_config: ExperimentConfig) -> ExperimentConfig:
    """Test configuration with LLM judge enabled."""
    test_config.enable_llm_judge = True
    return test_config


# Async fixtures


@pytest.fixture
async def async_mock_session() -> AsyncGenerator[MagicMock, None]:
    """Mock aiohttp session for HTTP tests."""
    session = MagicMock()
    session.post = AsyncMock()
    session.get = AsyncMock()
    session.close = AsyncMock()
    yield session
