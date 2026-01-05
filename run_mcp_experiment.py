#!/usr/bin/env python3
"""Run OPIK evaluation experiment for MCP GraphRAG (production endpoint).

This script runs a focused experiment testing only the GraphRAG MCP server
without comparison to other systems. Used for post-surgery validation.

Usage:
    python run_mcp_experiment.py --name "GraphRAG-Post-Surgery" --sample-size 54
"""

import argparse
import asyncio
import logging
import os
import sys
from datetime import datetime

from dotenv import load_dotenv
import nest_asyncio
import opik
from opik.evaluation import evaluate
from opik.evaluation.metrics import BaseMetric

# Load environment variables from .env file
load_dotenv()

# Allow nested event loops for OPIK
nest_asyncio.apply()

from rag_comparison.clients.mcp_client import MCPGraphRAGClient
from rag_comparison.clients.base import QueryResult
from rag_comparison.metrics.latency import LatencyMetric
from rag_comparison.metrics.status import StatusMetric
from rag_comparison.metrics.llm_judge import LLMPrecisionJudge
from rag_comparison.metrics.opik_metrics import (
    AnswerRelevanceWrapper,
    HallucinationWrapper,
    MeaningMatchMetric,
    UsefulnessWrapper,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Run GraphRAG MCP evaluation experiment'
    )
    parser.add_argument(
        '--name',
        type=str,
        default=None,
        help='Experiment name (default: auto-generated)'
    )
    parser.add_argument(
        '--sample-size',
        type=int,
        default=None,
        help='Number of questions to evaluate (default: all 54)'
    )
    parser.add_argument(
        '--mcp-url',
        type=str,
        default='https://graphragmcp-production.up.railway.app/mcp',
        help='MCP server URL'
    )
    parser.add_argument(
        '--dataset',
        type=str,
        default='civic-law-eval',
        help='OPIK dataset name'
    )
    parser.add_argument(
        '--timeout',
        type=float,
        default=300.0,
        help='Query timeout in seconds (default: 300, surgical endpoint needs ~90-120s per query)'
    )

    return parser.parse_args()


def get_metrics() -> list[BaseMetric]:
    """Get evaluation metrics with LLM-as-judge.

    Returns:
        List of metrics to use for evaluation.
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    metrics: list[BaseMetric] = [
        LatencyMetric(),
        StatusMetric(),
    ]

    # Add LLM-as-judge metrics if OpenAI key is available
    if openai_api_key:
        logger.info(f"LLM-as-judge enabled with model: {openai_model}")
        metrics.extend([
            LLMPrecisionJudge(model=openai_model, api_key=openai_api_key),
            AnswerRelevanceWrapper(model=openai_model),
            HallucinationWrapper(model=openai_model),
            MeaningMatchMetric(model=openai_model),
            UsefulnessWrapper(model=openai_model),
        ])
    else:
        logger.warning("OPENAI_API_KEY not set - skipping LLM-as-judge metrics")

    return metrics


def create_task_function(client: MCPGraphRAGClient):
    """Create OPIK task function for GraphRAG MCP queries.

    Args:
        client: Configured MCP GraphRAG client.

    Returns:
        Task function compatible with OPIK evaluate().
    """
    def task(item: dict) -> dict:
        """Execute GraphRAG MCP query and return results."""
        # Extract question from OPIK dataset item
        input_data = item.get("input", {})
        expected_data = item.get("expected_output", {})

        question = input_data.get("question", "") if isinstance(input_data, dict) else str(input_data)
        expected = expected_data.get("answer", "") if isinstance(expected_data, dict) else str(expected_data)

        # Run async query in new event loop
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(client.query(question))
            finally:
                loop.close()
        except Exception as e:
            logger.error(f"Query failed for: {question[:50]}... - {e}")
            result = QueryResult.error(str(e))

        # Extract context and provenance from raw_response for debugging
        raw_resp = result.raw_response or {}

        # DEBUG: Log raw_response structure
        logger.info(f"🔍 raw_response keys: {list(raw_resp.keys())}")
        logger.info(f"🔍 raw_response sample: {str(raw_resp)[:500]}")

        provenance = raw_resp.get("provenance", {})
        performance = raw_resp.get("performance", {})

        # CRITICAL: Extract LLM context (the actual text sent to gpt5_nano)
        # For surgical endpoint: context is in mini_worlds array (per commune)
        # For now, extract from first mini_world if available
        llm_context = ""
        mini_worlds = raw_resp.get("mini_worlds", [])
        if mini_worlds and len(mini_worlds) > 0:
            first_mini_world = mini_worlds[0]
            if isinstance(first_mini_world, dict):
                llm_context = first_mini_world.get("llm_context", "")

        # If not in mini_worlds, check provenance directly (standard endpoint)
        if not llm_context:
            llm_context = provenance.get("llm_context", "")

        llm_context_length = len(llm_context)
        logger.info(f"📋 LLM Context length: {llm_context_length} chars ({llm_context_length/4:.0f} tokens approx)")

        # Extract stats (surgical endpoint has nested 'stats' dict)
        stats = provenance.get("stats", {})

        context_metadata = {
            "graph_entities_count": stats.get("total_entities") or len(provenance.get("entities", [])),
            "graph_relationships_count": stats.get("total_relationships") or len(provenance.get("relationships", [])),
            "graph_communities_count": len(provenance.get("communities", [])),
            "graph_chunks_count": stats.get("total_chunks", 0),
            "source_quotes_count": len(provenance.get("source_quotes", [])),
            "communes_searched": stats.get("communes_searched"),
            "communes_with_results": stats.get("communes_with_results"),
            "mini_worlds_count": len(provenance.get("mini_worlds", [])),
            "performance_phases": performance.get("phases", {}),
            "total_seconds": performance.get("total_seconds"),
        }

        # Extract first 3 entities and relationships as sample
        sample_entities = [
            {"name": e.get("name"), "type": e.get("type"), "commune": e.get("commune")}
            for e in provenance.get("entities", [])[:3]
        ]

        sample_relationships = [
            {"source": r.get("source"), "target": r.get("target"), "type": r.get("type")}
            for r in provenance.get("relationships", [])[:3]
        ]

        # Log context metadata for verification
        logger.info(f"📊 Context metadata: {context_metadata.get('graph_entities_count', 0)} entities, "
                   f"{context_metadata.get('graph_relationships_count', 0)} relationships, "
                   f"{context_metadata.get('communes_searched', 0)} communes searched")

        # CRITICAL: Surgical endpoint returns ~120-150k tokens (50 communes)
        # LLM judges have 128k token limit, so we need to truncate for evaluation
        # while preserving full answer in metadata
        answer_length = len(result.answer)
        max_chars_for_judges = 50000  # ~25k tokens, leaves room for question + reference

        truncated_answer = result.answer
        if answer_length > max_chars_for_judges:
            truncated_answer = result.answer[:max_chars_for_judges] + f"\n\n[... truncated {answer_length - max_chars_for_judges} chars for LLM judge evaluation]"
            logger.warning(f"⚠️  Answer truncated from {answer_length} to {max_chars_for_judges} chars for LLM judges")

        # Return dict with fields needed by metrics + context metadata
        return {
            "output": truncated_answer,  # Truncated for LLM judges
            "reference": expected,
            "input": question,
            "expected_output": expected,
            "latency_ms": result.latency_ms,
            "status": result.status,
            # NEW: Context debugging metadata (lightweight for OPIK)
            "context_metadata": context_metadata,
            "sample_entities": sample_entities,
            "sample_relationships": sample_relationships,
            "full_answer_length": answer_length,  # Track original length
            # CRITICAL: LLM context sent to gpt5_nano for answer generation
            "llm_context": llm_context,  # Full context with entities, relationships, chunks
            "llm_context_length": llm_context_length,  # Track context size
            # NOTE: full_provenance removed - too large (164k tokens) for LLM judges
            # "full_provenance": provenance,
        }

    return task


async def main():
    """Main entry point for MCP experiment."""
    args = parse_args()

    # Load OPIK configuration
    opik_api_key = os.getenv("OPIK_API_KEY")
    if not opik_api_key:
        logger.error("OPIK_API_KEY not set")
        return 1

    opik.configure(api_key=opik_api_key)
    client_opik = opik.Opik()

    # Generate experiment name if not provided
    if args.name is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        args.name = f"GraphRAG_MCP_{timestamp}"

    logger.info("="*70)
    logger.info("GraphRAG MCP Evaluation Experiment")
    logger.info("="*70)
    logger.info(f"Experiment name: {args.name}")
    logger.info(f"MCP endpoint: {args.mcp_url}")
    logger.info(f"Dataset: {args.dataset}")
    logger.info(f"Sample size: {args.sample_size or 'all'}")
    logger.info(f"Timeout: {args.timeout}s")
    logger.info("="*70)

    # Initialize MCP GraphRAG client with surgical endpoint
    mcp_client = MCPGraphRAGClient(
        api_url=args.mcp_url,
        timeout=args.timeout,
        default_mode='local',
        query_endpoint='surgical',  # Use grand_debat_query_all_surgical
    )

    # Test MCP connection
    logger.info("Testing MCP connection...")
    if not await mcp_client.health_check():
        logger.error("MCP health check failed - server not accessible")
        return 1
    logger.info("✅ MCP connection successful")

    # Load dataset
    try:
        dataset = client_opik.get_dataset(name=args.dataset)
        logger.info(f"✅ Loaded dataset: {args.dataset}")
    except Exception as e:
        logger.error(f"Failed to load dataset: {e}")
        return 1

    # Get metrics
    metrics = get_metrics()
    logger.info(f"Metrics: {[type(m).__name__ for m in metrics]}")

    # Create task function
    task_fn = create_task_function(mcp_client)

    # Run evaluation
    logger.info("\n" + "="*70)
    logger.info("Starting OPIK Evaluation")
    logger.info("="*70 + "\n")

    try:
        result = evaluate(
            dataset=dataset,
            task=task_fn,
            scoring_metrics=metrics,
            experiment_name=args.name,
            project_name="law_graphRAG",
            nb_samples=args.sample_size,
            experiment_config={
                "system": "graphrag_mcp",
                "mcp_endpoint": args.mcp_url,
                "mcp_tool": "grand_debat_query_all_surgical",
                "mode": "local",
                "architecture": "Surgical RAG (56 Mini-Worlds in Parallel)",
                "optimizations": [
                    "top_k=100 (massive ontological expansion)",
                    "5-hop BFS (deep small worlds reconstitution)",
                    "Query-focused directness prompt (adaptive length)",
                    "Parallel mini-world queries (asyncio.gather)",
                    "Civic provenance chain (entity → chunk → commune)"
                ],
            },
            verbose=1,
        )

        logger.info("\n" + "="*70)
        logger.info("EXPERIMENT COMPLETE")
        logger.info("="*70)
        logger.info(f"View results: https://www.comet.com/opik/law_graphRAG")
        logger.info("="*70 + "\n")

        # Extract and print summary
        if hasattr(result, 'test_results'):
            scores = {}
            for test_result in result.test_results:
                if hasattr(test_result, 'score_results'):
                    for score in test_result.score_results:
                        if score.name not in scores:
                            scores[score.name] = []
                        scores[score.name].append(score.value)

            print("\n=== METRIC SUMMARY ===")
            for metric_name, values in scores.items():
                if values:
                    avg = sum(values) / len(values)
                    if metric_name == "latency_ms":
                        print(f"{metric_name}: {avg:.0f}ms ({avg/1000:.1f}s)")
                    elif metric_name in ["status", "llm_precision", "answer_relevance", "hallucination", "meaning_match", "usefulness"]:
                        print(f"{metric_name}: {avg:.4f} ({avg*100:.2f}%)")
                    else:
                        print(f"{metric_name}: {avg:.4f}")
            print()

        await mcp_client.close()
        return 0

    except Exception as e:
        logger.error(f"Experiment failed: {e}", exc_info=True)
        await mcp_client.close()
        return 1


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
