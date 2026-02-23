# Codebase Concerns

**Analysis Date:** 2026-02-23

## Tech Debt

**Massive code duplication across exercise screens:**
- Issue: `StressDrillScreen`, `LinkingPracticeScreen`, `ChunkSpeakingScreen`, `IntonationTrainingScreen` share ~80% identical code — same interfaces (`Exercise`, `AnalysisResult`, `FeedbackItem`), same `analyzeRecording()` function, same `cleanupRecording()`, same layout structure, same styles
- Files: `mobile/screens/StressDrillScreen.tsx`, `mobile/screens/LinkingPracticeScreen.tsx`, `mobile/screens/ChunkSpeakingScreen.tsx`, `mobile/screens/IntonationTrainingScreen.tsx`
- Impact: Every bug fix or API change must be replicated in 4+ files; high risk of drift
- Fix approach: Extract shared `useAnalysis()` hook, shared `ExerciseLayout` wrapper component, and centralize duplicated interfaces into a shared types file

**Duplicated analyzer scoring logic (Azure, Google, OpenAI):**
- Issue: `_calculate_rhythm`, `_calculate_stress`, `_calculate_pacing`, `_calculate_intonation`, `_word_similarity`, and `_generate_feedback` are copy-pasted identically across all three paid analyzers
- Files: `backend/app/analyzers/azure.py`, `backend/app/analyzers/google.py`, `backend/app/analyzers/openai.py`
- Impact: Scoring changes require editing 3 files; inconsistencies will emerge
- Fix approach: Extract shared scoring mixin or base class with common methods; only override the speech recognition step

**Hardcoded localhost API URLs scattered everywhere:**
- Issue: `http://localhost:8000` is hardcoded in 10+ locations across mobile screens with no centralized configuration
- Files: `mobile/screens/HomeScreen.tsx`, `mobile/screens/DashboardScreen.tsx`, `mobile/screens/StressDrillScreen.tsx`, `mobile/screens/OnboardingScreen.tsx`, `mobile/screens/SessionCompletionScreen.tsx`, `mobile/screens/SettingsScreen.tsx`, `mobile/screens/ProgramOverviewScreen.tsx`, `mobile/screens/LinkingPracticeScreen.tsx`, `mobile/screens/IntonationTrainingScreen.tsx`, `mobile/screens/ChunkSpeakingScreen.tsx`, `mobile/screens/ShadowingModeScreen.tsx`
- Impact: Cannot deploy to production or test on physical devices; every URL change requires editing all files
- Fix approach: Create a centralized `config.ts` or use environment variables via `expo-constants`

**Unpinned Python dependencies:**
- Issue: `requirements.txt` has no version pins — `fastapi`, `sqlalchemy`, `librosa`, `pydub`, `parselmouth`, etc. are all unpinned
- Files: `backend/requirements.txt`
- Impact: Builds are non-reproducible; a breaking dependency update will silently break production
- Fix approach: Pin all dependencies with exact versions (e.g., `fastapi==0.115.0`)

**Deprecated SQLAlchemy API usage:**
- Issue: Uses `declarative_base()` from `sqlalchemy.ext.declarative` which is deprecated; should use `sqlalchemy.orm.DeclarativeBase`
- Files: `backend/app/models.py`
- Impact: Will break on future SQLAlchemy versions
- Fix approach: Migrate to `DeclarativeBase` pattern

**Deprecated FastAPI lifecycle event:**
- Issue: Uses `@app.on_event("startup")` which is deprecated in favor of `lifespan` context manager
- Files: `backend/app/main.py`
- Impact: Will produce warnings and eventually break on future FastAPI versions
- Fix approach: Migrate to FastAPI `lifespan` parameter

**Mobile curriculum is incomplete and HomeScreen is still hardcoded to Day 1:**
- Issue: `HomeScreen` hardcodes `import day01Data`; mobile only has day 1-3 files while backend has day 1-14
- Files: `mobile/screens/HomeScreen.tsx`, `mobile/assets/curriculum/day-01.json`, `mobile/assets/curriculum/day-02.json`, `mobile/assets/curriculum/day-03.json`, `backend/app/content/curriculum/day-01.json` ... `backend/app/content/curriculum/day-14.json`
- Impact: Users still effectively train on Day 1 from Home flow even though the app advertises a 14-day program
- Fix approach: Implement dynamic day loading in mobile and add missing mobile day 4-14 curriculum files (or fetch curriculum from backend)

## Known Bugs

**Intonation always returns hardcoded 3.5 for paid analyzers:**
- Symptoms: Azure, Google, and OpenAI analyzers always return `3.5` for `intonation_score` regardless of actual speech
- Files: `backend/app/analyzers/azure.py:77-78`, `backend/app/analyzers/google.py:81-82`, `backend/app/analyzers/openai.py:71-72`
- Trigger: Use any paid analyzer — `_calculate_intonation()` returns constant `3.5`
- Workaround: Only the free analyzer (using parselmouth) provides real intonation analysis

**AudioPlayer stress pattern indexing bug for chunks:**
- Symptoms: When displaying chunked text with stress patterns, `renderTextForChunk` uses local word index against the global `stressPattern` array, causing incorrect stress highlighting
- Files: `mobile/components/AudioPlayer.tsx:104-123`
- Trigger: Exercise with both `chunks` and `stressPattern` set
- Workaround: None — stress highlighting in chunked mode is incorrect

**ProgramOverviewScreen disabled+locked conflict:**
- Symptoms: Day cards have `disabled={dayCard.isLocked && !dayCard.isCompleted}` but the `onPress` handler already checks `isLocked` and shows an alert — the `disabled` prop prevents the alert from ever appearing
- Files: `mobile/screens/ProgramOverviewScreen.tsx:155`
- Trigger: Tap on a locked day — nothing happens instead of showing the skip alert
- Workaround: None

**Duplicate Alert import in ProgramOverviewScreen:**
- Symptoms: Imports both `Alert` and `Alert as RNAlert` from react-native — confusing and inconsistent usage
- Files: `mobile/screens/ProgramOverviewScreen.tsx:6-7`
- Trigger: N/A — cosmetic but indicates copy-paste issues
- Workaround: N/A

**Streak counter starts at 5 on HomeScreen:**
- Symptoms: `useState<number>(5)` initializes the streak to 5 instead of 0, showing a false streak before data loads
- Files: `mobile/screens/HomeScreen.tsx:37`
- Trigger: Open HomeScreen before progress data loads
- Workaround: None — user sees "5 day streak" briefly on first load

**`completedExercises` state is never updated:**
- Symptoms: HomeScreen tracks `completedExercises` as a `Set` but the setter (`_setCompletedExercises`) is prefixed with underscore and never called — exercises never show checkmarks
- Files: `mobile/screens/HomeScreen.tsx:27`
- Trigger: Complete any exercise — the completion checkmark never appears
- Workaround: None

## Security Considerations

**CORS allows all origins:**
- Risk: `allow_origins=["*"]` with `allow_credentials=True` permits any website to make authenticated requests to the API
- Files: `backend/app/main.py:13-18`
- Current mitigation: None
- Recommendations: Restrict `allow_origins` to known mobile app origins; do not combine `*` with `allow_credentials=True`

**API keys transmitted as form data over HTTP:**
- Risk: User-provided API keys (Azure, Google, OpenAI) are sent as plain-text form fields in the `/analyze` endpoint, potentially logged in server access logs
- Files: `backend/app/api/analyze.py:40`, `mobile/screens/SettingsScreen.tsx:90-91`
- Current mitigation: Keys are stored in `expo-secure-store` on-device
- Recommendations: Use HTTPS in production; consider storing keys server-side; ensure API keys are not logged

**No authentication or authorization:**
- Risk: All API endpoints are publicly accessible — any client can create users, view progress for any `user_id`, or submit analysis requests
- Files: `backend/app/api/progress.py`, `backend/app/api/analyze.py`
- Current mitigation: None
- Recommendations: Add user authentication (JWT/token-based); validate that users can only access their own data

**No rate limiting on analysis endpoint:**
- Risk: The `/analyze` endpoint processes audio files (CPU/memory intensive with librosa/parselmouth) — can be trivially DoS-ed
- Files: `backend/app/api/analyze.py`
- Current mitigation: None
- Recommendations: Add rate limiting middleware; implement file size limits; consider async task queue

**Error responses leak internal details:**
- Risk: Exception messages (`str(e)`) are returned directly to the client in HTTP 500 responses, potentially exposing stack traces or internal paths
- Files: `backend/app/api/analyze.py:107`
- Current mitigation: None
- Recommendations: Return generic error messages; log full exceptions server-side only

## Performance Bottlenecks

**Synchronous audio analysis blocks the event loop:**
- Problem: `FreeAnalyzer.analyze()` is `async def` but calls synchronous librosa/parselmouth functions that block the event loop
- Files: `backend/app/analyzers/free.py:9-27`
- Cause: `librosa.load()`, `librosa.beat.beat_track()`, `parselmouth.Sound()` are CPU-intensive blocking calls inside an async handler
- Improvement path: Use `asyncio.to_thread()` or `run_in_executor()` to offload to a thread pool

**Azure analyzer uses synchronous SDK:**
- Problem: `recognizer.recognize_once()` is a synchronous blocking call inside an `async def` method
- Files: `backend/app/analyzers/azure.py:24`
- Cause: Azure SDK's synchronous method blocks the entire event loop
- Improvement path: Use Azure SDK's async variant or run in thread pool

**Google analyzer uses synchronous SDK:**
- Problem: `self.client.recognize()` is synchronous and blocks the async event loop
- Files: `backend/app/analyzers/google.py:26`
- Cause: Google Cloud Speech client is synchronous
- Improvement path: Use `google.cloud.speech_v1.SpeechAsyncClient` or run in thread pool

**No file size limit on audio uploads:**
- Problem: Users can upload arbitrarily large audio files; the entire file is read into memory
- Files: `backend/app/api/analyze.py:61`
- Cause: `await audio.read()` loads the full file into memory before processing
- Improvement path: Add `max_size` validation; stream to disk for large files

**SQLite with check_same_thread=False:**
- Problem: SQLite is used with `check_same_thread=False` which allows concurrent access but SQLite itself doesn't handle concurrent writes well
- Files: `backend/app/models.py:11`
- Cause: Single SQLite database file shared across async workers
- Improvement path: Migrate to PostgreSQL for production; keep SQLite only for development

## Fragile Areas

**ExerciseScreen router pattern:**
- Files: `mobile/screens/ExerciseScreen.tsx`
- Why fragile: Acts as a manual switch/router dispatching to 5 different screen components based on `exercise.type`. Adding new exercise types requires modifying both this switch statement and creating a new screen file
- Safe modification: Add new cases to the switch; ensure a sensible default fallback
- Test coverage: None

**Passing callbacks via navigation params:**
- Files: `mobile/screens/HomeScreen.tsx:131-134`, `mobile/screens/ExerciseScreen.tsx:54`
- Why fragile: `onComplete` callback is passed through React Navigation's route params. This is a React Navigation anti-pattern — functions aren't serializable and can cause issues with state persistence and deep linking
- Safe modification: Use a shared state manager (Context/Zustand) or event emitter instead
- Test coverage: None

**Streak calculation logic:**
- Files: `backend/app/api/progress.py:135-143`
- Why fragile: Streak is calculated by iterating sessions in reverse and comparing `day` values. If a user completes the same day twice, or skips days, the streak calculation breaks silently
- Safe modification: Add deduplication by day; consider using completed dates instead of day numbers
- Test coverage: Only tests the happy path (3 consecutive days)

**Audio format conversion:**
- Files: `backend/app/api/analyze.py:65-79`
- Why fragile: Uses `audio.content_type.split("/")[-1]` to determine pydub format — this heuristic breaks for types like `audio/x-m4a` (resolves to `x-m4a`, not a valid pydub format)
- Safe modification: Create an explicit content-type-to-format mapping
- Test coverage: Only tests unsupported format rejection, not the actual conversion path

**Temp file cleanup in analyze endpoint:**
- Files: `backend/app/api/analyze.py:49-84`
- Why fragile: Manual temp file creation and cleanup with multiple cleanup paths. If any unhandled exception occurs between file creation and cleanup, the temp file leaks
- Safe modification: Use a context manager or `try/finally` that always cleans up
- Test coverage: No tests for the cleanup paths

## Scaling Limits

**SQLite database:**
- Current capacity: Single user / development
- Limit: SQLite doesn't support concurrent writes; single file database can't be shared across multiple server instances
- Scaling path: Migrate to PostgreSQL with connection pooling (e.g., asyncpg + SQLAlchemy async)

**In-process audio analysis:**
- Current capacity: One analysis at a time per worker (due to blocking)
- Limit: Long audio files (~10s+) will block the server from handling other requests
- Scaling path: Offload to a task queue (Celery/Redis); run analysis workers separately

**No pagination on progress endpoint:**
- Current capacity: Fine for 14-day program
- Limit: `GET /progress/{user_id}` loads all sessions into memory — will degrade with hundreds of sessions
- Scaling path: Add `limit`/`offset` query parameters

## Dependencies at Risk

**react-native-chart-kit (v6.12.0):**
- Risk: Last npm publish was years ago; has known issues with React Native 0.80+; minimal maintenance
- Impact: Dashboard charts may break on future RN upgrades
- Migration plan: Consider `victory-native` or `react-native-skia` based charts

**pydub:**
- Risk: Requires ffmpeg system dependency not declared in requirements.txt or Dockerfile
- Impact: Audio format conversion will fail silently in environments without ffmpeg
- Migration plan: Add ffmpeg to Dockerfile; document the system dependency

**Azure/Google/OpenAI SDK dependencies not in requirements.txt:**
- Risk: `azure-cognitiveservices-speech`, `google-cloud-speech`, and `openai` are imported but not listed in requirements.txt
- Impact: Paid analyzers will crash with `ImportError` at runtime
- Migration plan: Add all three to requirements.txt as optional dependencies or use lazy imports with proper error messages

**`@react-navigation/native-stack` in devDependencies:**
- Risk: Listed as a devDependency but used at runtime for stack navigation throughout the app
- Impact: May not be included in production builds depending on the bundler
- Migration plan: Move to `dependencies` in package.json

## Missing Critical Features

**No authentication system:**
- Problem: No user login, no session tokens, no identity verification
- Blocks: Multi-device sync, user data privacy, production deployment

**No audio content files:**
- Problem: Exercise `audioUrl` fields exist but no actual audio files are bundled
- Blocks: AudioPlayer and ShadowingMode cannot play model audio — key features are non-functional

**No offline support:**
- Problem: All API calls go to `localhost:8000`; no offline caching, no retry logic
- Blocks: Mobile app is unusable without active backend connection

**No user data export/deletion:**
- Problem: No endpoint to delete user data or export progress
- Blocks: GDPR/privacy compliance

## Test Coverage Gaps

**No app-owned mobile tests:**
- What's not tested: App screens, components, navigation, and API integration in this repository's mobile code
- Files: `mobile/screens/*.tsx`, `mobile/components/*.tsx`
- Risk: Any refactoring or React Native upgrade could silently break the app UI
- Priority: High — at minimum, add tests for AudioRecorder, FeedbackCard, and the ExerciseScreen router

**No integration tests for audio analysis pipeline:**
- What's not tested: The actual audio → temp file → conversion → analysis → cleanup flow
- Files: `backend/app/api/analyze.py`
- Risk: The most critical user-facing feature has only input validation tests; the happy path is untested
- Priority: High

**No tests for paid analyzers (Azure, Google, OpenAI):**
- What's not tested: Azure, Google, and OpenAI analyzer implementations — not even with mocks
- Files: `backend/app/analyzers/azure.py`, `backend/app/analyzers/google.py`, `backend/app/analyzers/openai.py`
- Risk: These analyzers could be completely broken (missing SDK deps, wrong API usage) with no way to detect it
- Priority: Medium — add unit tests with mocked SDK clients

**No tests for FreeAnalyzer scoring accuracy:**
- What's not tested: Whether `_analyze_rhythm`, `_analyze_stress`, `_analyze_pacing`, `_analyze_intonation` produce valid scores for real audio
- Files: `backend/app/analyzers/free.py`
- Risk: Scoring formulas use magic numbers (`ideal_tempo=110`, `ideal_wpm=140`, `ideal_range=150`) with no validation that they produce meaningful results
- Priority: Medium

**Streak and trend calculation edge cases:**
- What's not tested: Duplicate day submissions, gaps in day sequence, single-session trends
- Files: `backend/app/api/progress.py:135-162`
- Risk: Streak could show incorrect values; trend could miscategorize progress
- Priority: Medium

**No tests for the factory pattern error cases:**
- What's not tested: `get_analyzer()` with invalid provider names, missing API keys for paid providers
- Files: `backend/app/analyzers/factory.py`
- Risk: ValueError exceptions may not be properly caught by the API layer
- Priority: Low

---

*Concerns audit: 2026-02-23*
