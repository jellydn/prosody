# Coding Conventions

**Analysis Date:** 2026-02-24

## Naming Patterns

**Files:**
- TypeScript components: `PascalCase.tsx` (e.g., `AudioPlayer.tsx`, `HomeScreen.tsx`, `TabNavigator.tsx`)
- TypeScript entry: `camelCase.ts` (e.g., `index.ts`)
- Python modules: `snake_case.py` (e.g., `analyze.py`, `speech_analyzer.py`)
- Python tests: `test_<module>.py` (e.g., `test_analyzers.py`, `test_progress.py`)
- JSON data: `kebab-case.json` (e.g., `day-01.json`, `meetings.json`)

**Functions:**
- TypeScript: `camelCase` (e.g., `handleExerciseComplete`, `loadProgress`, `playSound`)
- Python: `snake_case` (e.g., `analyze_audio`, `get_progress`, `init_db`)
- Python private: `_snake_case` (e.g., `_analyze_rhythm`, `_calculate_stress`, `_generate_feedback`)

**Variables:**
- TypeScript: `camelCase` (e.g., `isPlaying`, `hasPermission`, `recordedUri`)
- TypeScript constants: `UPPER_SNAKE_CASE` (e.g., `EXERCISE_ICONS`, `NATIVE_LANGUAGES`, `ENGLISH_LEVELS`)
- Python: `snake_case` (e.g., `rhythm_score`, `feedback_items`, `temp_path`)
- Python constants: `UPPER_SNAKE_CASE` (e.g., `SUPPORTED_FORMATS`, `DATABASE_URL`, `FREE_ANALYZER_AVAILABLE`)

**Types:**
- TypeScript: `interface` preferred for component props and data shapes (e.g., `AudioPlayerProps`, `FeedbackCardProps`)
- TypeScript: `type` used for unions, aliases, and param lists (e.g., `ExerciseType`, `HomeStackParamList`, `DayData`)
- Python: Pydantic `BaseModel` for request/response schemas (e.g., `AnalysisResponse`, `UserCreateRequest`)
- Python: `@dataclass` for internal data structures (e.g., `AnalysisResult`, `FeedbackItem`)
- Python: `str, Enum` for string enums (e.g., `FeedbackType`, `ExerciseType`)

## Code Style

**Formatting:**
- TypeScript: `oxfmt` (Oxc formatter)
- TypeScript indentation: Tabs
- TypeScript trailing commas: Yes (in function params, arrays, objects)
- Python: `ruff format` (Black-compatible)
- Python indentation: 4 spaces
- Python quotes: Double quotes

**Linting:**
- TypeScript: `oxlint` (Oxc linter) — no config file, uses defaults
- Python: `ruff check` — no config file, uses defaults
- TypeScript: `tsc --noEmit` with `strict: true` (extends `expo/tsconfig.base`)
- CI enforces: lint + format check + typecheck (no tests in mobile CI)

## Import Organization

**TypeScript Order:**
1. Expo/React Native packages (`@expo/vector-icons`, `expo-audio`, `react`, `react-native`)
2. Third-party navigation (`@react-navigation/*`, `@react-native-async-storage/*`)
3. Relative internal imports (`../components/`, `../screens/`, `../navigation/`)
4. Asset imports (`../assets/curriculum/`)

**Python Order:**
1. Standard library (`os`, `tempfile`, `datetime`, `enum`, `abc`)
2. Third-party (`fastapi`, `sqlalchemy`, `pydantic`, `librosa`, `numpy`, `parselmouth`)
3. Internal app imports (`app.models`, `app.analyzers.base`)
4. Relative imports within packages (`.base`, `.free`)

**Path Aliases:**
- None configured — all imports use relative paths

## Error Handling

**FastAPI Patterns:**
- `HTTPException` with `status` module constants (e.g., `status.HTTP_400_BAD_REQUEST`, `status.HTTP_404_NOT_FOUND`)
- Try/except wrapping entire endpoint logic with specific exception re-raise and generic fallback to 500
- Re-raise `HTTPException` explicitly before catching generic `Exception`
- Resource cleanup in except blocks (e.g., `os.unlink(temp_path)`)
- `ValueError` for invalid arguments in factory/utility functions (e.g., `get_analyzer()`)

**React Native Patterns:**
- `try/catch` for all async operations (API calls, AsyncStorage, audio recording)
- `console.error()` for developer-facing error logging
- `Alert.alert()` for user-facing error messages with action buttons
- Graceful degradation: return early or show fallback UI on missing data (e.g., `if (!currentDay) return <Loading />`)
- `finally` blocks to reset loading states

## Logging

**Framework:** `console` (both frontend and backend)

**Patterns:**
- TypeScript: `console.error("Error <context>:", err)` — only for caught errors
- Python: No structured logging — errors propagated via HTTPException
- No logging library configured in either codebase

## Comments

**When to Comment:**
- Sparingly — code is largely self-documenting
- Only inline comment found: `mobile/index.ts` explaining `registerRootComponent`
- Pydantic `Field(description=...)` serves as documentation for API schemas
- `Config.json_schema_extra` with examples in Pydantic models

**JSDoc/TSDoc:**
- Not used in TypeScript files
- Python docstrings: Minimal — only `generate_json_schema()` has a docstring
- Pydantic `Field(description=...)` preferred over docstrings for model documentation

## Function Design

**Size:** Functions are small-to-medium (5–30 lines typical). Screen components are larger (50–100 lines of JSX).

**Parameters:**
- TypeScript: Destructured props objects for components (e.g., `{ exercise, onNext, onBack, onComplete }`)
- TypeScript: Callback functions passed as props (e.g., `onRecordingComplete`, `onComplete`)
- Python: FastAPI dependency injection via `Depends()` (e.g., `db: Session = Depends(get_db)`)
- Python: `Optional[str]` with defaults for optional params

**Return Values:**
- TypeScript: JSX elements from components, void from handlers
- Python: Pydantic models as response types (`response_model=AnalysisResponse`)
- Python: `@dataclass` for internal return types (`AnalysisResult`)

## Module Design

**Exports:**
- TypeScript: `export default function` for all components and screens (one per file)
- TypeScript: Named exports for shared types (e.g., `export type HomeStackParamList`, `export interface Exercise`)
- Python: No `__all__` definitions; empty `__init__.py` files
- Python: Factory function pattern for analyzer instantiation (`get_analyzer()`)

**Barrel Files:**
- Not used — direct file imports throughout
- Python `__init__.py` files are empty (marker files only)

## Architecture Patterns

**Backend:**
- ABC base class with concrete implementations (Strategy pattern for analyzers)
- Factory function for provider selection (`get_analyzer()`)
- FastAPI router separation by domain (`analyze.py`, `progress.py`)
- SQLAlchemy models with `get_db()` generator for session management

**Mobile:**
- Functional components with hooks (no class components)
- `useState` for local state, `AsyncStorage` for persistence
- `useCallback` for memoized handlers, `useEffect` for side effects
- Screen-as-router pattern (ExerciseScreen delegates to type-specific screens)
- Stack navigators nested inside tab navigator
- `StyleSheet.create()` at module level for all styling
- `as const` assertions for constant arrays/objects

---

*Convention analysis: 2026-02-24*
