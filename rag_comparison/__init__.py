"""RAG Comparison - LLM observability solution for legal RAG systems.

This package provides tools to compare Dust RAG agent vs Law GraphRAG API,
evaluating precision and latency using OPIK heuristic metrics.
"""

from rag_comparison.config import ExperimentConfig
from rag_comparison.runner import ExperimentRunner

__version__ = "0.1.0"
__all__ = ["ExperimentConfig", "ExperimentRunner"]
