# Testing Patterns

**Analysis Date:** 2026-02-24

## Test Framework

**Runner:**
- Backend: pytest + pytest-asyncio
- Mobile: Jest (via Expo, configured in package.json — no standalone jest.config)
- Config: No explicit pytest.ini, pyproject.toml, or conftest.py — uses pytest defaults

**Assertion Library:**
- Backend: pytest built-in `assert` statements
- Mobile: No test files found — Jest available but unused

**Run Commands:**
```bash
just backend-test              # Run all backend tests (pytest -v)
just backend-test-single "name" # Single test by pattern (pytest -k)
just backend-test-file path    # Specific test file (pytest path -v)
just mobile-test               # Run all mobile tests (npx jest)
just mobile-test-single "name" # Single mobile test (npx jest --testNamePattern)
```

## Test File Organization

**Location:**
- Backend: Separate `backend/tests/` directory (not co-located)
- Mobile: Co-located pattern prescribed (`ComponentName.test.tsx`) but no test files exist yet

**Naming:**
- Backend: `test_<module_name>.py` (e.g., `test_analyzers.py`, `test_progress.py`, `test_analyze_api.py`)
- Mobile: `ComponentName.test.tsx` (prescribed convention, not yet implemented)

**Structure:**
```
backend/
└── tests/
    ├── __init__.py              # Empty marker file
    ├── test_analyzers.py        # Unit tests for analyzer base classes
    ├── test_byop_analyzers.py   # BYOP analyzer interface tests with mock
    ├── test_analyze_api.py      # API integration tests for /analyze endpoint
    └── test_progress.py         # API integration tests for /progress endpoints
```

## Test Structure

**Suite Organization:**
```python
# Flat function-based tests (no class grouping)
# Each test is a standalone function prefixed with test_

def test_base_analyzer_is_abstract():
    import inspect
    assert inspect.isabstract(SpeechAnalyzer)

def test_analysis_result_dataclass():
    result = AnalysisResult(
        rhythm_score=4.0,
        stress_score=4.5,
        ...
    )
    assert result.rhythm_score == 4.0
```

**Patterns:**
- Setup: `sys.path.insert(0, ...)` at top of each test file for import resolution
- Setup: `@pytest.fixture` for database session management (yield-based cleanup)
- Teardown: Fixture-based with `try/finally` for DB session cleanup
- Assertion: Direct `assert` comparisons, `assert ... in ...` for string checking
- Conditional execution: `@pytest.mark.skipif` for optional dependency tests

## Mocking

**Framework:** No dedicated mock library — hand-written mock classes

**Patterns:**
```python
# Hand-written mock implementing the abstract base class
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
                FeedbackItem(type=FeedbackType.good, message=f"Mock analyzer {self.name}")
            ],
        )
```

**What to Mock:**
- Abstract base classes (SpeechAnalyzer) — implement with hardcoded return values
- External dependencies conditionally imported with try/except + skipif

**What NOT to Mock:**
- Database — uses real SQLite in-memory/file via `init_db()`
- FastAPI app — uses `TestClient(app)` for real HTTP-layer testing
- Pydantic models and dataclasses — tested directly

## Fixtures and Factories

**Test Data:**
```python
# Inline test data — no shared fixture files
@pytest.fixture
def db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API test data created inline
response = client.post("/api/v1/users", json={
    "native_language": "Vietnamese",
    "english_level": "Intermediate",
    "goal": "Meetings",
})
```

**Location:**
- All test data is inline within test functions
- No separate fixtures directory or factory files
- No conftest.py for shared fixtures (db fixture duplicated per file)

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
cd backend && pytest --cov=app --cov-report=html  # Not configured, but available
```

## Test Types

**Unit Tests:**
- Analyzer base classes, dataclasses, enums (`test_analyzers.py`, `test_byop_analyzers.py`)
- Direct instantiation and attribute assertion
- Score range validation
- Interface compliance checks (`issubclass`, `hasattr`, `isabstract`)

**Integration Tests:**
- API endpoint tests via `fastapi.testclient.TestClient` (`test_progress.py`, `test_analyze_api.py`)
- Full request/response cycle including database operations
- HTTP status code and JSON response body assertions
- Multi-step workflows (create user → create progress → get summary)

**E2E Tests:**
- Not used

## Common Patterns

**Async Testing:**
```python
@pytest.mark.asyncio
async def test_analyzer_analyze_method():
    analyzer = MockAnalyzer("async-test")
    result = await analyzer.analyze("test.wav", "Hello world")
    assert isinstance(result, AnalysisResult)
    assert result.rhythm_score == 3.0
```

**Error Testing:**
```python
def test_analyze_endpoint_unsupported_format():
    files = {"audio": ("test.txt", BytesIO(b"fake audio"), "text/plain")}
    data = {"target_text": "Hello world"}
    response = client.post("/api/v1/analyze", files=files, data=data)
    assert response.status_code == 400
    assert "Unsupported audio format" in response.json()["detail"]

def test_get_progress_summary_no_data(db):
    response = client.get("/api/v1/progress/999/summary")
    assert response.status_code == 404
```

**Conditional Skip Pattern:**
```python
try:
    from app.analyzers.free import FreeAnalyzer
    FREE_ANALYZER_AVAILABLE = True
except ImportError:
    FREE_ANALYZER_AVAILABLE = False

@pytest.mark.skipif(
    not FREE_ANALYZER_AVAILABLE, reason="librosa/parselmouth not installed"
)
def test_free_analyzer_implements_interface():
    ...
```

**Standalone Execution:**
```python
# Every test file supports direct execution
if __name__ == "__main__":
    import sys
    pytest.main([__file__, "-v"] + sys.argv[1:])
```

---

*Testing analysis: 2026-02-24*
