# Codebase Structure

**Analysis Date:** 2026-02-24

## Directory Layout

```
[project-root]/
├── backend/           # FastAPI service, analyzers, content, tests
├── mobile/            # Expo/React Native client (navigation, screens, assets)
├── docs/              # Written workflows (curriculum/audio guidance)
├── scripts/           # Helper scripts (schema generator)
├── .planning/         # Generated architecture/structure notes
├── justfile           # Task shortcuts (`just backend-dev`, `just mobile-test`, etc.)
├── README.md          # Project overview & setup steps
├── logo.svg           # Brand asset used by the mobile app
└── config/??? (none)  # No standalone config directory
```

## Directory Purposes

**`.planning/`:**
- Purpose: Store generated knowledge about this repo.
- Contains: `codebase/ARCHITECTURE.md`, `codebase/STRUCTURE.md` plus other analysis artifacts (removed before this task and now regenerated).
- Key files: ``.planning/codebase/ARCHITECTURE.md``, ``.planning/codebase/STRUCTURE.md``.

**`backend/`:**
- Purpose: Host the FastAPI backend, speech analyzers, curriculum content, and Python tests.
- Contains: `app/` (FastAPI entrypoints, analyzers, content schema), `data/` (SQLite DB file), `tests/test_byop_analyzers.py`, `pyproject.toml`, `uv.lock`.
- Key files: ``backend/app/main.py``, ``backend/app/api/analyze.py``, ``backend/app/api/progress.py``, ``backend/app/analyzers/free.py``, ``backend/app/content/curriculum/day-01.json``.

**`mobile/`:**
- Purpose: Provide the Expo/React Native experience remotely hitting the backend.
- Contains: `App.tsx`, `index.ts`, navigation (`navigation/TabNavigator.tsx`), reusable UI (`components/`), screens (`screens/*.tsx`), config helpers (`config/api.ts`, `config/byop.ts`), assets (`assets/curriculum/`, `assets/phrases/`, logos), and type definitions (`types/analysis.ts`).
- Key files: ``mobile/App.tsx``, ``mobile/navigation/TabNavigator.tsx``, ``mobile/screens/HomeScreen.tsx``, ``mobile/screens/ChunkSpeakingScreen.tsx``.

**`docs/`:**
- Purpose: Capture workflows and developer guidance beyond code.
- Contains: `content-and-audio-workflow.md` describing content syncing and audio fallback rules referenced from both sides.

**`scripts/`:**
- Purpose: Support ancillary tooling for schema generation.
- Contains: `generate_schema.py` which imports `backend/app/content/schema/models.py` to dump JSON schemas.
- Key file: ``scripts/generate_schema.py``.

**`justfile`:**
- Purpose: Centralize CLI commands (`backend-dev`, `backend-test`, `mobile-lint`, `mobile-format`, etc.) and link to `uv`, `npx`, or `expo` tooling.

**`README.md`:**
- Purpose: Entry-level instructions for installing dependencies and understanding the project layout.

**`logo.svg`:**
- Purpose: Brand asset used via `mobile/assets/logo.svg` and referenced by the Expo app’s splash screens.

## Key File Locations

**Entry Points:**
- ``backend/app/main.py``: FastAPI app setup, logging, CORS, and lifespan hook that initializes `init_db()`.
- ``mobile/App.tsx``: Chooses between onboarding flow or main `TabNavigator`, then renders `NavigationContainer`.

**Configuration:**
- ``backend/pyproject.toml`` + ``uv.lock``: Defines Python dependencies (FastAPI, SQLAlchemy, analyzers) and lockfile for `uv`.
- ``mobile/package.json`` + ``tsconfig.json``: Pin Expo, React Navigation, and TypeScript settings for the mobile client.
- ``mobile/config/api.ts``: Resolves `API_BASE_URL` based on emulator/dev server and `process.env` overrides.
- ``mobile/config/byop.ts``: Reads provider/API keys from `expo-secure-store` and appends `X-Provider-Api-Key`.
- ``justfile``: Maps `just backend-dev`, `just mobile-test`, `just check`, etc.

**Core Logic:**
- ``backend/app/api/analyze.py`` + ``backend/app/analyzers/*``: Handle audio uploads, format conversions, provider selection, scoring, and response shaping.
- ``backend/app/api/progress.py`` + ``backend/app/models.py``: Validate requests, maintain SQLAlchemy models, and compute progress summaries.
- ``mobile/screens/*.tsx`` + ``mobile/components/*.tsx``: UI layout, recording/analysis flows, `HomeScreen`, `ExerciseScreen`, `SessionCompletionScreen`, `ChunkSpeakingScreen`, `FeedbackCard`, `AudioRecorder`, `AudioPlayer`.
- ``mobile/assets/curriculum/`` and ``mobile/assets/phrases/``: Static lesson content imported through `CURRICULUM_BY_DAY` (`mobile/assets/curriculum/index.ts`).

**Testing:**
- ``backend/tests/test_byop_analyzers.py``: Unit tests around analyzer base classes and provider wiring.
- Mobile client currently lacks automated tests; unit/integration coverage is expected to follow `just mobile-test` once added.

## Naming Conventions

**Files:**
- React Native screens/components: PascalCase with `.tsx` (e.g., ``mobile/screens/HomeScreen.tsx``, ``mobile/components/AudioPlayer.tsx``).
- TypeScript modules (helpers/config): camelCase file names (e.g., ``mobile/config/api.ts``, ``mobile/config/byop.ts``) while type definitions include `PascalCase` when they export interfaces/types.
- Python modules: snake_case for files in `backend/app/api/` and `backend/app/analyzers/` (e.g., ``analyze.py``, ``progress.py``, ``free.py``), PascalCase for classes/ORM models (e.g., `User`, `SessionResult`).

**Directories:**
- Group by concern: `screens/` for full views, `components/` for shared widgets, `navigation/` for stack/tab definitions, `assets/` for static data.
- Backend splits: `api/`, `analyzers/`, `content/`, `models.py`, `tests/`.

## Where to Add New Code

**New Feature (backend):**
- Primary code: `backend/app/api/` for endpoints, `backend/app/models.py` for new tables, `backend/app/analyzers/` for any scoring behavior, `backend/tests/` for regression coverage.
- Tests: `backend/tests/` following the style in `test_byop_analyzers.py`.

**New Component (mobile):**
- Implementation: Add screen under `mobile/screens/` and reusable view under `mobile/components/`, wire navigation inside `mobile/navigation/TabNavigator.tsx` or stacks, update `mobile/assets/` if new static content is needed.

**Utilities:**
- Shared helpers go under `mobile/config/` (see `api.ts`, `byop.ts`) or `mobile/types/` when describing shapes.
- Server utilities (schema generation) live in `scripts/generate_schema.py` and rely on `backend/app/content/schema/models.py`.

## Special Directories

**`.planning/codebase/`:**
- Purpose: Capture structured architecture/structure analysis.
- Generated: yes (documents rebuilt when this task runs).
- Committed: yes, so future agents reference the latest analysis file names.

**`backend/data/`:**
- Purpose: Stores SQLite database files when `DATABASE_URL` points to `sqlite:///./data/app.db`.
- Generated: yes (created during `backend/app/main.py` startup or `init_db`).
- Committed: no (the folder is ignored, but the folder tree exists for runtime storage).

**`mobile/assets/curriculum/` & `mobile/assets/phrases/`:**
- Purpose: Static JSON lessons referenced by `CURRICULUM_BY_DAY` and mirrored on the backend in `backend/app/content/curriculum/`.
- Generated: authored manually and kept in sync with backend folders described in `docs/content-and-audio-workflow.md`.
- Committed: yes (these files ship with the client).

---

*Structure analysis: 2026-02-24*
