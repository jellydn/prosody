# Architecture

**Analysis Date:** 2026-02-24

## Pattern Overview

**Overall:** Hybrid service/application split where a FastAPI backend hosts REST endpoints and pluggable speech analyzers while an Expo/React Native client orchestrates navigation, recording, and one-way sync to the backend.

**Key Characteristics:**
- FastAPI routers (`backend/app/api/analyze.py`, `backend/app/api/progress.py`) expose REST resources with dependency-injected SQLAlchemy sessions and CORS configured in `backend/app/main.py`.
- Provider strategy for speech scoring via `SpeechAnalyzer`/`BYOPScoringMixin` in `backend/app/analyzers/` that lets the same endpoint delegate to local (`FreeAnalyzer`) or paid (Azure, Google, OpenAI) implementations.
- Mobile app is organized into declarative navigation stacks (`mobile/navigation/TabNavigator.tsx`), stateless screens (`mobile/screens/*.tsx`), and shared components (`mobile/components/`) that communicate with the backend via `mobile/config/api.ts`.

## Layers

**API Layer (REST entry):**
- Purpose: Receive user progress requests and audio uploads.
- Location: `backend/app/main.py` and `backend/app/api/`.
- Contains: FastAPI app instantiation, CORS middleware, routers (`analyze.py`, `progress.py`), Pydantic request/response models (`AnalysisResponse`, `ProgressCreateRequest`, `ProgressSummary`).
- Depends on: Database/session helpers from `backend/app/models.py`, analyzers under `backend/app/analyzers/`, and `docs/content-and-audio-workflow.md` guidance for payload expectations.
- Used by: Mobile client screens (`mobile/screens/OnboardingScreen.tsx`, `mobile/screens/SessionCompletionScreen.tsx`, `mobile/screens/ChunkSpeakingScreen.tsx`) and automated schema tooling (`scripts/generate_schema.py`).

**Analyzer Layer (strategy/score):**
- Purpose: Translate uploaded audio into rhythm/stress/pacing/intonation scores.
- Location: `backend/app/analyzers/`.
- Contains: Abstract base classes (`SpeechAnalyzer`, `AnalysisResult`, `FeedbackItem`, `FeedbackType`), `BYOPScoringMixin`, provider implementations (`free.py`, `azure.py`, `google.py`, `openai.py`), and the factory (`factory.py`).
- Depends on: Provider SDKs (`librosa`, `parselmouth`, Azure/Google/OpenAI SDKs when installed) plus shared dataclasses.
- Used by: `backend/app/api/analyze.py` which requests an analyzer per provider selection.

**Data & Content Layer:**
- Purpose: Persist users/progress and the 14-day curriculum/meeting phrases.
- Location: `backend/app/models.py`, `backend/app/content/`, `backend/data/`.
- Contains: SQLAlchemy models `User`/`SessionResult`, DB initialization logic (`init_db`, `get_db`), curriculum JSON files (`backend/app/content/curriculum/day-*.json`), phrase catalogs (`backend/app/content/phrases/meetings.json`), and Pydantic schema definitions under `backend/app/content/schema/` plus the schema generator (`scripts/generate_schema.py`).
- Depends on: `DATABASE_URL` env var, standard SQLAlchemy configuration, and the schema generator script for upstream validation.
- Used by: API routers (persisting/fetching progress) and export tasks that keep mobile assets in sync (`mobile/assets/curriculum/*`).

**Mobile Client Layer:**
- Purpose: Surface curriculum, onboarding, and exercise experiences while persisting lightweight state and driving network calls.
- Location: `mobile/` (entry `App.tsx`, `index.ts`, `navigation/`, `screens/`, `components/`, `config/`, `assets/`, `types/`).
- Contains: React Navigation stacks/tabs, screens like `HomeScreen.tsx`, `ExerciseScreen.tsx`, `SessionCompletionScreen.tsx`, reusable widgets (`AudioRecorder.tsx`, `FeedbackCard.tsx`, `AudioPlayer.tsx`), config helpers (`api.ts`, `byop.ts`), and static lesson data (`assets/curriculum`, `assets/phrases`).
- Depends on: Expo packages (`expo-av`, `expo-speech`, `expo-secure-store`), `AsyncStorage`, fetch, and provider metadata via `appendByopToFormData`.
- Used by: End users running the Expo app, with entry wired through `mobile/index.ts`.

## Data Flow

**Onboarding → Progress Sync**
1. `mobile/screens/OnboardingScreen.tsx` collects profile info, stores it in `AsyncStorage`, and posts to `POST /api/v1/users` using `API_BASE_URL` from `mobile/config/api.ts`.
2. `backend/app/api/progress.py#create_user` creates a `User` row via `get_db()` from `backend/app/models.py`.
3. `mobile/screens/HomeScreen.tsx` retrieves `userId` from `AsyncStorage`, fetches `/api/v1/progress/{user_id}/summary` and `/api/v1/progress/{user_id}`, then renders the appropriate day (`CURRICULUM_BY_DAY` from `mobile/assets/curriculum/index.ts`).
4. After completing today’s exercises, `mobile/screens/SessionCompletionScreen.tsx` posts aggregated averages to `POST /api/v1/progress`, which `create_progress` stores in `SessionResult` and recalculates streak/averages on the next load.

**Audio Analysis Flow**
1. Exercise screens (e.g., `mobile/screens/ChunkSpeakingScreen.tsx`) record audio through `mobile/components/AudioRecorder.tsx`, optionally replay reference audio via `mobile/components/AudioPlayer.tsx`, and build `FormData` with the target text plus provider metadata from `mobile/config/byop.ts`.
2. The screen POSTs the multipart request to `/api/v1/analyze`; `analyze.py` streams the file, validates `Content-Type` in `SUPPORTED_FORMATS`, safeguards the size limit, and rewrites into WAV when needed using `pydub`.
3. The handler calls `get_analyzer` from `backend/app/analyzers/factory.py`, which instantiates either `FreeAnalyzer` or a paid provider (`AzureAnalyzer`, `GoogleAnalyzer`, `OpenAIAnalyzer`) that all implement `SpeechAnalyzer` and return `AnalysisResult`/`FeedbackItem` from `backend/app/analyzers/base.py`.
4. The response (schema `AnalysisResponse`) flows back to the client, which renders scores/feedback (`mobile/components/FeedbackCard.tsx`), updates session state, and triggers the completion workflow to persist the progress deck.

**State Management**
- Backend state is managed per request via the `get_db` dependency in `backend/app/models.py`, with `SessionLocal` sessions closed after each call and `init_db` ensuring schema on startup (`backend/app/main.py`).
- Mobile state lives in React hooks (`useState`, `useEffect`) inside screens (`HomeScreen.tsx`, `ChunkSpeakingScreen.tsx`) combined with persistence in `AsyncStorage` (`OnboardingScreen.tsx`, `SessionCompletionScreen.tsx`) and secure storage for provider keys (`expo-secure-store` via `mobile/config/byop.ts`).

## Key Abstractions

**`SpeechAnalyzer` + `BYOPScoringMixin`**
- Purpose: Define the contract for provider-specific scoring plus shared helper math (`_calculate_rhythm`, `_calculate_stress`, etc.).
- Examples: `backend/app/analyzers/free.py`, `backend/app/analyzers/azure.py`.
- Pattern: Abstract base class with mixin outlining BYOP scoring logic used by strategy implementations.

**`AnalysisResult` / `FeedbackItem` dataclasses**
- Purpose: Bundle four numeric scores and an ordered list of textual feedback.
- Examples: returned by every analyzer and serialized by `backend/app/api/analyze.py` into `AnalysisResponse`.
- Pattern: `dataclass` + Enum ensures consistent shape across providers.

**`CURRICULUM_BY_DAY` + `Exercise` type**
- Purpose: Canonical lesson metadata consumed by the mobile UI and mirrored in `backend/app/content/curriculum/`.
- Examples: `mobile/assets/curriculum/index.ts`, `backend/app/content/schema/models.py`.
- Pattern: Static JSON inventory imported via TypeScript `import` syntax for immediate access in `HomeScreen.tsx`.

**`API_BASE_URL` resolution**
- Purpose: Determine backend host based on Expo dev server, emulator, or environment override.
- Examples: `mobile/config/api.ts`.
- Pattern: Helper function that trims slashes and handles platform-specific overrides.

**`appendByopToFormData` helper**
- Purpose: Centralize BYOP provider selection and optional API key retrieval from secure storage.
- Examples: `mobile/config/byop.ts` called from `ChunkSpeakingScreen.tsx` before hitting `/api/v1/analyze`.
- Pattern: Async helper that appends the provider and returns headers for manual fetch calls.

## Entry Points

**`backend/app/main.py`**
- Location: `backend/app/main.py`
- Triggers: `uvicorn app.main:app` (see `just backend-dev`).
- Responsibilities: Configure logging/CORS, register routers, initialize the DB via the lifespan context, expose `/health`.

**`mobile/App.tsx`**
- Location: `mobile/App.tsx`
- Triggers: `registerRootComponent(App)` in `mobile/index.ts`.
- Responsibilities: Decide between onboarding vs. main tab navigator (`mobile/navigation/TabNavigator.tsx`), orchestrate initial loading state.

**`scripts/generate_schema.py`**
- Location: `scripts/generate_schema.py`
- Triggers: `just backend-schema` (per `docs/content-and-audio-workflow.md`).
- Responsibilities: Dump JSON schemas for curriculum models under `backend/app/content/schema/`.

## Error Handling

**Strategy:** Validate inputs via Pydantic models, guard file handling, and bubble issues through `HTTPException` so FastAPI renders proper status codes. Client-side screens show `Alert.alert` when fetches fail.

**Patterns:**
- backend route handlers wrap risky blocks in `try/except`, logging with `logger.exception` and re-raising `HTTPException` with user-friendly messages (see `backend/app/api/analyze.py`).
- Mobile screens (e.g., `SessionCompletionScreen.tsx`) catch failed fetches to surface `Alert.alert` and console errors.

## Cross-Cutting Concerns

**Logging:** Configured once in `_configure_logging()` inside `backend/app/main.py` and reused via `logger = logging.getLogger(__name__)` in `analyze.py`, ensuring request-bound info (provider, payload size) is emitted.

**Validation:** Pydantic models (`ProgressCreateRequest`, `ProgressSummary`, `AnalysisResponse`) enforce payload shape; `backend/app/content/schema/models.py` plus `scripts/generate_schema.py` generate reference schemas for lesson content as documented in `docs/content-and-audio-workflow.md`.

**Authentication:** There is no user authentication; the backend relies on provider API keys appended via headers from `mobile/config/byop.ts`, but all other endpoints are open (the app stores `userId` locally via `AsyncStorage`).

---

*Architecture analysis: 2026-02-24*
