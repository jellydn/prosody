# Architecture

**Analysis Date:** 2026-02-24

## Pattern Overview

**Overall:** Client-Server Monorepo (React Native mobile + Python FastAPI backend)

**Key Characteristics:**
- Monorepo with `backend/` (FastAPI/SQLAlchemy) and `mobile/` (Expo/React Native) as independent deployables
- Strategy pattern for pluggable speech analysis providers (free, Azure, Google, OpenAI)
- REST API communication with JSON payloads; audio uploads via multipart form
- Local-first curriculum: JSON content bundled in both backend and mobile assets
- SQLite persistence with SQLAlchemy ORM on the backend; AsyncStorage for client-side state

## Layers

**Mobile UI (Presentation):**
- Purpose: User-facing screens, navigation, and interactive exercises
- Location: `mobile/screens/`, `mobile/components/`
- Contains: Screen components, reusable UI components (AudioRecorder, AudioPlayer, FeedbackCard)
- Depends on: React Navigation, Expo SDK (expo-audio), AsyncStorage, backend REST API
- Used by: End users via Expo Go or native build

**Mobile Navigation:**
- Purpose: Screen routing and tab/stack structure
- Location: `mobile/navigation/TabNavigator.tsx`, `mobile/App.tsx`
- Contains: Bottom tab navigator with 4 tabs (Home, Dashboard, Library, Settings), nested stack navigators per tab
- Depends on: `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
- Used by: App.tsx root component

**API Layer:**
- Purpose: HTTP endpoints for analysis and progress tracking
- Location: `backend/app/api/`
- Contains: Route handlers (`analyze.py`, `progress.py`) with Pydantic request/response models
- Depends on: FastAPI, SQLAlchemy session (via `Depends(get_db)`), analyzer factory
- Used by: Mobile app via HTTP

**Analysis Engine:**
- Purpose: Speech audio analysis with multiple provider backends
- Location: `backend/app/analyzers/`
- Contains: Abstract base (`SpeechAnalyzer`), factory (`get_analyzer`), implementations (Free, Azure, Google, OpenAI)
- Depends on: librosa, parselmouth, numpy (free); Azure SDK, OpenAI SDK (paid)
- Used by: `/api/v1/analyze` endpoint

**Data/Persistence:**
- Purpose: Database models and session management
- Location: `backend/app/models.py`
- Contains: SQLAlchemy models (`User`, `SessionResult`), `init_db()`, `get_db()` generator
- Depends on: SQLAlchemy, SQLite
- Used by: API route handlers

**Content/Schema:**
- Purpose: Curriculum data models and JSON content
- Location: `backend/app/content/schema/models.py`, `backend/app/content/curriculum/`, `mobile/assets/curriculum/`
- Contains: Pydantic models (`Exercise`, `Day`, `MeetingPhrase`), JSON curriculum files (day-01 through day-03), meeting phrases
- Depends on: Pydantic
- Used by: Mobile screens (loaded via import), API for validation

## Data Flow

**Audio Analysis Flow:**
1. User records audio via `AudioRecorder` component (expo-audio)
2. Exercise screen sends audio file + target text to `POST /api/v1/analyze` (multipart form)
3. API validates format, converts non-WAV to WAV via pydub, selects analyzer via factory
4. Analyzer processes audio (librosa/parselmouth for free; SDK calls for paid providers)
5. Returns `AnalysisResult` with 4 scores (rhythm, stress, pacing, intonation) + feedback items
6. `FeedbackCard` component renders scores and feedback messages

**User Onboarding Flow:**
1. App checks AsyncStorage for `userProfile` key on mount
2. If missing, shows `OnboardingScreen` (language, level, goal selection)
3. On submit: saves profile to AsyncStorage, creates user via `POST /api/v1/users`
4. Stores returned `user_id` in AsyncStorage, navigates to main app via `navigation.replace()`

**Progress Tracking Flow:**
1. After completing all exercises in a day, `SessionCompletionScreen` saves session via `POST /api/v1/progress`
2. `DashboardScreen` fetches summary (`GET /api/v1/progress/{userId}/summary`) and history (`GET /api/v1/progress/{userId}`)
3. Displays streak, averages, trend, and chart visualization

**State Management:**
- **Client-side:** `useState` for local component state; AsyncStorage for persistent user data (`userProfile`, `userId`)
- **Server-side:** SQLite database via SQLAlchemy ORM; session-scoped DB connections via FastAPI `Depends`
- No global state management library (no Zustand/Redux); state passed via navigation params and callbacks

## Key Abstractions

**SpeechAnalyzer (Strategy Pattern):**
- Purpose: Pluggable speech analysis with consistent interface across providers
- Examples: `backend/app/analyzers/base.py`, `backend/app/analyzers/free.py`, `backend/app/analyzers/azure.py`
- Pattern: Abstract base class with `analyze(audio_path, target_text) -> AnalysisResult`; factory function `get_analyzer(provider, api_key)` selects implementation

**Exercise Type Routing:**
- Purpose: Maps exercise types to specialized screen components
- Examples: `mobile/screens/ExerciseScreen.tsx` → dispatches to `StressDrillScreen`, `LinkingPracticeScreen`, `ChunkSpeakingScreen`, `ShadowingModeScreen`, `IntonationTrainingScreen`
- Pattern: Switch-case routing based on `exercise.type` enum

**Curriculum Content:**
- Purpose: Structured exercise data for the 14-day program
- Examples: `backend/app/content/curriculum/day-01.json`, `mobile/assets/curriculum/day-01.json`
- Pattern: JSON data conforming to Pydantic schema (`Day` → `Exercise[]`); duplicated in both backend and mobile assets

**AnalysisResult:**
- Purpose: Standardized output from all speech analyzers
- Examples: `backend/app/analyzers/base.py`
- Pattern: Dataclass with 4 float scores + list of `FeedbackItem` (type + message)

## Entry Points

**Backend (`app.main:app`):**
- Location: `backend/app/main.py`
- Triggers: `uvicorn app.main:app --reload`
- Responsibilities: Creates FastAPI app, registers CORS middleware, includes API routers, initializes database on startup, exposes `/health` endpoint

**Mobile (`index.ts` → `App.tsx`):**
- Location: `mobile/index.ts`, `mobile/App.tsx`
- Triggers: `npx expo start` (via `registerRootComponent`)
- Responsibilities: Checks onboarding status, renders either OnboardingScreen or TabNavigator based on AsyncStorage state

## Error Handling

**Strategy:** Boundary-level error handling with HTTP exceptions (backend) and user-facing alerts (mobile)

**Patterns:**
- Backend routes wrap operations in try/catch, raise `HTTPException` with appropriate status codes (400, 404, 422, 500)
- Audio format validation at API boundary before processing
- Temp file cleanup in both success and error paths (`finally` blocks)
- Mobile screens use try/catch on fetch calls with `Alert.alert()` for user-facing errors
- `console.error` for logging on both client and server

## Cross-Cutting Concerns

**Logging:** `console.error` on mobile; no structured logging on backend (stdout via uvicorn)

**Validation:** Pydantic models for API request/response validation; content schema models for curriculum data; audio format whitelist (`SUPPORTED_FORMATS`) at upload boundary

**Authentication:** None — no auth layer; user identified by auto-increment `user_id` stored in AsyncStorage; paid analyzer API keys passed per-request via form field

**CORS:** Fully permissive (`allow_origins=["*"]`) for development

**CI/CD:** GitHub Actions workflow runs backend lint+tests (Python 3.12, ruff, pytest) and mobile typecheck+lint (Node 20, tsc, oxlint, oxfmt)

---

*Architecture analysis: 2026-02-24*
