# AGENTS.md - Agent Coding Guidelines

English Rhythm Coach: React Native (Expo/TypeScript) + Python FastAPI.

---

## Quick Reference

| Task                | Command                                                              |
| ------------------- | -------------------------------------------------------------------- |
| Backend dev         | `just backend-dev`                                                   |
| Mobile dev          | `just mobile-dev`                                                    |
| Run all tests       | `just backend-test` / `just mobile-test`                             |
| Run single test     | `just backend-test-single "name"` / `just mobile-test-single "name"` |
| Run test file       | `just backend-test-file path` / `just mobile-test-file path`         |
| Lint/format backend | `just backend-lint`                                                  |
| TypeScript check    | `just mobile-typecheck`                                              |
| Lint/format mobile  | `just mobile-lint` / `just mobile-format`                            |
| All checks          | `just check`                                                         |

Run `just` or `just --list` to see all commands.

---

## Commands

### Backend

```bash
cd backend
uv sync --dev --frozen             # Install from lockfile
uv lock --check                    # Verify lockfile is current
uv run uvicorn app.main:app --reload     # Dev server
uv run pytest -v                         # All tests
uv run pytest -k "test_name"             # Single test by pattern
uv run pytest tests/test_file.py::func   # Specific function
uv run ruff check . && uv run ruff format .     # Lint + format
uv run python scripts/generate_schema.py # Generate JSON schema
```

### Mobile

```bash
cd mobile
npx expo start                    # Dev server
npx tsc --noEmit                  # TypeScript check
npx oxlint .                      # Lint
npx oxfmt .                       # Format
npx jest                          # All tests
npx jest --testNamePattern="name" # Single test
```

---

## Code Style

### TypeScript/React Native

- **Files**: Components: `PascalCase.tsx` (AudioPlayer.tsx), Hooks: `camelCase.ts` (useAudioRecorder.ts)
- **Imports**: React/Expo → Third-party → Internal → Relative paths
- **Indentation**: Tabs in TSX files
- **Types**: Prefer `interface` over `type` for public APIs
- **Components**: Functional with hooks, no class components
- **State**: `useState` (local), `useContext`/Zustand (global)
- **Styling**: `StyleSheet.create()` - see `mobile/screens/HomeScreen.tsx`
- **Tests**: Place alongside components as `ComponentName.test.tsx`

### Python/FastAPI

- **Files**: `snake_case.py` (speech_analyzer.py)
- **Classes**: `PascalCase`, functions/variables: `snake_case`
- **Async**: Use `async def` for route handlers
- **Pydantic**: `BaseModel` with `Field` for descriptions
- **Enums**: `str, Enum` (e.g., `class ExerciseType(str, Enum):`)
- **Tests**: pytest + pytest-asyncio, file: `test_module_name.py`

### Naming Conventions

| Element             | TypeScript                   | Python                         |
| ------------------- | ---------------------------- | ------------------------------ |
| Variables/Functions | `camelCase`                  | `snake_case`                   |
| Classes             | `PascalCase`                 | `PascalCase`                   |
| Constants           | `UPPER_SNAKE_CASE`           | `UPPER_SNAKE_CASE`             |
| Booleans            | `isPlaying`, `hasPermission` | `is_playing`, `has_permission` |
| Files (components)  | `AudioPlayer.tsx`            | `speech_analyzer.py`           |
| Tests               | `AudioPlayer.test.tsx`       | `test_speech_analyzer.py`      |

---

## Error Handling

### FastAPI

```python
from fastapi import HTTPException

class AnalysisError(Exception):
    pass

@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        return await analyzer.process(request.audio_url)
    except AnalysisError as e:
        raise HTTPException(status_code=422, detail=str(e))
```

### React Native

- Error Boundaries for component failures
- try/catch for async operations
- Display user-friendly error messages with toast/alert

---

## Mobile Patterns

### AsyncStorage

- Keys: descriptive (e.g., `"userProfile"`)
- Data: JSON stringify/parse
- API keys: Use `expo-secure-store`, not AsyncStorage

### Onboarding Flow

- Check AsyncStorage on mount with `useEffect` + `useCallback`
- Use `createNativeStackNavigator`
- Use `navigation.replace()` to prevent back navigation

### API Integration

- Base URL: `http://localhost:8000`
- POST `/api/v1/users` - Create user (returns `{user_id: int}`)
- POST `/api/v1/progress` - Save session
- GET `/api/v1/progress/{user_id}` - Get history
- GET `/api/v1/progress/{user_id}/summary` - Get summary

### Form UI

- Wrap in `KeyboardAvoidingView` (iOS: `behavior="padding"`)
- ScrollView with `keyboardShouldPersistTaps="handled"`
- `TouchableOpacity` with conditional styling for selections

### Navigation Patterns

- Export navigation param types from screen files when used by other components (e.g., `export type HomeStackParamList` from ExerciseScreen.tsx)
- Use `NativeStackNavigationProp<ParamListType>` for type-safe navigation hooks
- Navigation parameters: Pass data via route.params object (e.g., `navigation.navigate("ScreenName", { param: value })`)
- Stack navigators: Each tab can have its own stack for nested navigation (e.g., HomeStack, LibraryStack)
- Navigation flow: Use `navigation.replace()` for onboarding to prevent going back, `navigation.goBack()` for returning
- Alert dialogs for user confirmations (e.g., skipping locked days): Use `Alert.alert(title, message, [{text, onPress}, ...])`

### Progress Tracking

- Fetch user progress from GET /api/v1/progress/{userId} to get completed sessions
- Track completed days by mapping session.day values to a Set or Array
- Lock days sequentially: Day N is unlocked if user has completed at least N-1 days
- Display progress with visual indicators (checkmarks, lock icons, status badges)
- Confirm day skipping with Alert.alert() for locked days

### API Key Management

- BYOP (Bring Your Own Provider) pattern: Users can configure their own API keys for Azure/Google/OpenAI
- Use `expo-secure-store` for encrypted storage of sensitive data (API keys)
- SecureStore keys: Use descriptive names like "speech_api_key", "speech_provider"
- API key validation: Test button calls POST /api/v1/analyze with provider and api_key parameters
- Dropdown pattern: Use TouchableOpacity with state management for custom dropdowns in React Native
- Conditional UI: Only show API key input field when provider !== "free"

---

## Project Structure

```
backend/
├── app/
│   ├── api/              # Endpoints (analyze.py, progress.py)
│   ├── analyzers/        # Speech providers (free, azure, google, openai)
│   ├── content/schema/  # Pydantic models for curriculum
│   ├── models.py         # Database models
│   └── main.py           # FastAPI entry
├── tests/
├── pyproject.toml
└── uv.lock

mobile/
├── app/                  # Screens & navigation
├── components/           # Reusable UI
├── navigation/           # TabNavigator.tsx
├── screens/              # Screen components
└── package.json
```

---

## Testing

- Test behavior, not implementation
- Mock at network boundaries
- Focus on user-facing functionality
