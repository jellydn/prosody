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

try:
    from app.analyzers.free import FreeAnalyzer

    FREE_ANALYZER_AVAILABLE = True
except ImportError:
    FREE_ANALYZER_AVAILABLE = False


def test_base_analyzer_is_abstract():
    import inspect

    assert inspect.isabstract(SpeechAnalyzer)


def test_analysis_result_dataclass():
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
    assert result.feedback_items[0].type == FeedbackType.good


def test_feedback_item():
    item = FeedbackItem(type=FeedbackType.warning, message="Speed up!")
    assert item.type == FeedbackType.warning
    assert item.message == "Speed up!"


def test_feedback_type_enum():
    assert FeedbackType.good.value == "good"
    assert FeedbackType.warning.value == "warning"
    assert FeedbackType.tip.value == "tip"


@pytest.mark.skipif(
    not FREE_ANALYZER_AVAILABLE, reason="librosa/parselmouth not installed"
)
def test_free_analyzer_implements_interface():
    assert issubclass(FreeAnalyzer, SpeechAnalyzer)
    analyzer = FreeAnalyzer()
    assert hasattr(analyzer, "analyze")


def test_score_ranges():
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
