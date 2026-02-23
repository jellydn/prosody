# AGENTS.md - Agent Coding Guidelines

This file provides coding guidelines for AI agents working on English Rhythm Coach.

## Project Overview

- **Mobile**: React Native (Expo) - TypeScript
- **Backend**: Python FastAPI
- **Structure**: `mobile/` and `backend/` directories
- **Speech Analysis**: Whisper + librosa + parselmouth (free), Azure/Google/OpenAI (BYOP)

---

## Quick Reference

| Task                  | Command                                                              |
| --------------------- | -------------------------------------------------------------------- |
| Backend dev           | `just backend-dev` or `cd backend && uvicorn app.main:app --reload`  |
| Mobile dev            | `just mobile-dev` or `cd mobile && npx expo start`                   |
| Run all backend tests | `just backend-test` or `cd backend && pytest -v`                     |
| Run single test       | `just backend-test-single "test_name"`                               |
| Lint/format backend   | `just backend-lint` or `cd backend && ruff check . && ruff format .` |
| TypeScript check      | `just mobile-typecheck` or `cd mobile && npx tsc --noEmit`           |
| Lint/format mobile    | `just mobile-lint` / `just mobile-format` (uses oxlint/oxfmt)        |
| Run all checks        | `just check`                                                         |

> **Tip**: Run `just` or `just --list` to see all available commands.

---

## Build & Test Commands

### Backend (Python/FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload           # Start dev server
pytest -v                                 # Run all tests
pytest -k "test_name"                     # Run single test by name pattern
pytest tests/test_file.py::test_function  # Run specific test function
pytest tests/ -v --tb=short              # Verbose with short traceback
ruff check . && ruff format .              # Lint and format
python scripts/generate_schema.py          # Generate JSON schema from Pydantic models
```

### Mobile (React Native/Expo)

```bash
cd mobile
npx expo install           # Install dependencies
npx expo start             # Start dev server
npx tsc --noEmit           # TypeScript check
oxlint .                   # Lint (uses oxlint)
oxfmt .                    # Format (uses oxfmt)
npx jest                   # Run all tests
npx jest --testNamePattern="test_name"    # Run single test
npx jest --testPathPattern="filename"      # Run tests in specific file
```

---

## Code Style Guidelines

### TypeScript / React Native

- **Files**: Components use `PascalCase.tsx` (e.g., `AudioPlayer.tsx`), hooks use `camelCase.ts` (e.g., `useAudioRecorder.ts`)
- **Import order**: React/Expo → Third-party → Internal → Relative paths
- **Indentation**: Use tabs (not spaces) in TSX files - see existing files like `mobile/App.tsx`
- **Types**: Prefer `interface` over `type` for public APIs; export types used across modules
- **Components**: Use functional components with hooks; avoid class components
- **State**: Use `useState` for local state, `useContext` or Zustand for global state
- **Styling**: Use `StyleSheet.create()` - see `mobile/screens/HomeScreen.tsx` for pattern
- **Testing**: Place tests alongside components using `.test.tsx` suffix

### Python / FastAPI

- **Files**: Use `snake_case.py` (e.g., `speech_analyzer.py`)
- **Classes**: `PascalCase`, functions/variables: `snake_case`
- **Async**: Use `async def` for route handlers, `await` for I/O operations
- **Pydantic**: Use `BaseModel` for request/response schemas with `Field` for descriptions
- **Enums**: Use `str, Enum` for string-based enums (e.g., `class ExerciseType(str, Enum):`)
- **Testing**: Use `pytest` with `pytest-asyncio`. Test file: `test_module_name.py`

---

## Naming Conventions

| Element             | TypeScript                   | Python                         |
| ------------------- | ---------------------------- | ------------------------------ |
| Variables/Functions | `camelCase`                  | `snake_case`                   |
| Classes             | `PascalCase`                 | `PascalCase`                   |
| Constants           | `UPPER_SNAKE_CASE`           | `UPPER_SNAKE_CASE`             |
| Booleans            | `isPlaying`, `hasPermission` | `is_playing`, `has_permission` |
| Files (components)  | `AudioPlayer.tsx`            | `speech_analyzer.py`           |
| Files (hooks)       | `useAudioRecorder.ts`        | N/A                            |
| Tests               | `AudioPlayer.test.tsx`       | `test_speech_analyzer.py`      |

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

### React Native

- Use Error Boundaries for component failures
- Use try/catch for async operations
- Display user-friendly error messages with toast/alert
- Log errors to console for debugging

---

## Mobile-Specific Patterns

### AsyncStorage

- **Key naming**: Use descriptive keys (e.g., `"userProfile"`, `"userId"`)
- **Data format**: Store JSON objects as strings (use `JSON.stringify()` / `JSON.parse()`)
- **API keys**: Store API keys in `expo-secure-store` (encrypted), not AsyncStorage
- **Error handling**: Try/catch around all AsyncStorage operations

### Onboarding Flow

- **Check status**: Use `useEffect` + `useCallback` to check AsyncStorage on app mount
- **Navigation**: Use native stack navigator (`createNativeStackNavigator`) for onboarding
- **Screen transition**: Use `navigation.replace()` to prevent going back to onboarding
- **Form validation**: Disable submit button until all required fields are selected
- **Loading state**: Show loading indicator while checking status or submitting API calls

### API Integration

- **Base URL**: Use `http://localhost:8000` for development
- **Endpoints**:
  - POST `/api/v1/users` - Create user profile (returns `{user_id: int}`)
  - POST `/api/v1/progress` - Save session result
  - GET `/api/v1/progress/{user_id}` - Get progress history
  - GET `/api/v1/progress/{user_id}/summary` - Get progress summary
- **Request format**: JSON with `Content-Type: application/json` header
- **Error handling**: Show user-friendly alert, log error for debugging

### Form UI Patterns

- **KeyboardAvoidingView**: Wrap forms in `KeyboardAvoidingView` (iOS: `behavior="padding"`, Android: `behavior="height"`)
- **ScrollView**: Use with `keyboardShouldPersistTaps="handled"` for scrollable forms
- **Option selection**: Use `TouchableOpacity` with conditional styling (border color, background color)
- **Selected state**: Change text color to white when option is selected
- **Disabled state**: Use lower opacity for disabled buttons

### Exercise Navigation

- **Type safety**: Use `NativeStackNavigationProp<ParamListType>` to properly type the navigation hook
- **Export types**: Export navigation param types (e.g., `HomeStackParamList`) from screen files for reuse
- **Router pattern**: Use a switch statement in ExerciseScreen to render the correct exercise type component
- **Data passing**: Pass exercise data via `route.params` when navigating between screens
- **Back navigation**: Use `navigation.goBack()` to return to previous screen

---

## Testing Guidelines

- **Backend**: `pytest` with `pytest-asyncio`. Test file: `test_module_name.py`
- **Mobile**: Jest. Test file: `ComponentName.test.tsx`
- **Strategy**: Test behavior, not implementation details
- **Coverage**: Focus on user-facing functionality
- **Mocks**: Mock at network boundaries, not internal functions

---

## JSON Schema Generation

For schema validation, use Pydantic models in `backend/app/content/schema/`:

- Models defined in `models.py` using Pydantic `BaseModel`
- Generate JSON schemas: `python scripts/generate_schema.py`
- Combined schema exported to `backend/app/content/schema/curriculum.json`
- Always run `ruff check . && ruff format .` after changes

---

## Project Structure

```
backend/
├── app/
│   ├── api/                # API endpoints (analyze.py, progress.py)
│   ├── analyzers/          # Speech analysis providers (free, azure, google, openai)
│   ├── content/schema/     # Pydantic models for curriculum
│   ├── models.py           # Database models
│   └── main.py             # FastAPI entry point
├── tests/                  # Test files
└── requirements.txt

mobile/                     # React Native (Expo)
├── app/                    # Screens & navigation
├── components/             # Reusable UI components
├── navigation/             # Navigation config (TabNavigator.tsx)
├── screens/                # Screen components
├── assets/                 # Bundled audio files/images
└── package.json

scripts/
├── generate_schema.py      # Schema generation script
└── ralph/                  # Ralph autonomous agent config
    ├── prd.json           # User stories
    ├── progress.txt       # Implementation progress
    └── prompt-opencode.md # Agent instructions
```

---

## Ralph Agent Workflow

See `scripts/ralph/prompt-opencode.md` for full instructions.

**Process:**

1. Read `scripts/ralph/prd.json` for user stories
2. Check branch in PRD (`branchName`), create if needed
3. Pick **highest priority** story where `passes: false`
4. Implement, run quality checks (typecheck, lint, test)
5. Commit with: `feat: [Story ID] - [Story Title]`
6. Update PRD `passes: true`, append to `progress.txt`

**Quality Gates:** All commits must pass typecheck, lint, and tests.

**Browser Testing:** For frontend stories, verify UI changes work in browser using ChromeDevTools MCP if configured.

---

## AGENTS.md Updates

When you discover reusable patterns, add them to this file:

- **Good**: "This module uses pattern X for all API calls"
- **Good**: "Field names must match the template exactly"
- **Bad**: Story-specific details, debugging notes
