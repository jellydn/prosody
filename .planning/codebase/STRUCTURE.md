# Codebase Structure

**Analysis Date:** 2026-02-24

## Directory Layout

```
english-rhythm-coach/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── api/                # Route handlers
│   │   ├── analyzers/          # Speech analysis providers
│   │   ├── content/
│   │   │   ├── curriculum/     # Day JSON files
│   │   │   ├── phrases/        # Meeting phrase data
│   │   │   └── schema/         # Pydantic models + JSON schemas
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app entry
│   │   └── models.py           # SQLAlchemy models
│   ├── tests/                  # pytest test files
│   ├── data/                   # SQLite database (generated)
│   ├── Dockerfile
│   └── requirements.txt
├── mobile/                     # React Native (Expo) frontend
│   ├── assets/
│   │   ├── curriculum/         # Day JSON files (duplicated from backend)
│   │   └── phrases/            # Meeting phrase data
│   ├── components/             # Reusable UI components
│   ├── navigation/             # Tab and stack navigators
│   ├── screens/                # Screen components
│   ├── App.tsx                 # Root component
│   ├── index.ts                # Expo entry point
│   ├── app.json                # Expo config
│   ├── package.json
│   └── tsconfig.json
├── scripts/
│   ├── generate_schema.py      # JSON schema generator
│   └── ralph/                  # Autonomous agent tooling
├── .github/workflows/ci.yml   # CI pipeline
├── .planning/                  # Planning documents
├── justfile                    # Task runner (just)
├── AGENTS.md                   # Agent coding guidelines
├── CLAUDE.md                   # AI assistant config
└── README.md
```

## Directory Purposes

**`backend/app/api/`:**
- Purpose: FastAPI route handlers
- Contains: `analyze.py` (audio analysis endpoint), `progress.py` (user + session CRUD)
- Key files: `analyze.py` (POST /api/v1/analyze), `progress.py` (POST /api/v1/users, /progress, GET /progress/{id})

**`backend/app/analyzers/`:**
- Purpose: Pluggable speech analysis engine
- Contains: Abstract base class, factory function, 4 provider implementations
- Key files: `base.py` (SpeechAnalyzer ABC, AnalysisResult), `factory.py` (get_analyzer), `free.py` (librosa/parselmouth), `azure.py`, `google.py`, `openai.py`

**`backend/app/content/`:**
- Purpose: Curriculum content and data schemas
- Contains: JSON curriculum files, Pydantic content models, JSON Schema definitions
- Key files: `schema/models.py` (Exercise, Day, MeetingPhrase), `curriculum/day-*.json`, `phrases/meetings.json`

**`backend/tests/`:**
- Purpose: Backend test suite
- Contains: pytest test files
- Key files: `test_analyze_api.py`, `test_progress.py`, `test_analyzers.py`, `test_byop_analyzers.py`

**`mobile/screens/`:**
- Purpose: Full-page screen components
- Contains: 11 screen files covering onboarding, home, exercises (5 types), dashboard, library, settings, session completion, program overview
- Key files: `HomeScreen.tsx`, `ExerciseScreen.tsx` (router), `StressDrillScreen.tsx`, `DashboardScreen.tsx`, `OnboardingScreen.tsx`

**`mobile/components/`:**
- Purpose: Reusable UI components
- Contains: Audio recording/playback, feedback display, branding
- Key files: `AudioRecorder.tsx`, `AudioPlayer.tsx`, `FeedbackCard.tsx`, `Logo.tsx`, `TabBarIcon.tsx`

**`mobile/navigation/`:**
- Purpose: App navigation structure
- Contains: Tab navigator with nested stack navigators
- Key files: `TabNavigator.tsx` (4 tabs: Home, Dashboard, Library, Settings)

**`mobile/assets/`:**
- Purpose: Static assets and bundled content data
- Contains: App icons, splash images, curriculum JSON, phrase JSON
- Key files: `curriculum/day-01.json` through `day-03.json`, `phrases/meetings.json`

**`scripts/`:**
- Purpose: Development and automation scripts
- Contains: Schema generation, autonomous agent tooling
- Key files: `generate_schema.py`, `ralph/prd.json`

## Key File Locations

**Entry Points:**
- `backend/app/main.py`: FastAPI application creation, middleware, router registration, DB init
- `mobile/index.ts`: Expo `registerRootComponent` entry
- `mobile/App.tsx`: Root React component with onboarding check and navigation container

**Configuration:**
- `justfile`: Task runner commands for dev, test, lint, format
- `mobile/app.json`: Expo project configuration
- `mobile/tsconfig.json`: TypeScript compiler settings
- `mobile/package.json`: Node dependencies and scripts
- `backend/requirements.txt`: Python dependencies
- `.github/workflows/ci.yml`: CI pipeline definition

**Core Logic:**
- `backend/app/analyzers/free.py`: Primary speech analysis using librosa + parselmouth
- `backend/app/analyzers/factory.py`: Provider selection logic
- `backend/app/api/analyze.py`: Audio upload, conversion, analysis orchestration
- `backend/app/api/progress.py`: User creation, session recording, summary calculation
- `mobile/screens/ExerciseScreen.tsx`: Exercise type → screen component router

**Testing:**
- `backend/tests/test_analyze_api.py`: Analysis endpoint tests
- `backend/tests/test_progress.py`: Progress/user endpoint tests
- `backend/tests/test_analyzers.py`: Analyzer unit tests
- `backend/tests/test_byop_analyzers.py`: Bring-your-own-provider analyzer tests

## Naming Conventions

**Files:**
- Components/screens: `PascalCase.tsx` (e.g., `AudioRecorder.tsx`, `HomeScreen.tsx`)
- Python modules: `snake_case.py` (e.g., `speech_analyzer.py`, `progress.py`)
- Tests (Python): `test_*.py` (e.g., `test_analyzers.py`)
- Tests (TS): `*.test.tsx` (convention, none exist yet)
- JSON data: `kebab-case.json` (e.g., `day-01.json`, `meetings.json`)

**Directories:**
- Feature-grouped: `screens/`, `components/`, `analyzers/`, `api/`
- Lowercase with no separators: `navigation/`, `content/`, `assets/`

**Code:**
- TypeScript: `camelCase` functions/variables, `PascalCase` components/types, `UPPER_SNAKE_CASE` constants
- Python: `snake_case` functions/variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants
- Navigation params: Exported `*ParamList` types from screen files (e.g., `HomeStackParamList`)

## Where to Add New Code

**New Exercise Type:**
- Screen: `mobile/screens/{Type}Screen.tsx`
- Route: Add case in `mobile/screens/ExerciseScreen.tsx` switch
- Icon mapping: Add to `EXERCISE_ICONS` in `mobile/screens/HomeScreen.tsx`
- Schema: Add enum value to `ExerciseType` in `backend/app/content/schema/models.py`

**New API Endpoint:**
- Route handler: `backend/app/api/{module}.py`
- Register: `app.include_router()` in `backend/app/main.py`
- Tests: `backend/tests/test_{module}.py`

**New Analyzer Provider:**
- Implementation: `backend/app/analyzers/{provider}.py` (extend `SpeechAnalyzer`)
- Registration: Add branch in `backend/app/analyzers/factory.py`
- Tests: `backend/tests/test_analyzers.py` or `test_byop_analyzers.py`

**New Mobile Screen:**
- Screen: `mobile/screens/{Name}Screen.tsx`
- Navigation: Add to appropriate stack in `mobile/navigation/TabNavigator.tsx`
- Param types: Export `*ParamList` from screen or navigator file

**New Reusable Component:**
- Component: `mobile/components/{Name}.tsx`

**Utilities:**
- Backend shared helpers: `backend/app/` (create module as needed)
- Mobile shared helpers: `mobile/` (no utils directory yet)

## Special Directories

**`backend/data/`:**
- Purpose: SQLite database storage
- Generated: Yes (`app.db` created on first run via `init_db()`)
- Committed: Yes (contains initial `app.db`)

**`.planning/`:**
- Purpose: Architecture and planning documentation
- Generated: No (manually authored)
- Committed: Yes

**`scripts/ralph/`:**
- Purpose: Autonomous agent (Ralph) configuration and progress tracking
- Generated: Partially (`progress.txt`, `.last-branch`)
- Committed: Yes

**`mobile/assets/`:**
- Purpose: Static assets bundled into the mobile app
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-24*
