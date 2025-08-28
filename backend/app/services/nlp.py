"""
Lightweight NLP utilities.

This module avoids heavy dependencies. It provides a simple, dependency-free
sentiment analysis heuristic that can be safely used in production.

if i had more time i would implment a more sophisticated approach with spaCy
Functions:
- analyze_sentiment(text: str) -> str
  Returns one of: "positive", "negative", or "neutral"
"""

from __future__ import annotations

import re
from typing import Iterable


__all__ = ["analyze_sentiment"]


# Simple keyword lists for a naive sentiment heuristic.
_POSITIVE_WORDS = {
    "good",
    "great",
    "excellent",
    "love",
    "like",
    "awesome",
    "amazing",
    "positive",
    "happy",
    "success",
    "win",
    "fast",
    "improve",
    "improved",
    "secure",
    "reliable",
    "clean",
}

_NEGATIVE_WORDS = {
    "bad",
    "poor",
    "terrible",
    "hate",
    "dislike",
    "awful",
    "horrible",
    "negative",
    "sad",
    "fail",
    "slow",
    "bug",
    "error",
    "issue",
    "problem",
    "broken",
    "crash",
    "insecure",
    "unreliable",
}


def _tokenize(text: str) -> Iterable[str]:
    """
    Very basic tokenizer that extracts word tokens using a regex.
    """
    if not text:
        return []
    return re.findall(r"\b[a-z0-9']+\b", text.lower())


def analyze_sentiment(text: str) -> str:
    """
    Naive, dependency-free sentiment analysis.

    Heuristic:
    - Count occurrences of known positive and negative keywords.
    - If positive > negative + 1 => "positive"
    - If negative > positive + 1 => "negative"
    - Otherwise => "neutral"

    Args:
        text: Input text to analyze.

    Returns:
        "positive", "negative", or "neutral"
    """
    tokens = list(_tokenize(text))

    pos = sum(1 for t in tokens if t in _POSITIVE_WORDS)
    neg = sum(1 for t in tokens if t in _NEGATIVE_WORDS)

    if pos > neg + 1:
        return "positive"
    if neg > pos + 1:
        return "negative"
    return "neutral"
