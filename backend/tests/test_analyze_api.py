import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from io import BytesIO

try:
    from app.main import app

    client = TestClient(app)
    API_AVAILABLE = True
except ImportError:
    API_AVAILABLE = False


@pytest.mark.skipif(not API_AVAILABLE, reason="librosa/parselmouth not installed")
def test_analyze_endpoint_requires_audio():
    response = client.post("/api/v1/analyze", data={"target_text": "Hello world"})
    assert response.status_code == 422


@pytest.mark.skipif(not API_AVAILABLE, reason="librosa/parselmouth not installed")
def test_analyze_endpoint_unsupported_format():
    files = {"audio": ("test.txt", BytesIO(b"fake audio"), "text/plain")}
    data = {"target_text": "Hello world"}
    response = client.post("/api/v1/analyze", files=files, data=data)
    assert response.status_code == 400
    assert "Unsupported audio format" in response.json()["detail"]


if __name__ == "__main__":
    import sys

    pytest.main([__file__, "-v"] + sys.argv[1:])
