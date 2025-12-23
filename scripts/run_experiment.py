#!/usr/bin/env python3
"""CLI entry point for running RAG comparison experiments.

Usage:
    python scripts/run_experiment.py --dataset civic-law-eval --sample 5
    python scripts/run_experiment.py --dataset civic-law-eval --name my-experiment
    python scripts/run_experiment.py --dataset civic-law-eval --enable-llm-judge
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from rag_comparison.clients.dust_client import DustClient
from rag_comparison.clients.graphrag_client import GraphRAGClient
from rag_comparison.config import ExperimentConfig
from rag_comparison.runner import ExperimentRunner


def setup_logging(verbose: bool = False) -> None:
    """Configure logging for the CLI.

    Args:
        verbose: If True, set DEBUG level; otherwise INFO.
    """
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler()],
    )


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments.

    Returns:
        Parsed arguments namespace.
    """
    parser = argparse.ArgumentParser(
        description="Run RAG comparison experiments between Dust and GraphRAG",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run on full dataset
  python scripts/run_experiment.py --dataset civic-law-eval

  # Run on sample for testing
  python scripts/run_experiment.py --dataset civic-law-eval --sample 5

  # Run with custom experiment name
  python scripts/run_experiment.py --dataset civic-law-eval --name my-test

  # Run with LLM-as-judge metric (requires OPENAI_API_KEY)
  python scripts/run_experiment.py --dataset civic-law-eval --enable-llm-judge
        """,
    )

    parser.add_argument(
        "--dataset",
        required=True,
        help="OPIK dataset name (e.g., civic-law-eval)",
    )
    parser.add_argument(
        "--name",
        help="Custom experiment name (default: auto-generated with timestamp)",
    )
    parser.add_argument(
        "--sample",
        type=int,
        help="Limit to N questions for testing",
    )
    parser.add_argument(
        "--enable-llm-judge",
        action="store_true",
        help="Enable LLM-as-judge metric (requires OPENAI_API_KEY)",
    )
    parser.add_argument(
        "--metrics",
        help="Comma-separated list of metrics (default: contains,latency,status)",
    )
    parser.add_argument(
        "--output",
        choices=["json", "markdown", "text"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        help="Path to .env file (default: .env in current directory)",
    )

    return parser.parse_args()


def format_output(results: dict, format_type: str) -> str:
    """Format experiment results for display.

    Args:
        results: Experiment results dictionary.
        format_type: Output format ('json', 'markdown', or 'text').

    Returns:
        Formatted string representation.
    """
    if format_type == "json":
        return json.dumps(results, indent=2)

    if format_type == "markdown":
        lines = [
            f"# Experiment: {results['experiment_name']}",
            "",
            f"**Questions evaluated**: {results['question_count']}",
            "",
            "## Dust RAG",
            f"- Success rate: {results['dust']['success_rate']:.1%}",
            f"- Avg latency: {results['dust']['avg_latency_ms']:.0f}ms",
            f"- Min/Max: {results['dust']['min_latency_ms']:.0f}ms / {results['dust']['max_latency_ms']:.0f}ms",
            "",
            "## GraphRAG",
            f"- Success rate: {results['graphrag']['success_rate']:.1%}",
            f"- Avg latency: {results['graphrag']['avg_latency_ms']:.0f}ms",
            f"- Min/Max: {results['graphrag']['min_latency_ms']:.0f}ms / {results['graphrag']['max_latency_ms']:.0f}ms",
            "",
            f"**OPIK Dashboard**: {results['opik_dashboard']}",
        ]
        return "\n".join(lines)

    # Text format (default)
    lines = [
        f"\n{'='*60}",
        f"  Experiment: {results['experiment_name']}",
        f"  Questions: {results['question_count']}",
        f"{'='*60}",
        "",
        "  DUST RAG:",
        f"    Success rate: {results['dust']['success_rate']:.1%}",
        f"    Avg latency:  {results['dust']['avg_latency_ms']:.0f}ms",
        "",
        "  GRAPHRAG:",
        f"    Success rate: {results['graphrag']['success_rate']:.1%}",
        f"    Avg latency:  {results['graphrag']['avg_latency_ms']:.0f}ms",
        "",
        f"  OPIK Dashboard: {results['opik_dashboard']}",
        f"{'='*60}\n",
    ]
    return "\n".join(lines)


async def run_experiment(args: argparse.Namespace) -> dict:
    """Run the experiment with the given arguments.

    Args:
        args: Parsed command-line arguments.

    Returns:
        Experiment results dictionary.
    """
    # Load configuration
    env_path = str(args.env_file) if args.env_file else None
    config = ExperimentConfig.from_env(env_path)

    # Override config from CLI args
    if args.enable_llm_judge:
        config.enable_llm_judge = True
        if "llm_precision" not in config.metrics:
            config.metrics.append("llm_precision")

    if args.metrics:
        config.metrics = [m.strip() for m in args.metrics.split(",")]

    # Validate configuration
    warnings = config.validate()
    logger = logging.getLogger(__name__)
    for warning in warnings:
        logger.warning(warning)

    # Create clients
    dust_client = DustClient(
        api_key=config.dust_api_key,
        workspace_id=config.dust_workspace_id,
        agent_id=config.dust_agent_id,
        timeout=config.timeout_seconds,
    )

    graphrag_client = GraphRAGClient(
        api_url=config.graphrag_api_url,
        timeout=config.timeout_seconds,
        default_mode=config.graphrag_mode,
        default_book_id=config.graphrag_book_id,
    )

    # Run experiment
    runner = ExperimentRunner(
        dust_client=dust_client,
        graphrag_client=graphrag_client,
        config=config,
    )

    try:
        results = await runner.run_experiment(
            dataset_name=args.dataset,
            experiment_name=args.name,
            sample_size=args.sample,
        )
        return results
    finally:
        # Clean up
        await dust_client.close()
        await graphrag_client.close()


def main() -> None:
    """CLI entry point."""
    args = parse_args()
    setup_logging(args.verbose)

    try:
        results = asyncio.run(run_experiment(args))
        output = format_output(results, args.output)
        print(output)
    except KeyboardInterrupt:
        print("\nExperiment cancelled.")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Experiment failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
