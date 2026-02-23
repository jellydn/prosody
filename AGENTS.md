# AGENTS.md - Agent Coding Guidelines

This file provides coding guidelines for AI agents working on English Rhythm Coach.

## Project Overview

- **Mobile**: React Native (Expo) - TypeScript
- **Backend**: Python FastAPI
- **Structure**: `mobile/` and `backend/` directories

---

## Build & Test Commands

### Backend (Python/FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest -v                    # Run all tests
pytest -k "test_name"       # Run single test
ruff check . && ruff format .  # Lint and format
```

### Mobile (React Native/Expo)

```bash
cd mobile
npx expo install
npx expo start
npx tsc --noEmit            # TypeScript check
npx jest                    # Run tests
npx jest --testNamePattern="test_name"  # Single test
```

---

## Code Style Guidelines

### TypeScript / React Native

- Components: `PascalCase.tsx` (e.g., `AudioPlayer.tsx`)
- Hooks: `useCamelCase.ts` (e.g., `useAudioRecorder.ts`)
- Import order: React/Expo → Third-party → Internal → Relative
- Prefer `interface` over `type` for public APIs
- Export types used across modules

### Python / FastAPI

- Modules: `snake_case.py` (e.g., `speech_analyzer.py`)
- Classes: `PascalCase`, functions/variables: `snake_case`
- Use `async def` for route handlers, `await` for I/O

---

## Naming Conventions

| Element             | TypeScript                   | Python                         |
| ------------------- | ---------------------------- | ------------------------------ |
| Variables/Functions | `camelCase`                  | `snake_case`                   |
| Classes             | `PascalCase`                 | `PascalCase`                   |
| Constants           | `UPPER_SNAKE_CASE`           | `UPPER_SNAKE_CASE`             |
| Booleans            | `isPlaying`, `hasPermission` | `is_playing`, `has_permission` |

---

## Error Handling

### FastAPI

```python
from fastapi import HTTPException, status

class AnalysisError(Exception):
    pass

@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        result = await analyzer.process(request.audio_url)
    except AnalysisError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result
```

### React Native - Use Error Boundaries for component failures, try/catch for async.

---

## Testing Guidelines

- **Backend**: `pytest` with `pytest-asyncio`. File: `test_module_name.py`
- **Mobile**: Jest. File: `ComponentName.test.tsx`
- Test behavior, not implementation details

---

## Ralph Agent Workflow

See `scripts/ralph/prompt-opencode.md`.

**Process:**

1. Read `scripts/ralph/prd.json` for user stories
2. Check branch in PRD (`branchName`)
3. Pick highest priority story where `passes: false`
4. Implement, run quality checks (typecheck, lint, test)
5. Commit with: `feat: [Story ID] - [Story Title]`
6. Update PRD `passes: true`, append to `progress.txt`

**Quality Gates:** All commits must pass typecheck, lint, tests.

---

## JSON Schema Generation

For schema validation, use Pydantic models in `backend/app/content/schema/`:

- Generate JSON schemas from Pydantic models using `scripts/generate_schema.py`
- Run the script after model changes: `python scripts/generate_schema.py`
- Combined schema exported to `backend/app/content/schema/curriculum.json`
- Always run `ruff check . && ruff format .` before committing

---

## AGENTS.md Updates

Add reusable patterns to nearby AGENTS.md files:

- Good: "This module uses pattern X for all API calls"
- Bad: Story-specific details, debugging notes
