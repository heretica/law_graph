"""LLM-as-judge metric for semantic precision evaluation."""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

from openai import AsyncOpenAI, OpenAI
from opik.evaluation.metrics import BaseMetric
from opik.evaluation.metrics.score_result import ScoreResult

from rag_comparison.errors import LLMJudgeError

logger = logging.getLogger(__name__)


class LLMPrecisionJudge(BaseMetric):
    """LLM-as-judge metric for semantic precision evaluation.

    Uses an external language model (OpenAI) to evaluate whether a RAG response
    correctly answers a legal question, considering factual accuracy,
    completeness, and legal reasoning quality.
    """

    JUDGE_PROMPT = """You are a legal precision evaluator. Given a legal question,
an expected answer, and a RAG system response, score how precisely the response
answers the question.

Scoring criteria:
- 1.0: Perfectly accurate, complete, legally sound
- 0.8-0.9: Mostly accurate with minor omissions
- 0.5-0.7: Partially correct but missing key information
- 0.2-0.4: Relevant but contains inaccuracies
- 0.0-0.1: Incorrect or irrelevant

Consider:
1. Factual accuracy of legal information
2. Completeness of the answer
3. Quality of legal reasoning
4. Proper citation of relevant articles/laws

Respond with JSON only: {"score": <0-1>, "reasoning": "<explanation>"}"""

    def __init__(
        self,
        model: str = "gpt-4o-mini",
        api_key: Optional[str] = None,
        temperature: float = 0,
    ) -> None:
        """Initialize the LLM judge.

        Args:
            model: OpenAI model to use (default: gpt-4o-mini).
            api_key: OpenAI API key (default: from OPENAI_API_KEY env var).
            temperature: Model temperature (default: 0 for deterministic).
        """
        self._name = "llm_precision"
        self.model = model
        self.temperature = temperature
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")

        if not self.api_key:
            logger.warning("OPENAI_API_KEY not set, LLM judge will fail on use")

        self._sync_client: Optional[OpenAI] = None
        self._async_client: Optional[AsyncOpenAI] = None

    @property
    def name(self) -> str:
        """Get the metric name."""
        return self._name

    def _get_sync_client(self) -> OpenAI:
        """Get or create synchronous OpenAI client."""
        if self._sync_client is None:
            self._sync_client = OpenAI(api_key=self.api_key)
        return self._sync_client

    def _get_async_client(self) -> AsyncOpenAI:
        """Get or create asynchronous OpenAI client."""
        if self._async_client is None:
            self._async_client = AsyncOpenAI(api_key=self.api_key)
        return self._async_client

    def _build_user_prompt(
        self,
        question: str,
        expected_answer: Optional[str],
        response: str,
    ) -> str:
        """Build the user prompt for the judge.

        Args:
            question: Original legal question.
            expected_answer: Expected/reference answer.
            response: RAG system's response.

        Returns:
            Formatted prompt string.
        """
        expected_text = expected_answer if expected_answer else "Not provided"
        return f"""Question: {question}

Expected Answer: {expected_text}

RAG Response: {response}"""

    def _parse_response(self, content: str) -> tuple[float, str]:
        """Parse the judge's JSON response.

        Args:
            content: Raw response content from the model.

        Returns:
            Tuple of (score, reasoning).

        Raises:
            LLMJudgeError: If parsing fails.
        """
        try:
            # Try to extract JSON from the response
            content = content.strip()

            # Handle markdown code blocks
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]

            data = json.loads(content.strip())
            score = float(data.get("score", 0))
            reasoning = str(data.get("reasoning", "No reasoning provided"))

            # Validate score range
            if not 0 <= score <= 1:
                logger.warning(f"Score {score} out of range, clamping to [0, 1]")
                score = max(0, min(1, score))

            return score, reasoning

        except json.JSONDecodeError as e:
            raise LLMJudgeError(f"Failed to parse JSON: {e}", content)
        except (KeyError, ValueError) as e:
            raise LLMJudgeError(f"Invalid response format: {e}", content)

    def _flag_ambiguous(self, score: float, reasoning: str) -> str:
        """Flag ambiguous scores near 0.5 for human review.

        Args:
            score: The computed precision score.
            reasoning: The judge's reasoning.

        Returns:
            Potentially modified reasoning with flag.
        """
        if 0.4 <= score <= 0.6:
            return f"[REVIEW RECOMMENDED] {reasoning}"
        return reasoning

    def score(
        self,
        output: str,
        input: str,
        expected_output: Optional[str] = None,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score a RAG response using the LLM judge (synchronous).

        Args:
            output: The RAG system's response.
            input: The original question.
            expected_output: The expected/reference answer.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with precision score (0-1) and reasoning.
        """
        if not self.api_key:
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason="LLM judge not configured (missing OPENAI_API_KEY)",
            )

        try:
            client = self._get_sync_client()
            user_prompt = self._build_user_prompt(input, expected_output, output)

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.JUDGE_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content or ""
            score, reasoning = self._parse_response(content)
            reasoning = self._flag_ambiguous(score, reasoning)

            return ScoreResult(
                name=self._name,
                value=score,
                reason=reasoning,
            )

        except LLMJudgeError:
            raise
        except Exception as e:
            logger.error(f"LLM judge failed: {e}")
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason=f"Evaluation failed: {str(e)}",
            )

    async def ascore(
        self,
        output: str,
        input: str,
        expected_output: Optional[str] = None,
        **ignored_kwargs,
    ) -> ScoreResult:
        """Score a RAG response using the LLM judge (asynchronous).

        Args:
            output: The RAG system's response.
            input: The original question.
            expected_output: The expected/reference answer.
            **ignored_kwargs: Additional kwargs (ignored).

        Returns:
            ScoreResult with precision score (0-1) and reasoning.
        """
        if not self.api_key:
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason="LLM judge not configured (missing OPENAI_API_KEY)",
            )

        try:
            client = self._get_async_client()
            user_prompt = self._build_user_prompt(input, expected_output, output)

            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.JUDGE_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content or ""
            score, reasoning = self._parse_response(content)
            reasoning = self._flag_ambiguous(score, reasoning)

            return ScoreResult(
                name=self._name,
                value=score,
                reason=reasoning,
            )

        except LLMJudgeError:
            raise
        except Exception as e:
            logger.error(f"LLM judge failed: {e}")
            return ScoreResult(
                name=self._name,
                value=0.0,
                reason=f"Evaluation failed: {str(e)}",
            )
