# Coding Conventions

**Analysis Date:** 2026-02-24

## Naming Patterns

**Files:**
- `PascalCase` for React Native screens/components such as `mobile/screens/HomeScreen.tsx`, `mobile/components/AudioPlayer.tsx`, `mobile/navigation/TabNavigator.tsx`, and `mobile/components/TabBarIcon.tsx`.
- `snake_case` for backend modules like `backend/app/api/analyze.py`, `backend/app/api/progress.py`, and `backend/app/models.py`.

**Functions:**
- CamelCase for UI helpers/hooks (`loadProgress`, `handleExerciseComplete`, `renderChunkedText`, `playSound`) in `mobile/screens/HomeScreen.tsx` and `mobile/components/AudioPlayer.tsx`.
- `snake_case` for FastAPI endpoints/helpers (`create_user`, `create_progress`, `get_progress_summary`, `_configure_logging`, `_parse_cors_origins`) in `backend/app/api/progress.py` and `backend/app/main.py`.

**Variables:**
- UPPER_SNAKE_CASE constants for configuration data such as `EXERCISE_ICONS` (`mobile/screens/HomeScreen.tsx`), `API_BASE_URL` (`mobile/config/api.ts`), `SUPPORTED_FORMATS`, and `MAX_AUDIO_SIZE_BYTES` (`backend/app/api/analyze.py`).
- Descriptive camelCase on the mobile side (`currentDay`, `completedExercises`, `sessionScores`) and snake_case in Python (`session_result`, `user_id`, `audio_size_bytes`).

**Types:**
- TypeScript interfaces/aliases (`DayData`, `AudioPlayerProps`, `Exercise`, `ExerciseScores`, `HomeStackParamList`) defined in `mobile/screens/HomeScreen.tsx` and `mobile/screens/ExerciseScreen.tsx` capture props, navigation params, and curriculum structure.
- Backend dataclasses/Pydantic models such as `FeedbackType`, `AnalysisResult`, `ProgressCreateRequest`, and `ProgressSummary` appear in `backend/app/analyzers/base.py` and `backend/app/api/progress.py`.

## Code Style

**Formatting:**
- Mobile formatting relies on `oxfmt` (`mobile/package.json` scripts `fmt`/`fmt:check`) and Expo’s `tsconfig` (`mobile/tsconfig.json`) that extends `expo/tsconfig.base` with `strict` mode.
- Backend formatting runs through `uv run ruff format .` inside `just backend-lint`, followed by `uv run ruff check .` as described in `justfile`.

**Linting:**
- `oxlint` vets the mobile code (`mobile/package.json` `lint` script, `just mobile-lint`).
- `ruff` underpins backend linting via `just backend-lint`; `backend/pyproject.toml` contains no `[tool.ruff]` overrides, so defaults apply.

## Import Organization

**Order:**
1. Framework/library imports (`@expo/*`, `react`, `react-native`, `@react-navigation/*`) as shown in `mobile/screens/HomeScreen.tsx` and `mobile/components/AudioPlayer.tsx`.
2. Expo utilities, navigation hooks, and `useX` hooks before local assets/config files (`../assets/curriculum`, `../config/api`).
3. Backend files follow stdlib → third-party (`datetime`, `typing`, `fastapi`, `sqlalchemy`) → app package order (`from app.models import ...` in `backend/app/api/progress.py`).

**Path Aliases:**
- No custom path aliases; the codebase uses module specifiers (`@expo/*`, `react`) and relative/local packages (`../screens`, `from app.*`).

## Error Handling

**Patterns:**
- Mobile async helpers wrap fetches or audio playback in `try/catch`, log with `console.error`, and fall back to safe defaults (`loadProgress` in `mobile/screens/HomeScreen.tsx`, `playSound` in `mobile/components/AudioPlayer.tsx`).
- Backend routers raise `fastapi.HTTPException` for invalid formats, missing users, provider errors, and oversized payloads while logging `warning`/`exception` entries and cleaning temp files in `backend/app/api/analyze.py`.

## Logging

**Framework:** `logging` on the backend and `console` on the mobile side.

**Patterns:**
- `_configure_logging()` in `backend/app/main.py` seeds `logging.basicConfig`, and module-scoped loggers (`logging.getLogger(__name__)`) emit `info`/`warning`/`exception` messages inside `backend/app/api/analyze.py`.
- Mobile catch blocks log errors via `console.error("Error loading progress:", err)` in `mobile/screens/HomeScreen.tsx` and `console.error("Error playing sound:", error)` in `mobile/components/AudioPlayer.tsx`.

## Comments

**When to Comment:**
- Inline comments are sparse (`mobile/screens/HomeScreen.tsx`, `mobile/components/AudioPlayer.tsx`, `backend/app/api/analyze.py` rely on descriptive identifiers instead of annotations).

**JSDoc/TSDoc:**
- No consistent JSDoc/TSDoc; TypeScript interfaces like `AudioPlayerProps` (`mobile/components/AudioPlayer.tsx`) document prop shapes.

## Function Design

**Size:**
- React hooks/helpers stay compact (a few dozen lines), while FastAPI route handlers (e.g., `create_progress`, `get_progress_summary` in `backend/app/api/progress.py`) concentrate on a single HTTP action.

**Parameters:**
- UI helpers accept strongly typed props (`handleExerciseComplete(exerciseId: string, scores: ExerciseScores)` in `mobile/screens/HomeScreen.tsx`); backend routes take Pydantic bodies or typed params (`ProgressCreateRequest`, `user_id: int`).

**Return Values:**
- Mobile functions update state or trigger navigation; backend endpoints return Pydantic responses or plain dicts (such as `return {"message": "Progress saved successfully", "id": session_result.id}` in `backend/app/api/progress.py`).

## Module Design

**Exports:**
- Each React file exports a default component plus local styles (`StyleSheet.create` at the bottom of `mobile/screens/HomeScreen.tsx` and `mobile/components/AudioPlayer.tsx`).
- Backend API files expose an `APIRouter` named `router` that is registered in `backend/app/main.py` (`app.include_router(...)`).

**Barrel Files:**
- There are no barrel exports; `backend/app/api/__init__.py` is empty, and routers are imported explicitly in `backend/app/main.py`.

---

*Convention analysis: 2026-02-24*
