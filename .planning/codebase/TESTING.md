# Testing Patterns

**Analysis Date:** 2026-02-24

## Test Framework

**Runner:**
- `pytest` 8.4.2 (from `backend/pyproject.toml` dev dependencies).
- Config: defaults (no `pytest.ini`/`pyproject` `tool.pytest`, so CLI flags come from the `just backend-test` workflow in `justfile`).

**Assertion Library:**
- Plain `assert` statements via `pytest` (e.g., `test_progress.py`, `test_analyzers.py`).

**Run Commands:**
```bash
cd backend && uv run pytest -v             # Run all tests (`just backend-test`)
cd backend && uv run pytest -k "<pattern>"  # Target a subset (`just backend-test-single "pattern"`)
# Coverage: Not configured (no coverage command in `justfile`).
```

## Test File Organization

**Location:**
- All tests live under `backend/tests/` alongside `conftest.py`, covering API layers (`test_progress.py`, `test_analyze_api.py`) and analyzers (`test_analyzers.py`, `test_byop_analyzers.py`).
- Mobile side currently has no `*.test.*` files, so Jest is unused in this repo snapshot.

**Naming:**
- Files follow `test_*.py` (e.g., `test_progress.py`, `test_analyzers.py`, `test_byop_analyzers.py`, `test_analyze_api.py`).

**Structure:**
```
backend/tests/
├── conftest.py       # fixtures (db/session)
├── test_progress.py  # API integration
├── test_analyze_api.py
├── test_analyzers.py
└── test_byop_analyzers.py
```

## Test Structure

**Suite Organization:**
```python
def test_create_user(db):
    response = client.post("/api/v1/users", json={...})
    assert response.status_code == 201
```
(from `backend/tests/test_progress.py` – each test posts JSON, asserts status/response, and relies on shared `client`).

**Patterns:**
- Setup: `db` fixture from `backend/tests/conftest.py` calls `init_db()` and yields `SessionLocal`, ensuring a fresh SQLite schema per test.
- Teardown: Fixture finalizer closes the session (`db.close()` in `conftest.py`).
- Assertion: HTTP responses (status codes, payload shape) are asserted directly via `response.status_code` and `response.json()`.

## Mocking

**Framework:** `unittest.mock` (`AsyncMock`, `MagicMock`, `patch`) as in `backend/tests/test_byop_analyzers.py`.

**Patterns:**
```python
with patch.object(
    analyzer.client.audio.transcriptions, "create", new_callable=AsyncMock
) as mock_create:
    mock_create.return_value = mock_transcription
    ...
    mock_create.assert_called_once()
```
(see `backend/tests/test_byop_analyzers.py`).

**What to Mock:**
- Networked analyzer clients (OpenAI transcription calls, file I/O) are mocked to avoid hitting external APIs: `patch.object(..., "create")` and patching `builtins.open` appear in `backend/tests/test_byop_analyzers.py`.

**What NOT to Mock:**
- FastAPI `TestClient` is used without mocking to exercise routers/endpoints directly (`backend/tests/test_progress.py`, `backend/tests/test_analyze_api.py`).
- The SQLite-backed `SessionLocal` is created once per fixture rather than mocked, so database behavior is verified end-to-end.

## Fixtures and Factories

**Test Data:**
```python
client.post(
    "/api/v1/progress",
    json={
        "user_id": user_id,
        "day": 1,
        "exercises_completed": 4,
        "rhythm_score": 4.5,
        "stress_score": 4.0,
        "pacing_score": 4.2,
        "intonation_score": 4.3,
    },
)
```
(from `backend/tests/test_progress.py` – repeated posts seed progress history).

**Location:**
- Fixtures live in `backend/tests/conftest.py` (the `db` fixture initializes the schema and closes sessions).

## Coverage

**Requirements:** Not enforced; `justfile` lacks a coverage command or target.

**View Coverage:**
```bash
# Coverage reporting is not configured currently.
```

## Test Types

**Unit Tests:**
- Analyzer unit tests validate dataclasses/enums (`backend/tests/test_analyzers.py`) and the `MockAnalyzer` interface (`backend/tests/test_byop_analyzers.py`).

**Integration Tests:**
- API tests (`backend/tests/test_progress.py`, `backend/tests/test_analyze_api.py`) exercise routers via `TestClient` and the real database layer.

**E2E Tests:**
- Not present in this snapshot (no Cypress/Appium suites or Expo Jest files).

## Common Patterns

**Async Testing:**
```python
@pytest.mark.asyncio
async def test_analyzer_analyze_method():
    analyzer = MockAnalyzer("async-test")
    result = await analyzer.analyze("test.wav", "Hello world")
    assert isinstance(result, AnalysisResult)
```
(from `backend/tests/test_byop_analyzers.py`).

**Error Testing:**
- `backend/tests/test_progress.py` asserts 404 responses for missing users (`test_get_progress_summary_no_data`).
- `backend/tests/test_analyze_api.py` checks that unsupported formats return 400 and that missing audio returns 422 when `librosa`/`parselmouth` are installed.

---

*Testing analysis: 2026-02-24*
