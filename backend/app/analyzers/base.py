from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List
from enum import Enum


class FeedbackType(str, Enum):
    good = "good"
    warning = "warning"
    tip = "tip"


@dataclass
class FeedbackItem:
    type: FeedbackType
    message: str


@dataclass
class AnalysisResult:
    rhythm_score: float
    stress_score: float
    pacing_score: float
    intonation_score: float
    feedback_items: List[FeedbackItem]


class SpeechAnalyzer(ABC):
    @abstractmethod
    async def analyze(self, audio_path: str, target_text: str) -> AnalysisResult:
        pass
