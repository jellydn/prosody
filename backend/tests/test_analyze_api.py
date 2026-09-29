import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

from app.main import app
from app.api import analyze
from app.analyzers.base import AnalysisResult, FeedbackItem, FeedbackType

client = TestClient(app)


@pytest.fixture
def provider(monkeypatch):
    result = AnalysisResult(
        rhythm_score=1.2,
        stress_score=2.4,
        pacing_score=3.6,
        intonation_score=4.8,
        feedback_items=[FeedbackItem(FeedbackType.tip, "Try slower speech")],
    )
    analyzer = SimpleNamespace(analyze=AsyncMock(return_value=result))
    factory = Mock(return_value=analyzer)
    monkeypatch.setitem(
        sys.modules, "app.analyzers.factory", SimpleNamespace(get_analyzer=factory)
    )
    # The HTTP contract must work without loading any scoring SDK or audio decoder.
    for module in ("librosa", "parselmouth", "azure", "google.cloud.speech", "openai"):
        monkeypatch.setitem(sys.modules, module, None)
    return factory, analyzer


def test_analyze_endpoint_requires_audio():
    response = client.post("/api/v1/analyze", data={"target_text": "Hello world"})
    assert response.status_code == 422


def test_analyze_endpoint_unsupported_format():
    files = {"audio": ("test.txt", BytesIO(b"fake audio"), "text/plain")}
    data = {"target_text": "Hello world"}
    response = client.post("/api/v1/analyze", files=files, data=data)
    assert response.status_code == 400
    assert "Unsupported audio format" in response.json()["detail"]


def test_analyze_success_serializes_scores_and_removes_audio(provider):
    factory, analyzer = provider
    paths = []

    async def score(path, target):
        paths.append(Path(path))
        assert Path(path).read_bytes() == b"uploaded audio"
        assert target == "Please join our meeting"
        return analyzer.analyze.return_value

    analyzer.analyze.side_effect = score
    response = client.post(
        "/api/v1/analyze",
        files={"audio": ("sample.wav", b"uploaded audio", "audio/wav")},
        data={"target_text": "Please join our meeting", "provider": "AZURE"},
        headers={"X-Provider-Api-Key": "test-provider-key"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "rhythm_score": 1.2,
        "stress_score": 2.4,
        "pacing_score": 3.6,
        "intonation_score": 4.8,
        "feedback": [{"type": "tip", "message": "Try slower speech"}],
    }
    factory.assert_called_once_with("azure", "test-provider-key")
    assert len(paths) == 1
    assert not paths[0].exists()


@pytest.mark.parametrize("size, expected_status", [(8, 200), (9, 413)])
def test_analyze_upload_size_boundary(
    provider, monkeypatch, tmp_path, size, expected_status
):
    monkeypatch.setattr(analyze, "MAX_AUDIO_SIZE_BYTES", 8)
    monkeypatch.setattr(analyze.tempfile, "tempdir", str(tmp_path))
    _, analyzer = provider
    response = client.post(
        "/api/v1/analyze",
        files={"audio": ("sample.wav", b"x" * size, "audio/wav")},
        data={"target_text": "Hello"},
    )
    assert response.status_code == expected_status
    assert analyzer.analyze.await_count == (1 if size == 8 else 0)
    assert list(tmp_path.iterdir()) == []


def test_analyze_provider_failure_hides_details_and_removes_audio(provider):
    _, analyzer = provider
    analyzer.analyze.side_effect = RuntimeError("private provider detail")
    response = client.post(
        "/api/v1/analyze",
        files={"audio": ("sample.wav", b"audio", "audio/wav")},
        data={"target_text": "Hello"},
    )
    assert response.status_code == 500
    assert response.json() == {"detail": "Analysis failed"}
    path, _ = analyzer.analyze.await_args.args
    assert not Path(path).exists()


def test_analyze_rejects_invalid_provider_configuration(provider):
    factory, analyzer = provider
    factory.side_effect = ValueError("API key is required for Azure provider")
    response = client.post(
        "/api/v1/analyze",
        files={"audio": ("sample.wav", b"audio", "audio/wav")},
        data={"target_text": "Hello", "provider": "azure"},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "API key is required for Azure provider"}
    analyzer.analyze.assert_not_awaited()


@pytest.mark.parametrize("conversion_fails", [False, True])
def test_analyze_conversion_without_decoder(
    provider, monkeypatch, tmp_path, conversion_fails
):
    _, analyzer = provider
    segment = Mock()
    audio_segment = Mock()
    audio_segment.from_file.return_value = segment
    if conversion_fails:
        audio_segment.from_file.side_effect = ValueError("invalid audio")
    monkeypatch.setitem(
        sys.modules, "pydub", SimpleNamespace(AudioSegment=audio_segment)
    )
    monkeypatch.setattr(analyze.tempfile, "tempdir", str(tmp_path))
    response = client.post(
        "/api/v1/analyze",
        files={"audio": ("sample.m4a", b"encoded audio", "audio/x-m4a")},
        data={"target_text": "Hello"},
    )
    path = audio_segment.from_file.call_args.args[0]
    audio_segment.from_file.assert_called_once_with(path, format="m4a")
    if conversion_fails:
        assert response.status_code == 400
        assert response.json() == {"detail": "Failed to convert audio format"}
        analyzer.analyze.assert_not_awaited()
    else:
        assert response.status_code == 200
        segment.export.assert_called_once_with(path, format="wav")
        analyzer.analyze.assert_awaited_once_with(path, "Hello")
    assert list(tmp_path.iterdir()) == []


if __name__ == "__main__":
    import sys

    pytest.main([__file__, "-v"] + sys.argv[1:])
