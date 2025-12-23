"""Dust Conversations API client with SSE streaming support."""

from __future__ import annotations

import asyncio
import json
import time
from typing import Optional

import aiohttp

from rag_comparison.clients.base import QueryResult, RAGClient
from rag_comparison.errors import DustAPIError


class DustClient(RAGClient):
    """Client for Dust Conversations API.

    Handles Server-Sent Events (SSE) streaming for token aggregation
    and provides async query capabilities for the comparison framework.
    """

    BASE_URL = "https://dust.tt/api/v1"

    def __init__(
        self,
        api_key: str,
        workspace_id: str,
        agent_id: str = "beTfWHdTC6",
        timeout: float = 30.0,
    ) -> None:
        """Initialize Dust client.

        Args:
            api_key: Dust API key (sk-...).
            workspace_id: Dust workspace ID.
            agent_id: Agent configuration ID (default: beTfWHdTC6).
            timeout: Request timeout in seconds.
        """
        self.api_key = api_key
        self.workspace_id = workspace_id
        self.agent_id = agent_id
        self.timeout = timeout
        self._session: Optional[aiohttp.ClientSession] = None

    @property
    def system_name(self) -> str:
        return "dust"

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=aiohttp.ClientTimeout(total=self.timeout),
            )
        return self._session

    async def close(self) -> None:
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()

    async def query(self, question: str) -> QueryResult:
        """Query Dust agent and collect SSE response.

        Handles:
        - SSE event stream parsing
        - Token aggregation into full response
        - Timeout after configured seconds
        - Error event handling

        Args:
            question: The legal question to ask.

        Returns:
            QueryResult with aggregated answer and latency.
        """
        start_time = time.perf_counter()

        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/w/{self.workspace_id}/assistant/conversations"

            payload = {
                "message": {
                    "content": question,
                    "mentions": [{"configurationId": self.agent_id}],
                    "context": {
                        "timezone": "Europe/Paris",
                        "username": "api-user",
                        "profilePictureUrl": None,
                    },
                },
                "visibility": "unlisted",
                "title": None,
            }

            async with session.post(url, json=payload) as response:
                latency_ms = (time.perf_counter() - start_time) * 1000

                if response.status != 200:
                    error_text = await response.text()
                    raise DustAPIError(response.status, error_text)

                # Parse JSON response (Dust returns conversation data, not SSE for initial call)
                data = await response.json()

                # Extract conversation ID for follow-up
                conversation = data.get("conversation", {})
                conversation_id = conversation.get("sId")

                if not conversation_id:
                    return QueryResult.error("No conversation ID in response", latency_ms)

                # Poll for agent response
                answer = await self._poll_for_response(session, conversation_id, start_time)
                final_latency = (time.perf_counter() - start_time) * 1000

                return QueryResult(
                    answer=answer,
                    latency_ms=final_latency,
                    status="success",
                    raw_response=data,
                )

        except asyncio.TimeoutError:
            latency_ms = (time.perf_counter() - start_time) * 1000
            return QueryResult.timeout(latency_ms)
        except DustAPIError:
            raise
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            return QueryResult.error(str(e), latency_ms)

    async def _poll_for_response(
        self,
        session: aiohttp.ClientSession,
        conversation_id: str,
        start_time: float,
    ) -> str:
        """Poll conversation for agent message completion.

        Args:
            session: Active aiohttp session.
            conversation_id: Dust conversation ID.
            start_time: Query start time for timeout calculation.

        Returns:
            Aggregated response text from the agent.
        """
        url = f"{self.BASE_URL}/w/{self.workspace_id}/assistant/conversations/{conversation_id}"
        poll_interval = 0.5  # seconds
        max_polls = int(self.timeout / poll_interval)

        for _ in range(max_polls):
            elapsed = time.perf_counter() - start_time
            if elapsed >= self.timeout:
                raise asyncio.TimeoutError()

            async with session.get(url) as response:
                if response.status != 200:
                    continue

                data = await response.json()
                conversation = data.get("conversation", {})
                content = conversation.get("content", [])

                # Look for completed agent message
                for item in content:
                    if isinstance(item, list):
                        for msg in item:
                            if msg.get("type") == "agent_message":
                                status = msg.get("status")
                                if status == "succeeded":
                                    return msg.get("content", "")
                                elif status == "failed":
                                    error = msg.get("error", {})
                                    raise DustAPIError(500, error.get("message", "Agent failed"))

            await asyncio.sleep(poll_interval)

        raise asyncio.TimeoutError()

    async def _parse_sse_stream(self, response: aiohttp.ClientResponse) -> str:
        """Parse Server-Sent Events and aggregate tokens.

        Args:
            response: Streaming HTTP response with SSE content.

        Returns:
            Aggregated response text.
        """
        tokens: list[str] = []

        async for line in response.content:
            line_text = line.decode("utf-8").strip()

            if not line_text or line_text.startswith(":"):
                continue

            if line_text.startswith("data: "):
                data_str = line_text[6:]
                if data_str == "[DONE]":
                    break

                try:
                    event_data = json.loads(data_str)
                    event_type = event_data.get("type")

                    if event_type == "generation_tokens":
                        token = event_data.get("text", "")
                        tokens.append(token)
                    elif event_type == "agent_message_success":
                        # Final message, can extract full content if needed
                        content = event_data.get("content", "")
                        if content:
                            return content
                    elif event_type == "error":
                        error_msg = event_data.get("message", "Unknown error")
                        raise DustAPIError(500, error_msg)
                except json.JSONDecodeError:
                    continue

        return "".join(tokens)

    async def health_check(self) -> bool:
        """Check if Dust API is accessible.

        Returns:
            True if the API responds, False otherwise.
        """
        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/w/{self.workspace_id}/data_sources"

            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5.0)) as response:
                return response.status == 200
        except Exception:
            return False
