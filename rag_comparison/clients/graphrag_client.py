"""GraphRAG client using nano_graphrag for local knowledge graph queries."""

from __future__ import annotations

import asyncio
import logging
import sys
import time
from pathlib import Path
from typing import Optional

from rag_comparison.clients.base import QueryResult, RAGClient

logger = logging.getLogger(__name__)

# Path to nano_graphrag module and law data
GRAPHRAG_MCP_PATH = Path("/Users/arthursarazin/Documents/graphRAGmcp")
LAW_DATA_PATH = GRAPHRAG_MCP_PATH / "law_data"


class GraphRAGClient(RAGClient):
    """Client for GraphRAG using nano_graphrag library.

    Queries the Grand Débat National "Cahiers de Doléances" knowledge graph
    using the nano_graphrag library directly.
    """

    def __init__(
        self,
        data_path: Optional[str] = None,
        timeout: float = 60.0,
        default_mode: str = "global",
        default_commune: str = "Rochefort",
    ) -> None:
        """Initialize GraphRAG client.

        Args:
            data_path: Path to law_data directory.
            timeout: Query timeout in seconds.
            default_mode: Query mode ('local' or 'global').
            default_commune: Default commune to query.
        """
        self.data_path = Path(data_path) if data_path else LAW_DATA_PATH
        self.timeout = timeout
        self.default_mode = default_mode
        self.default_commune = default_commune
        self._rag_instances: dict = {}

        # Add nano_graphrag to path
        if str(GRAPHRAG_MCP_PATH) not in sys.path:
            sys.path.insert(0, str(GRAPHRAG_MCP_PATH))

    @property
    def system_name(self) -> str:
        return "graphrag"

    def _get_commune_path(self, commune_id: str) -> Optional[Path]:
        """Get path to a commune's data directory."""
        commune_path = self.data_path / commune_id
        if commune_path.exists():
            return commune_path

        # Try with underscores
        alt_path = self.data_path / commune_id.replace(' ', '_')
        if alt_path.exists():
            return alt_path

        return None

    def _list_communes(self) -> list[str]:
        """List available communes."""
        if not self.data_path.exists():
            return []
        return [
            d.name for d in self.data_path.iterdir()
            if d.is_dir() and (d / "vdb_entities.json").exists()
        ]

    async def query(
        self,
        question: str,
        mode: Optional[str] = None,
        commune: Optional[str] = None,
    ) -> QueryResult:
        """Query GraphRAG for a specific commune.

        Args:
            question: The query text.
            mode: Query mode ('local' or 'global').
            commune: Commune to query (default: Rochefort).

        Returns:
            QueryResult with answer and metadata.
        """
        start_time = time.perf_counter()
        commune_id = commune or self.default_commune
        query_mode = mode or self.default_mode

        try:
            # Import nano_graphrag
            from nano_graphrag import GraphRAG, QueryParam
            from nano_graphrag._llm import gpt_4o_mini_complete

            # Get commune path
            commune_path = self._get_commune_path(commune_id)
            if not commune_path:
                available = self._list_communes()[:5]
                return QueryResult.error(
                    f"Commune '{commune_id}' not found. Available: {available}",
                    (time.perf_counter() - start_time) * 1000
                )

            # Create or reuse RAG instance
            if commune_id not in self._rag_instances:
                self._rag_instances[commune_id] = GraphRAG(
                    working_dir=str(commune_path),
                    best_model_func=gpt_4o_mini_complete,
                    cheap_model_func=gpt_4o_mini_complete,
                )

            rag = self._rag_instances[commune_id]

            # Query with timeout
            try:
                result = await asyncio.wait_for(
                    rag.aquery(
                        question,
                        param=QueryParam(mode=query_mode)
                    ),
                    timeout=self.timeout
                )
            except asyncio.TimeoutError:
                latency_ms = (time.perf_counter() - start_time) * 1000
                return QueryResult.timeout(latency_ms)

            latency_ms = (time.perf_counter() - start_time) * 1000

            # Extract answer from result
            if isinstance(result, dict):
                answer = result.get("answer", "")
            else:
                answer = str(result)

            return QueryResult(
                answer=answer,
                latency_ms=latency_ms,
                status="success",
                raw_response={"commune": commune_id, "mode": query_mode},
            )

        except ImportError as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"nano_graphrag import error: {e}")
            return QueryResult.error(f"nano_graphrag not available: {e}", latency_ms)
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"GraphRAG query error: {e}")
            return QueryResult.error(str(e), latency_ms)

    async def query_all_communes(
        self,
        question: str,
        mode: Optional[str] = None,
        max_communes: int = 10,
    ) -> QueryResult:
        """Query across multiple communes.

        Args:
            question: The query text.
            mode: Query mode.
            max_communes: Maximum communes to query.

        Returns:
            QueryResult with aggregated answers.
        """
        start_time = time.perf_counter()
        query_mode = mode or self.default_mode

        communes = self._list_communes()[:max_communes]
        if not communes:
            return QueryResult.error(
                "No communes found",
                (time.perf_counter() - start_time) * 1000
            )

        results = []
        for commune in communes:
            result = await self.query(question, mode=query_mode, commune=commune)
            if result.status == "success":
                results.append({
                    "commune": commune,
                    "answer": result.answer[:500],
                })

        latency_ms = (time.perf_counter() - start_time) * 1000

        if not results:
            return QueryResult.error("All commune queries failed", latency_ms)

        # Aggregate answers
        aggregated = "\n\n".join([
            f"**{r['commune']}**: {r['answer']}" for r in results
        ])

        return QueryResult(
            answer=aggregated,
            latency_ms=latency_ms,
            status="success",
            raw_response={"communes_queried": len(results)},
        )

    async def health_check(self) -> bool:
        """Check if GraphRAG data is accessible."""
        return self.data_path.exists() and len(self._list_communes()) > 0

    async def close(self) -> None:
        """Clean up resources."""
        self._rag_instances.clear()
