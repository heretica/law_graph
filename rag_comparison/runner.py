"""Experiment runner for RAG comparison evaluation."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Optional

import opik
from opik.evaluation import evaluate
from opik.evaluation.metrics import BaseMetric, Contains

from rag_comparison.clients.base import QueryResult, RAGClient
from rag_comparison.config import ExperimentConfig
from rag_comparison.metrics.latency import LatencyMetric
from rag_comparison.metrics.llm_judge import LLMPrecisionJudge
from rag_comparison.metrics.status import StatusMetric

logger = logging.getLogger(__name__)


@dataclass
class ComparisonResult:
    """Result of comparing both systems on one question."""

    question: str
    expected_answer: str
    dust_result: QueryResult
    graphrag_result: QueryResult
    dust_scores: dict[str, float]
    graphrag_scores: dict[str, float]


class ExperimentRunner:
    """Orchestrates comparison experiments between RAG systems.

    Runs experiments using OPIK's evaluate() function for proper
    experiment tracking in the dashboard.
    """

    def __init__(
        self,
        dust_client: RAGClient,
        graphrag_client: RAGClient,
        config: ExperimentConfig,
    ) -> None:
        """Initialize experiment runner.

        Args:
            dust_client: Client for Dust RAG system.
            graphrag_client: Client for GraphRAG system.
            config: Experiment configuration.
        """
        self.dust_client = dust_client
        self.graphrag_client = graphrag_client
        self.config = config
        self._loop: Optional[asyncio.AbstractEventLoop] = None

        # Configure OPIK
        opik.configure(api_key=config.opik_api_key)
        self._client = opik.Opik()

    def _get_loop(self) -> asyncio.AbstractEventLoop:
        """Get or create event loop for async operations."""
        try:
            return asyncio.get_running_loop()
        except RuntimeError:
            if self._loop is None or self._loop.is_closed():
                self._loop = asyncio.new_event_loop()
            return self._loop

    def _get_metrics(self) -> list[BaseMetric]:
        """Get list of metrics based on configuration.

        Returns:
            List of BaseMetric instances to use for evaluation.
        """
        metrics: list[BaseMetric] = []

        for metric_name in self.config.metrics:
            if metric_name == "contains":
                metrics.append(Contains(case_sensitive=False))
            elif metric_name == "latency":
                metrics.append(LatencyMetric())
            elif metric_name == "status":
                metrics.append(StatusMetric())
            elif metric_name == "llm_precision" and self.config.enable_llm_judge:
                if self.config.openai_api_key:
                    metrics.append(LLMPrecisionJudge(
                        model=self.config.openai_model,
                        api_key=self.config.openai_api_key,
                    ))
                else:
                    logger.warning("LLM precision metric requested but OPENAI_API_KEY not set")

        return metrics

    def _create_task_function(self, client: RAGClient) -> Callable[[dict[str, Any]], dict[str, Any]]:
        """Create a task function for OPIK evaluate().

        Args:
            client: RAG client to use for queries.

        Returns:
            Task function compatible with OPIK evaluate().
        """
        def task(item: dict[str, Any]) -> dict[str, Any]:
            """Execute RAG query and return results for scoring."""
            # Extract question from nested structure
            input_data = item.get("input", {})
            expected_data = item.get("expected_output", {})

            question = input_data.get("question", "") if isinstance(input_data, dict) else str(input_data)
            expected = expected_data.get("answer", "") if isinstance(expected_data, dict) else str(expected_data)

            # Run async query in a new event loop
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(client.query(question))
                finally:
                    loop.close()
            except Exception as e:
                result = QueryResult.error(str(e))

            # Return dict with all fields needed by metrics
            return {
                "output": result.answer,
                "reference": expected,  # For Contains metric
                "input": question,
                "expected_output": expected,
                "latency_ms": result.latency_ms,
                "status": result.status,
            }

        return task

    async def run_experiment(
        self,
        dataset_name: str,
        experiment_name: Optional[str] = None,
        sample_size: Optional[int] = None,
    ) -> dict:
        """Run a complete comparison experiment.

        Creates two OPIK experiments - one for Dust and one for GraphRAG -
        allowing side-by-side comparison in the dashboard.

        Args:
            dataset_name: OPIK dataset to use (e.g., 'civic-law-eval').
            experiment_name: Base name for experiments (will add _dust/_graphrag suffix).
            sample_size: Optional limit on questions to evaluate.

        Returns:
            Dictionary with experiment results and OPIK URLs.
        """
        # Generate experiment name if not provided
        if experiment_name is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            experiment_name = f"rag_comparison_{timestamp}"

        logger.info(f"Starting experiment: {experiment_name}")
        logger.info(f"Dataset: {dataset_name}, Sample size: {sample_size or 'all'}")

        # Load dataset from OPIK
        try:
            dataset = self._client.get_dataset(name=dataset_name)
            logger.info(f"Loaded dataset: {dataset_name}")
        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
            raise

        metrics = self._get_metrics()
        project = self.config.opik_project_name

        # Run Dust experiment
        logger.info("Running Dust RAG experiment...")
        dust_task = self._create_task_function(self.dust_client)
        dust_result = evaluate(
            dataset=dataset,
            task=dust_task,
            scoring_metrics=metrics,
            experiment_name=f"{experiment_name}_dust",
            project_name=project,
            nb_samples=sample_size,
            experiment_config={"system": "dust", "base_experiment": experiment_name},
            verbose=1,
        )

        # Run GraphRAG experiment
        logger.info("Running GraphRAG experiment...")
        graphrag_task = self._create_task_function(self.graphrag_client)
        graphrag_result = evaluate(
            dataset=dataset,
            task=graphrag_task,
            scoring_metrics=metrics,
            experiment_name=f"{experiment_name}_graphrag",
            project_name=project,
            nb_samples=sample_size,
            experiment_config={"system": "graphrag", "base_experiment": experiment_name},
            verbose=1,
        )

        # Build summary
        summary = self._build_summary_from_results(
            experiment_name=experiment_name,
            dust_result=dust_result,
            graphrag_result=graphrag_result,
        )

        logger.info(f"Experiment complete!")
        return summary

    def _build_summary_from_results(
        self,
        experiment_name: str,
        dust_result: Any,
        graphrag_result: Any,
    ) -> dict:
        """Build experiment summary from OPIK evaluation results.

        Args:
            experiment_name: Base name of the experiment.
            dust_result: EvaluationResult from Dust experiment.
            graphrag_result: EvaluationResult from GraphRAG experiment.

        Returns:
            Dictionary with aggregated statistics.
        """
        # Extract metrics from evaluation results
        dust_scores: dict[str, list] = {}
        graphrag_scores: dict[str, list] = {}

        def extract_scores(result: Any, scores_dict: dict[str, list]) -> None:
            """Extract scores from OPIK EvaluationResult."""
            if not hasattr(result, 'test_results'):
                return
            for test_result in result.test_results:
                if not hasattr(test_result, 'score_results'):
                    continue
                for score in test_result.score_results:
                    name = score.name
                    if name not in scores_dict:
                        scores_dict[name] = []
                    scores_dict[name].append(score.value)

        try:
            extract_scores(dust_result, dust_scores)
            extract_scores(graphrag_result, graphrag_scores)
        except Exception as e:
            logger.warning(f"Could not extract detailed scores: {e}")

        # Calculate averages
        def avg(values: list) -> float:
            return sum(values) / len(values) if values else 0.0

        dust_latencies = dust_scores.get("latency_ms", [])
        graphrag_latencies = graphrag_scores.get("latency_ms", [])
        dust_status = dust_scores.get("status", [])
        graphrag_status = graphrag_scores.get("status", [])
        dust_precision = dust_scores.get("llm_precision", [])
        graphrag_precision = graphrag_scores.get("llm_precision", [])

        return {
            "experiment_name": experiment_name,
            "dust_experiment": f"{experiment_name}_dust",
            "graphrag_experiment": f"{experiment_name}_graphrag",
            "dust": {
                "success_rate": avg(dust_status),
                "avg_latency_ms": avg(dust_latencies),
                "min_latency_ms": min(dust_latencies) if dust_latencies else 0,
                "max_latency_ms": max(dust_latencies) if dust_latencies else 0,
                "llm_precision": avg(dust_precision),
            },
            "graphrag": {
                "success_rate": avg(graphrag_status),
                "avg_latency_ms": avg(graphrag_latencies),
                "min_latency_ms": min(graphrag_latencies) if graphrag_latencies else 0,
                "max_latency_ms": max(graphrag_latencies) if graphrag_latencies else 0,
                "llm_precision": avg(graphrag_precision),
            },
            "opik_dashboard": f"https://www.comet.com/opik/{self.config.opik_project_name}",
        }
