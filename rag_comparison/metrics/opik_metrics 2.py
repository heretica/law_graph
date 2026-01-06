"""OPIK built-in metrics wrappers for RAG comparison evaluation.

This module provides wrappers around OPIK's built-in LLM-as-Judge metrics
to ensure consistent interface and scoring interpretation for the RAG
comparison framework.

Rate limiting is implemented via a shared lock to prevent overwhelming
OpenAI's API when multiple metrics are evaluated in parallel.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional

from opik.evaluation.metrics import BaseMetric, GEval
from opik.evaluation.metrics.score_result import ScoreResult

logger = logging.getLogger(__name__)

# Shared rate limiter for all LLM-based metrics
# This ensures only one LLM call happens at a time across all metrics
_llm_rate_lock = threading.Lock()
_last_llm_call_time = 0.0
_min_delay_between_calls = 0.5  # 500ms minimum between LLM calls


def _rate_limited_call(func, *args, **kwargs):
    """Execute a function with rate limiting.

    Ensures minimum delay between LLM API calls to avoid rate limits.
    """
    global _last_llm_call_time

    with _llm_rate_lock:
        # Calculate time since last call
        now = time.time()
        elapsed = now - _last_llm_call_time

        # Wait if needed
        if elapsed < _min_delay_between_calls:
            sleep_time = _min_delay_between_calls - elapsed
            time.sleep(sleep_time)

        # Execute the call
        result = func(*args, **kwargs)

        # Update last call time
        _last_llm_call_time = time.time()

        return result


class MeaningMatchMetric(BaseMetric):
    """Semantic meaning match metric using GEval.

    Evaluates whether the RAG response captures the same semantic meaning
    as the expected answer, even if the wording differs. This is particularly
    useful for civic discourse analysis where concepts can be expressed
    in multiple valid ways.
    """

    def __init__(self, model: str = "gpt-4o-mini") -> None:
        """Initialize the MeaningMatch metric.

        Args:
            model: OpenAI model to use for evaluation.
        """
        self._name = "meaning_match"
        self._geval = GEval(
            task_introduction="""You are an expert semantic similarity judge
evaluating whether two texts convey the same meaning in the context of
French civic discourse and the Grand Débat National.""",
            evaluation_criteria="""
Compare the OUTPUT (RAG response) with the REFERENCE (expected answer).
Score based on semantic equivalence, NOT lexical similarity.

Scoring criteria:
- 1.0: Semantically equivalent - same core meaning, facts, and conclusions
- 0.8-0.9: Mostly equivalent with minor semantic differences
- 0.5-0.7: Partially equivalent - overlapping concepts but missing key meanings
- 0.2-0.4: Weakly related - some topical overlap but different conclusions
- 0.0-0.1: Semantically unrelated or contradictory

Consider:
1. Core factual claims match
2. Civic concepts are equivalent (even if different terminology)
3. Conclusions and implications align
4. Missing information vs contradictory information
""",
            model=model,
        )

    @property
    def name(self) -> str:
        return self._name

    def score(
        self,
        output: str,
        expected_output: Optional[str] = None,
        reference: Optional[str] = None,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score semantic meaning match between output and reference.

        Args:
            output: The RAG system's response.
            expected_output: The expected/reference answer.
            reference: Alternative name for expected_output.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with meaning match score (0-1).
        """
        ref = expected_output or reference or ""
        if not ref:
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason="No reference provided for meaning comparison",
            )

        try:
            # Format input for GEval
            eval_text = f"""
OUTPUT: {output}
REFERENCE: {ref}
"""
            # Use rate-limited call to avoid OpenAI rate limits
            result = _rate_limited_call(self._geval.score, output=eval_text)
            return ScoreResult(
                name=self._name,
                value=result.value,
                reason=result.reason,
            )
        except Exception as e:
            logger.error(f"MeaningMatch evaluation failed: {e}")
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason=f"Evaluation failed: {str(e)}",
            )


class AnswerRelevanceWrapper(BaseMetric):
    """Wrapper for OPIK's AnswerRelevance metric.

    Evaluates how relevant the RAG response is to the input question.
    """

    def __init__(self, model: str = "gpt-4o-mini") -> None:
        """Initialize the AnswerRelevance metric.

        Args:
            model: Model to use for evaluation.
        """
        from opik.evaluation.metrics import AnswerRelevance

        self._name = "answer_relevance"
        # Allow execution without context since our dataset doesn't always have it
        self._metric = AnswerRelevance(model=model, require_context=False)

    @property
    def name(self) -> str:
        return self._name

    def score(
        self,
        output: str,
        input: str,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score answer relevance.

        Args:
            output: The RAG system's response.
            input: The original question.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with relevance score (0-1).
        """
        try:
            # Use rate-limited call to avoid OpenAI rate limits
            result = _rate_limited_call(self._metric.score, input=input, output=output)
            return ScoreResult(
                name=self._name,
                value=result.value,
                reason=result.reason,
            )
        except Exception as e:
            logger.error(f"AnswerRelevance evaluation failed: {e}")
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason=f"Evaluation failed: {str(e)}",
            )


class HallucinationWrapper(BaseMetric):
    """Wrapper for OPIK's Hallucination metric.

    Detects whether the RAG response contains hallucinated information.
    Note: OPIK returns 1.0 for hallucination detected, 0.0 for no hallucination.
    We invert this to make higher scores = better (no hallucination).
    """

    def __init__(self, model: str = "gpt-4o-mini") -> None:
        """Initialize the Hallucination metric.

        Args:
            model: Model to use for evaluation.
        """
        from opik.evaluation.metrics import Hallucination

        self._name = "hallucination"
        self._metric = Hallucination(model=model)

    @property
    def name(self) -> str:
        return self._name

    def score(
        self,
        output: str,
        input: str,
        expected_output: Optional[str] = None,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score hallucination (inverted - higher = better).

        Args:
            output: The RAG system's response.
            input: The original question.
            expected_output: Context/reference for faithfulness check.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with faithfulness score (0-1, higher = less hallucination).
        """
        try:
            # Use expected_output as context if available
            context = [expected_output] if expected_output else None
            # Use rate-limited call to avoid OpenAI rate limits
            result = _rate_limited_call(
                self._metric.score, input=input, output=output, context=context
            )

            # Invert score: OPIK returns 1.0 for hallucination, we want 1.0 for faithful
            inverted_score = 1.0 - result.value

            return ScoreResult(
                name=self._name,
                value=inverted_score,
                reason=f"Faithfulness: {result.reason}",
            )
        except Exception as e:
            logger.error(f"Hallucination evaluation failed: {e}")
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason=f"Evaluation failed: {str(e)}",
            )


class UsefulnessWrapper(BaseMetric):
    """Wrapper for OPIK's Usefulness metric.

    Evaluates how useful/helpful the RAG response is for the user.
    """

    def __init__(self, model: str = "gpt-4o-mini") -> None:
        """Initialize the Usefulness metric.

        Args:
            model: Model to use for evaluation.
        """
        from opik.evaluation.metrics import Usefulness

        self._name = "usefulness"
        self._metric = Usefulness(model=model)

    @property
    def name(self) -> str:
        return self._name

    def score(
        self,
        output: str,
        input: str,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score usefulness.

        Args:
            output: The RAG system's response.
            input: The original question.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with usefulness score (0-1).
        """
        try:
            # Use rate-limited call to avoid OpenAI rate limits
            result = _rate_limited_call(self._metric.score, input=input, output=output)
            return ScoreResult(
                name=self._name,
                value=result.value,
                reason=result.reason,
            )
        except Exception as e:
            logger.error(f"Usefulness evaluation failed: {e}")
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason=f"Evaluation failed: {str(e)}",
            )
