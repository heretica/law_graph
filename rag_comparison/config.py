"""Configuration module for RAG comparison experiments."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Optional

from dotenv import load_dotenv


@dataclass
class ExperimentConfig:
    """Configuration for a comparison experiment.

    Loads settings from environment variables or direct instantiation.
    Supports Dust RAG, GraphRAG, OPIK logging, and optional LLM-as-judge.
    """

    # Dust settings
    dust_api_key: str
    dust_workspace_id: str
    dust_agent_id: str = "beTfWHdTC6"

    # GraphRAG settings
    graphrag_api_url: str = "https://reconciliation-api-production.up.railway.app"
    graphrag_mode: str = "local"
    graphrag_book_id: Optional[str] = None

    # OPIK settings
    opik_api_key: str = ""
    opik_project_name: str = "law_graphRAG"

    # OpenAI settings (for LLM-as-judge)
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    enable_llm_judge: bool = False

    # Experiment settings
    timeout_seconds: float = 30.0
    parallel_workers: int = 8
    metrics: list[str] = field(default_factory=lambda: ["contains", "latency", "status"])

    @classmethod
    def from_env(cls, dotenv_path: Optional[str] = None) -> ExperimentConfig:
        """Load configuration from environment variables.

        Args:
            dotenv_path: Optional path to .env file. If None, searches default locations.

        Returns:
            ExperimentConfig populated from environment variables.

        Raises:
            ValueError: If required environment variables are missing.
        """
        load_dotenv(dotenv_path)

        # Required variables
        dust_api_key = os.getenv("DUST_API_KEY")
        dust_workspace_id = os.getenv("DUST_WORKSPACE_ID")
        opik_api_key = os.getenv("OPIK_API_KEY")

        missing = []
        if not dust_api_key:
            missing.append("DUST_API_KEY")
        if not dust_workspace_id:
            missing.append("DUST_WORKSPACE_ID")
        if not opik_api_key:
            missing.append("OPIK_API_KEY")

        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

        # Optional variables with defaults
        openai_api_key = os.getenv("OPENAI_API_KEY")
        enable_llm_judge = bool(openai_api_key and os.getenv("ENABLE_LLM_JUDGE", "").lower() == "true")

        return cls(
            dust_api_key=dust_api_key,
            dust_workspace_id=dust_workspace_id,
            dust_agent_id=os.getenv("DUST_AGENT_ID", "beTfWHdTC6"),
            graphrag_api_url=os.getenv(
                "GRAPHRAG_API_URL",
                "https://reconciliation-api-production.up.railway.app",
            ),
            graphrag_mode=os.getenv("GRAPHRAG_MODE", "local"),
            graphrag_book_id=os.getenv("GRAPHRAG_BOOK_ID"),
            opik_api_key=opik_api_key,
            opik_project_name=os.getenv("OPIK_PROJECT_NAME", "law_graphRAG"),
            openai_api_key=openai_api_key,
            openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            enable_llm_judge=enable_llm_judge,
            timeout_seconds=float(os.getenv("TIMEOUT_SECONDS", "30.0")),
            parallel_workers=int(os.getenv("PARALLEL_WORKERS", "8")),
        )

    def validate(self) -> list[str]:
        """Validate configuration and return list of warnings.

        Returns:
            List of warning messages (empty if all valid).
        """
        warnings = []

        if self.enable_llm_judge and not self.openai_api_key:
            warnings.append("LLM judge enabled but OPENAI_API_KEY not set")

        if self.timeout_seconds < 5.0:
            warnings.append(f"Timeout {self.timeout_seconds}s may be too short for RAG queries")

        if not self.metrics:
            warnings.append("No metrics configured - at least one metric required")

        return warnings
