"""Result dataclasses and formatting for RAG comparison experiments."""

from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class SystemMetrics:
    """Aggregated metrics for one RAG system.

    Provides statistical summaries of performance across
    all questions in an experiment.
    """

    system_name: str
    """Identifier: 'dust' or 'graphrag'."""

    success_rate: float
    """Proportion of successful queries (0.0 to 1.0)."""

    avg_latency_ms: float
    """Mean response time in milliseconds."""

    p50_latency_ms: float
    """Median (50th percentile) latency."""

    p95_latency_ms: float
    """95th percentile latency."""

    min_latency_ms: float
    """Minimum observed latency."""

    max_latency_ms: float
    """Maximum observed latency."""

    metric_scores: dict[str, dict[str, float]] = field(default_factory=dict)
    """Per-metric statistics: {metric_name: {mean, min, max, std}}."""

    @classmethod
    def from_latencies(
        cls,
        system_name: str,
        latencies: list[float],
        success_count: int,
        total_count: int,
        metric_scores: Optional[dict[str, list[float]]] = None,
    ) -> SystemMetrics:
        """Create SystemMetrics from raw latency data.

        Args:
            system_name: System identifier.
            latencies: List of successful query latencies.
            success_count: Number of successful queries.
            total_count: Total number of queries.
            metric_scores: Optional per-metric score lists.

        Returns:
            Computed SystemMetrics instance.
        """
        if not latencies:
            return cls(
                system_name=system_name,
                success_rate=0.0,
                avg_latency_ms=0.0,
                p50_latency_ms=0.0,
                p95_latency_ms=0.0,
                min_latency_ms=0.0,
                max_latency_ms=0.0,
            )

        sorted_latencies = sorted(latencies)
        n = len(sorted_latencies)

        # Compute percentiles
        p50_idx = int(n * 0.50)
        p95_idx = min(int(n * 0.95), n - 1)

        # Aggregate metric scores
        aggregated_metrics: dict[str, dict[str, float]] = {}
        if metric_scores:
            for name, values in metric_scores.items():
                if values:
                    aggregated_metrics[name] = {
                        "mean": statistics.mean(values),
                        "min": min(values),
                        "max": max(values),
                        "std": statistics.stdev(values) if len(values) > 1 else 0.0,
                    }

        return cls(
            system_name=system_name,
            success_rate=success_count / total_count if total_count > 0 else 0.0,
            avg_latency_ms=statistics.mean(latencies),
            p50_latency_ms=sorted_latencies[p50_idx],
            p95_latency_ms=sorted_latencies[p95_idx],
            min_latency_ms=min(latencies),
            max_latency_ms=max(latencies),
            metric_scores=aggregated_metrics,
        )


@dataclass
class ExperimentResult:
    """Complete experiment result with both system metrics."""

    experiment_id: str
    """Unique identifier for this experiment."""

    experiment_name: str
    """Human-readable experiment name."""

    created_at: datetime
    """Timestamp when experiment completed."""

    dataset_name: str
    """Source dataset used for evaluation."""

    question_count: int
    """Total number of questions evaluated."""

    dust_metrics: SystemMetrics
    """Aggregated metrics for Dust RAG."""

    graphrag_metrics: SystemMetrics
    """Aggregated metrics for GraphRAG."""

    comparison_summary: dict[str, str] = field(default_factory=dict)
    """Summary: {'winner': 'graphrag', 'margin': '15%'}."""

    opik_project: str = "law_graphRAG"
    """OPIK project name for dashboard link."""

    def to_markdown_report(self) -> str:
        """Generate a markdown summary report.

        Returns:
            Formatted markdown string.
        """
        lines = [
            f"# RAG Comparison Report: {self.experiment_name}",
            "",
            f"**Date**: {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Dataset**: {self.dataset_name}",
            f"**Questions**: {self.question_count}",
            "",
            "---",
            "",
            "## Summary",
            "",
        ]

        # Add winner if determined
        if self.comparison_summary:
            winner = self.comparison_summary.get("winner", "tie")
            margin = self.comparison_summary.get("margin", "")
            if winner != "tie":
                lines.append(f"**Winner**: {winner.upper()} ({margin})")
            else:
                lines.append("**Result**: Tie (similar performance)")
            lines.append("")

        # Dust section
        lines.extend([
            "## Dust RAG",
            "",
            f"| Metric | Value |",
            f"|--------|-------|",
            f"| Success Rate | {self.dust_metrics.success_rate:.1%} |",
            f"| Avg Latency | {self.dust_metrics.avg_latency_ms:.0f}ms |",
            f"| P50 Latency | {self.dust_metrics.p50_latency_ms:.0f}ms |",
            f"| P95 Latency | {self.dust_metrics.p95_latency_ms:.0f}ms |",
            "",
        ])

        # Add metric scores for Dust
        if self.dust_metrics.metric_scores:
            lines.append("### Metric Scores")
            lines.append("")
            lines.append("| Metric | Mean | Min | Max |")
            lines.append("|--------|------|-----|-----|")
            for name, stats in self.dust_metrics.metric_scores.items():
                lines.append(
                    f"| {name} | {stats['mean']:.3f} | {stats['min']:.3f} | {stats['max']:.3f} |"
                )
            lines.append("")

        # GraphRAG section
        lines.extend([
            "## GraphRAG",
            "",
            f"| Metric | Value |",
            f"|--------|-------|",
            f"| Success Rate | {self.graphrag_metrics.success_rate:.1%} |",
            f"| Avg Latency | {self.graphrag_metrics.avg_latency_ms:.0f}ms |",
            f"| P50 Latency | {self.graphrag_metrics.p50_latency_ms:.0f}ms |",
            f"| P95 Latency | {self.graphrag_metrics.p95_latency_ms:.0f}ms |",
            "",
        ])

        # Add metric scores for GraphRAG
        if self.graphrag_metrics.metric_scores:
            lines.append("### Metric Scores")
            lines.append("")
            lines.append("| Metric | Mean | Min | Max |")
            lines.append("|--------|------|-----|-----|")
            for name, stats in self.graphrag_metrics.metric_scores.items():
                lines.append(
                    f"| {name} | {stats['mean']:.3f} | {stats['min']:.3f} | {stats['max']:.3f} |"
                )
            lines.append("")

        # Dashboard link
        lines.extend([
            "---",
            "",
            f"**OPIK Dashboard**: [{self.opik_project}]({self.get_opik_url()})",
        ])

        return "\n".join(lines)

    def get_opik_url(self) -> str:
        """Get the OPIK dashboard URL for this experiment.

        Returns:
            Full URL to the OPIK project dashboard.
        """
        return f"https://www.comet.com/opik/{self.opik_project}"

    def determine_winner(self) -> None:
        """Determine the winning system and update comparison_summary.

        Considers: success rate (40%), latency (30%), metric scores (30%).
        """
        dust_score = 0.0
        graphrag_score = 0.0

        # Success rate comparison (40% weight)
        if self.dust_metrics.success_rate > self.graphrag_metrics.success_rate:
            dust_score += 0.4
        elif self.graphrag_metrics.success_rate > self.dust_metrics.success_rate:
            graphrag_score += 0.4
        else:
            dust_score += 0.2
            graphrag_score += 0.2

        # Latency comparison (30% weight) - lower is better
        if self.dust_metrics.avg_latency_ms < self.graphrag_metrics.avg_latency_ms:
            dust_score += 0.3
        elif self.graphrag_metrics.avg_latency_ms < self.dust_metrics.avg_latency_ms:
            graphrag_score += 0.3
        else:
            dust_score += 0.15
            graphrag_score += 0.15

        # Metric scores comparison (30% weight)
        dust_metric_avg = 0.0
        graphrag_metric_avg = 0.0
        metric_count = 0

        for name in self.dust_metrics.metric_scores:
            if name in self.graphrag_metrics.metric_scores:
                dust_metric_avg += self.dust_metrics.metric_scores[name]["mean"]
                graphrag_metric_avg += self.graphrag_metrics.metric_scores[name]["mean"]
                metric_count += 1

        if metric_count > 0:
            dust_metric_avg /= metric_count
            graphrag_metric_avg /= metric_count

            if dust_metric_avg > graphrag_metric_avg:
                dust_score += 0.3
            elif graphrag_metric_avg > dust_metric_avg:
                graphrag_score += 0.3
            else:
                dust_score += 0.15
                graphrag_score += 0.15

        # Determine winner
        margin = abs(dust_score - graphrag_score)
        if margin < 0.1:
            self.comparison_summary = {"winner": "tie", "margin": f"{margin:.0%}"}
        elif dust_score > graphrag_score:
            self.comparison_summary = {"winner": "dust", "margin": f"{margin:.0%}"}
        else:
            self.comparison_summary = {"winner": "graphrag", "margin": f"{margin:.0%}"}
