#!/usr/bin/env python3
"""CLI entry point for RAG comparison experiments.

Usage:
    # Run full comparison (Dust vs GraphRAG)
    python -m rag_comparison.run_experiment --dataset civic-law-eval

    # Run GraphRAG only (post-surgery validation)
    python -m rag_comparison.run_experiment --dataset civic-law-eval --graphrag-only

    # Run with sample size
    python -m rag_comparison.run_experiment --dataset civic-law-eval --sample-size 10
"""

import argparse
import asyncio
import logging
import sys
from typing import Optional

from rag_comparison.clients.dust_client import DustClient
from rag_comparison.clients.mcp_client import MCPGraphRAGClient
from rag_comparison.config import ExperimentConfig
from rag_comparison.runner import ExperimentRunner

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Run RAG comparison experiments with OPIK evaluation'
    )
    parser.add_argument(
        '--dataset',
        type=str,
        default='civic-law-eval',
        help='OPIK dataset name (default: civic-law-eval)'
    )
    parser.add_argument(
        '--name',
        type=str,
        default=None,
        help='Experiment name (default: auto-generated timestamp)'
    )
    parser.add_argument(
        '--sample-size',
        type=int,
        default=None,
        help='Number of questions to evaluate (default: all)'
    )
    parser.add_argument(
        '--dust-only',
        action='store_true',
        help='Run only Dust RAG experiment'
    )
    parser.add_argument(
        '--graphrag-only',
        action='store_true',
        help='Run only GraphRAG experiment (production MCP)'
    )
    parser.add_argument(
        '--mcp-url',
        type=str,
        default='https://graphragmcp-production.up.railway.app/mcp',
        help='MCP server URL (default: production)'
    )

    return parser.parse_args()


async def main():
    """Main entry point for experiment runner."""
    args = parse_args()

    # Load configuration from environment
    try:
        config = ExperimentConfig.from_env()
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)

    # Validate configuration
    warnings = config.validate()
    for warning in warnings:
        logger.warning(warning)

    # Initialize clients based on mode
    if args.graphrag_only:
        logger.info("Running GraphRAG-only experiment (production MCP)")

        # Use MCPGraphRAGClient with production endpoint
        graphrag_client = MCPGraphRAGClient(
            api_url=args.mcp_url,
            timeout=config.timeout_seconds,
            default_mode='local',
        )

        # Create a dummy Dust client (won't be used)
        dust_client = None

    elif args.dust_only:
        logger.info("Running Dust-only experiment")

        dust_client = DustClient(
            api_key=config.dust_api_key,
            workspace_id=config.dust_workspace_id,
            agent_id=config.dust_agent_id,
            timeout=config.timeout_seconds,
        )

        # Create a dummy GraphRAG client (won't be used)
        graphrag_client = None

    else:
        logger.info("Running full comparison (Dust vs GraphRAG)")

        dust_client = DustClient(
            api_key=config.dust_api_key,
            workspace_id=config.dust_workspace_id,
            agent_id=config.dust_agent_id,
            timeout=config.timeout_seconds,
        )

        graphrag_client = MCPGraphRAGClient(
            api_url=args.mcp_url,
            timeout=config.timeout_seconds,
            default_mode='local',
        )

    # For single-system experiments, we still need both clients for ExperimentRunner
    # Just use dummy clients that will be ignored
    if dust_client is None:
        dust_client = graphrag_client  # Reuse GraphRAG client as placeholder
    if graphrag_client is None:
        graphrag_client = dust_client  # Reuse Dust client as placeholder

    # Create runner
    runner = ExperimentRunner(
        dust_client=dust_client,
        graphrag_client=graphrag_client,
        config=config,
    )

    # Run experiment
    try:
        logger.info(f"Starting experiment on dataset: {args.dataset}")
        logger.info(f"Sample size: {args.sample_size or 'all'}")

        result = await runner.run_experiment(
            dataset_name=args.dataset,
            experiment_name=args.name,
            sample_size=args.sample_size,
        )

        # Print summary
        print("\n" + "="*70)
        print("EXPERIMENT COMPLETE")
        print("="*70)
        print(f"Experiment name: {result['experiment_name']}")
        print(f"Questions evaluated: {result['question_count']}")
        print(f"\nView results: {result['opik_dashboard']}")
        print("="*70 + "\n")

        # Print metrics
        if not args.graphrag_only:
            print("Dust:")
            print(f"  Success rate: {result['dust']['success_rate']:.1%}")
            print(f"  Avg latency: {result['dust']['avg_latency_ms']:.0f}ms")
            print(f"  LLM precision: {result['dust']['llm_precision']:.1%}")
            print()

        if not args.dust_only:
            print("graphRAG_surgical:")
            print(f"  Success rate: {result['graphrag']['success_rate']:.1%}")
            print(f"  Avg latency: {result['graphrag']['avg_latency_ms']:.0f}ms")
            print(f"  LLM precision: {result['graphrag']['llm_precision']:.1%}")
            print()

        return 0

    except Exception as e:
        logger.error(f"Experiment failed: {e}", exc_info=True)
        return 1


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
