"""GraphRAG Reconciliation API client."""

from __future__ import annotations

import asyncio
import time
from typing import Optional

import aiohttp

from rag_comparison.clients.base import QueryResult, RAGClient
from rag_comparison.errors import GraphRAGAPIError


class GraphRAGClient(RAGClient):
    """Client for GraphRAG Reconciliation API.

    Connects to the law-graphRAG-reconciliation-api service
    for graph-based retrieval augmented generation.
    """

    def __init__(
        self,
        api_url: str = "https://reconciliation-api-production.up.railway.app",
        timeout: float = 30.0,
        default_mode: str = "local",
        default_book_id: Optional[str] = None,
    ) -> None:
        """Initialize GraphRAG client.

        Args:
            api_url: Base URL for the GraphRAG API.
            timeout: Request timeout in seconds.
            default_mode: Default query mode ('local' or 'global').
            default_book_id: Optional default book scope for queries.
        """
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout
        self.default_mode = default_mode
        self.default_book_id = default_book_id
        self._session: Optional[aiohttp.ClientSession] = None

    @property
    def system_name(self) -> str:
        return "graphrag"

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=self.timeout),
            )
        return self._session

    async def close(self) -> None:
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()

    async def query(
        self,
        question: str,
        mode: Optional[str] = None,
        book_id: Optional[str] = None,
    ) -> QueryResult:
        """Query GraphRAG API.

        Args:
            question: The query text.
            mode: Optional override for query mode.
            book_id: Optional book scope.

        Returns:
            QueryResult extracted from API response.
        """
        start_time = time.perf_counter()

        try:
            session = await self._get_session()
            url = f"{self.api_url}/query"

            payload = {
                "query": question,
                "mode": mode or self.default_mode,
            }

            if book_id or self.default_book_id:
                payload["book_id"] = book_id or self.default_book_id

            async with session.post(url, json=payload) as response:
                latency_ms = (time.perf_counter() - start_time) * 1000

                if response.status != 200:
                    error_text = await response.text()
                    raise GraphRAGAPIError(response.status, error_text)

                data = await response.json()

                # Handle API response structure
                if not data.get("success", True):
                    error_msg = data.get("error", "Unknown error")
                    return QueryResult.error(error_msg, latency_ms)

                answer = data.get("answer", "")
                if not answer:
                    # Try alternative response field
                    answer = data.get("response", "")

                return QueryResult(
                    answer=answer,
                    latency_ms=latency_ms,
                    status="success",
                    raw_response=data,
                )

        except asyncio.TimeoutError:
            latency_ms = (time.perf_counter() - start_time) * 1000
            return QueryResult.timeout(latency_ms)
        except GraphRAGAPIError:
            raise
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            return QueryResult.error(str(e), latency_ms)

    async def health_check(self) -> bool:
        """Check if GraphRAG API is accessible.

        Returns:
            True if the API health endpoint responds, False otherwise.
        """
        try:
            session = await self._get_session()
            url = f"{self.api_url}/health"

            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5.0)) as response:
                return response.status == 200
        except Exception:
            return False

    async def get_books(self) -> list[dict]:
        """Get list of available books.

        Returns:
            List of book metadata dictionaries.
        """
        try:
            session = await self._get_session()
            url = f"{self.api_url}/books"

            async with session.get(url) as response:
                if response.status != 200:
                    return []

                data = await response.json()
                return data.get("books", [])
        except Exception:
            return []
