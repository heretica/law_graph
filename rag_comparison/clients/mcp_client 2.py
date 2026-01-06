"""MCP GraphRAG client for querying the Grand Débat MCP server."""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from typing import Optional

import aiohttp

from rag_comparison.clients.base import QueryResult, RAGClient

logger = logging.getLogger(__name__)


class MCPGraphRAGClient(RAGClient):
    """Client for GraphRAG via MCP server.

    Connects to the Grand Débat MCP server using JSON-RPC protocol
    to query the nano_graphrag knowledge graph.
    """

    def __init__(
        self,
        api_url: str = "https://graphragmcp-production.up.railway.app/mcp",
        timeout: float = 120.0,
        default_mode: str = "local",
        default_commune: str = "Rochefort",
    ) -> None:
        """Initialize MCP GraphRAG client.

        Args:
            api_url: MCP server endpoint URL.
            timeout: Query timeout in seconds.
            default_mode: Query mode ('local' or 'global').
            default_commune: Default commune to query.
        """
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout
        self.default_mode = default_mode
        self.default_commune = default_commune
        self._session: Optional[aiohttp.ClientSession] = None
        self._session_id: Optional[str] = None

    @property
    def system_name(self) -> str:
        return "graphrag_mcp"

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session.

        Note: Creates a new session each time to avoid event loop issues
        when called from different async contexts (e.g., OPIK evaluate).
        """
        # Always create a fresh session to avoid "Future attached to different loop" errors
        return aiohttp.ClientSession(
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream",
            },
            timeout=aiohttp.ClientTimeout(total=self.timeout),
        )

    def _parse_sse_response(self, text: str) -> dict:
        """Parse Server-Sent Events response.

        Args:
            text: Raw SSE response text.

        Returns:
            Parsed JSON from the data field.
        """
        lines = text.split("\n")
        for line in lines:
            if line.startswith("data: "):
                json_str = line[6:]
                try:
                    parsed = json.loads(json_str)
                    # Extract content from result
                    if "result" in parsed and "content" in parsed["result"]:
                        content = parsed["result"]["content"]
                        if content and len(content) > 0 and "text" in content[0]:
                            text_content = content[0]["text"]
                            if isinstance(text_content, str):
                                try:
                                    return json.loads(text_content)
                                except json.JSONDecodeError:
                                    return {"answer": text_content}
                            return text_content
                    return parsed
                except json.JSONDecodeError:
                    continue
        return {}

    async def _init_mcp_session(self, session: aiohttp.ClientSession) -> str:
        """Initialize MCP session with JSON-RPC.

        Returns:
            Session ID for subsequent requests.
        """
        # Initialize protocol
        init_payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "clientInfo": {"name": "opik-experiment", "version": "1.0.0"},
                "capabilities": {},
            },
        }

        async with session.post(self.api_url, json=init_payload) as response:
            if response.status != 200:
                error_text = await response.text()
                raise RuntimeError(f"MCP init failed: {response.status} - {error_text}")

            # Get session ID from header
            session_id = response.headers.get("mcp-session-id")
            if not session_id:
                # Try to read response text for debugging
                text = await response.text()
                logger.warning(f"No session ID in MCP response headers. Response: {text[:200]}")
                raise RuntimeError("No session ID in MCP response")

            logger.debug(f"MCP session initialized: {session_id}")
            return session_id

    async def _call_tool(
        self,
        session: aiohttp.ClientSession,
        tool_name: str,
        arguments: dict,
        max_retries: int = 2,
    ) -> dict:
        """Call an MCP tool via JSON-RPC with retry logic.

        Args:
            session: Active aiohttp session.
            tool_name: Name of the MCP tool to call.
            arguments: Tool arguments.
            max_retries: Maximum number of retry attempts (default: 2).

        Returns:
            Tool result as dictionary.
        """
        # Ensure session is initialized
        if self._session_id is None:
            self._session_id = await self._init_mcp_session(session)

        payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": arguments},
        }

        headers = {"mcp-session-id": self._session_id}
        last_error = None

        for attempt in range(max_retries + 1):
            try:
                async with session.post(self.api_url, json=payload, headers=headers) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise RuntimeError(f"MCP tool call failed: {response.status} - {error_text}")

                    # Parse SSE response (MCP returns text/event-stream)
                    text = await response.text()
                    result = self._parse_sse_response(text)

                    if not result:
                        raise RuntimeError(f"Could not parse MCP response: {text[:200]}")

                    # Check for error in result
                    if result.get("success") is False:
                        raise RuntimeError(result.get("error", "MCP query failed"))

                    return result

            except RuntimeError as e:
                last_error = e
                if attempt < max_retries:
                    wait_time = (attempt + 1) * 1.0  # Exponential backoff: 1s, 2s
                    logger.warning(f"MCP call failed (attempt {attempt + 1}/{max_retries + 1}), retrying in {wait_time}s: {e}")
                    await asyncio.sleep(wait_time)
                    # Reset session ID to force re-initialization on retry
                    self._session_id = None
                    if self._session_id is None:
                        self._session_id = await self._init_mcp_session(session)

        raise last_error

    async def query(
        self,
        question: str,
        mode: Optional[str] = None,
        commune: Optional[str] = None,
    ) -> QueryResult:
        """Query GraphRAG via MCP server using fast community-first retrieval.

        Args:
            question: The query text.
            mode: Ignored - fast query uses community-first approach.
            commune: Ignored - queries across all communes via community matching.

        Returns:
            QueryResult with answer and metadata.
        """
        start_time = time.perf_counter()
        session = None

        try:
            session = await self._get_session()

            # Use grand_debat_query_fast for optimized latency
            # Community-first retrieval + multi-hop BFS expansion
            result = await self._call_tool(
                session,
                "grand_debat_query_fast",
                {
                    "query": question,
                    "max_communes": 50,  # Search across all communes
                },
            )

            latency_ms = (time.perf_counter() - start_time) * 1000

            # Check for success
            if result.get("success") is False:
                error_msg = result.get("error", "Query failed")
                return QueryResult.error(error_msg, latency_ms)

            # Fast query returns answer directly with performance metadata
            answer = result.get("answer", "")

            # Add performance breakdown to raw_response for analysis
            performance = result.get("performance", {})
            provenance = result.get("provenance", {})

            return QueryResult(
                answer=answer,
                latency_ms=latency_ms,
                status="success",
                raw_response={
                    **result,
                    "performance": performance,
                    "provenance": provenance,
                },
            )

        except asyncio.TimeoutError:
            latency_ms = (time.perf_counter() - start_time) * 1000
            return QueryResult.timeout(latency_ms)
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"MCP query error: {e}")
            return QueryResult.error(str(e), latency_ms)
        finally:
            if session and not session.closed:
                await session.close()

    async def health_check(self) -> bool:
        """Check if MCP server is accessible.

        Returns:
            True if the server responds to initialize, False otherwise.
        """
        session = None
        try:
            session = await self._get_session()
            await self._init_mcp_session(session)
            return True
        except Exception as e:
            logger.warning(f"MCP health check failed: {e}")
            return False
        finally:
            if session and not session.closed:
                await session.close()

    async def close(self) -> None:
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
