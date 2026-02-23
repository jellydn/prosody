import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.analyzers.base import (
    SpeechAnalyzer,
    AnalysisResult,
    FeedbackItem,
    FeedbackType,
)
from unittest.mock import Mock, AsyncMock


class MockAnalyzer(SpeechAnalyzer):
    def __init__(self, name: str = "mock"):
        self.name = name

    async def analyze(self, audio_path: str, target_text: str) -> AnalysisResult:
        return AnalysisResult(
            rhythm_score=3.0,
            stress_score=3.0,
            pacing_score=3.0,
            intonation_score=3.0,
            feedback_items=[
                FeedbackItem(
                    type=FeedbackType.good, message=f"Mock analyzer {self.name}"
                )
            ],
        )


def test_base_analyzer_interface():
    analyzer = MockAnalyzer("test")
    assert isinstance(analyzer, SpeechAnalyzer)
    assert hasattr(analyzer, "analyze")


def test_analysis_result_structure():
    result = AnalysisResult(
        rhythm_score=4.0,
        stress_score=4.5,
        pacing_score=3.5,
        intonation_score=4.2,
        feedback_items=[
            FeedbackItem(type=FeedbackType.good, message="Great job!"),
            FeedbackItem(type=FeedbackType.tip, message="Keep practicing"),
        ],
    )
    assert result.rhythm_score == 4.0
    assert result.stress_score == 4.5
    assert result.pacing_score == 3.5
    assert result.intonation_score == 4.2
    assert len(result.feedback_items) == 2


def test_feedback_item_structure():
    item = FeedbackItem(type=FeedbackType.warning, message="Speed up!")
    assert item.type == FeedbackType.warning
    assert item.message == "Speed up!"


def test_feedback_type_enum():
    assert FeedbackType.good.value == "good"
    assert FeedbackType.warning.value == "warning"
    assert FeedbackType.tip.value == "tip"


@pytest.mark.asyncio
async def test_analyzer_analyze_method():
    analyzer = MockAnalyzer("async-test")
    result = await analyzer.analyze("test.wav", "Hello world")
    assert isinstance(result, AnalysisResult)
    assert result.rhythm_score == 3.0
    assert len(result.feedback_items) == 1
    assert result.feedback_items[0].type == FeedbackType.good


def test_score_validation():
    result = AnalysisResult(
        rhythm_score=1.0,
        stress_score=5.0,
        pacing_score=3.0,
        intonation_score=2.5,
        feedback_items=[],
    )
    assert 1.0 <= result.rhythm_score <= 5.0
    assert 1.0 <= result.stress_score <= 5.0
    assert 1.0 <= result.pacing_score <= 5.0
    assert 1.0 <= result.intonation_score <= 5.0


if __name__ == "__main__":
    import sys

    pytest.main([__file__, "-v"] + sys.argv[1:])
