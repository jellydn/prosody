import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.analyzers.base import (
    SpeechAnalyzer,
    AnalysisResult,
    FeedbackItem,
    FeedbackType,
)


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


@pytest.mark.skipif(
    sys.version_info < (3, 8),
    reason="Mock requires Python 3.8+",
)
def test_openai_analyzer_instantiation():
    try:
        from app.analyzers.openai import OpenAIAnalyzer
        from openai import AsyncOpenAI

        analyzer = OpenAIAnalyzer(api_key="test-key")
        assert isinstance(analyzer, SpeechAnalyzer)
        assert hasattr(analyzer, "analyze")
        assert isinstance(analyzer.client, AsyncOpenAI)
    except ImportError:
        pytest.skip("openai package not installed")


@pytest.mark.skipif(
    sys.version_info < (3, 8),
    reason="Mock requires Python 3.8+",
)
@pytest.mark.asyncio
async def test_openai_analyze_signature():
    try:
        from app.analyzers.openai import OpenAIAnalyzer
        from unittest.mock import patch

        analyzer = OpenAIAnalyzer(api_key="test-key")

        mock_transcription = MagicMock()
        mock_transcription.text = "hello world"

        with patch.object(
            analyzer.client.audio.transcriptions, "create", new_callable=AsyncMock
        ) as mock_create:
            mock_create.return_value = mock_transcription
            with patch("builtins.open", MagicMock()) as mock_open:
                mock_open.return_value.__enter__ = MagicMock()
                mock_open.return_value.__exit__ = MagicMock()
                mock_open.return_value.read = MagicMock(return_value=b"fake audio data")

                result = await analyzer.analyze("test.wav", "hello world")

                assert isinstance(result, AnalysisResult)
                assert 1.0 <= result.rhythm_score <= 5.0
                assert 1.0 <= result.stress_score <= 5.0
                assert 1.0 <= result.pacing_score <= 5.0
                assert 1.0 <= result.intonation_score <= 5.0

                mock_create.assert_called_once()
                call_args = mock_create.call_args
                assert "file" in call_args.kwargs
                assert "model" in call_args.kwargs
                assert call_args.kwargs["model"] == "whisper-1"

                file_arg = call_args.kwargs["file"]
                assert isinstance(file_arg, tuple)
                assert len(file_arg) == 3
                assert file_arg[0] == "test.wav"
                assert file_arg[2] == "audio/wav"
    except ImportError:
        pytest.skip("openai package not installed")


@pytest.mark.skipif(
    sys.version_info < (3, 8),
    reason="Mock requires Python 3.8+",
)
def test_google_analyzer_with_api_key():
    try:
        from app.analyzers.google import GoogleAnalyzer

        analyzer = GoogleAnalyzer(api_key="test-api-key")
        assert isinstance(analyzer, SpeechAnalyzer)
        assert hasattr(analyzer, "analyze")
        assert hasattr(analyzer, "client")
    except ImportError:
        pytest.skip("google-cloud-speech package not installed")


@pytest.mark.skipif(
    sys.version_info < (3, 8),
    reason="Mock requires Python 3.8+",
)
def test_google_analyzer_with_json_credentials():
    try:
        from app.analyzers.google import GoogleAnalyzer

        credentials_json = json.dumps(
            {
                "type": "service_account",
                "project_id": "test-project",
                "private_key_id": "test-key-id",
                "private_key": "test-private-key",
                "client_email": "test@test-project.iam.gserviceaccount.com",
            }
        )

        analyzer = GoogleAnalyzer(api_key=credentials_json)
        assert isinstance(analyzer, SpeechAnalyzer)
        assert hasattr(analyzer, "analyze")
        assert hasattr(analyzer, "client")
    except ImportError:
        pytest.skip("google-cloud-speech package not installed")


if __name__ == "__main__":
    import sys

    pytest.main([__file__, "-v"] + sys.argv[1:])
