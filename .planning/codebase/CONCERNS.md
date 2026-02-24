# Codebase Concerns

**Analysis Date:** 2026-02-24

## Tech Debt

**Database schema & migration path:**
- Issue: The FastAPI app defaults to `sqlite:///./data/app.db` and the startup hook just runs `Base.metadata.create_all`, so schema changes require manual resets and there is no migration history.
- Files: `backend/app/models.py:19-58`
- Impact: Changing or extending `users`/`session_results` risks destructive rebuilds and makes it hard to adopt a production-ready engine.
- Fix approach: Introduce a migration tool (Alembic/SQLModel migrations) and drawer a Postgres connection string for staging/production instead of relying on `create_all`.

## Known Bugs

**Previous average never populates:**
- Symptoms: The home screen never shows improvement stats because `previousAverage` stays `undefined`.
- Files: `mobile/screens/HomeScreen.tsx:67-132`, `backend/app/api/progress.py:44-153`
- Trigger: The client reads `data.average_score`, but `ProgressSummary` only returns the `averages` map and no `average_score` field.
- Workaround: None (the UI path never receives the value).

## Security Considerations

**Unauthenticated write surface:**
- Risk: `POST /api/v1/users`, `/progress`, and `/analyze` accept any caller, coupled with permissive CORS in `backend/app/main.py`, so a malicious actor can spam analysis jobs or inject fake sessions and drain BYOP provider keys.
- Files: `backend/app/api/progress.py:51-170`, `backend/app/api/analyze.py:38-205`, `backend/app/main.py:1-38`
- Current mitigation: None (no auth, no rate limiting, no quota enforcement).
- Recommendations: Add authenticated tokens/API keys for write operations, throttle `/analyze`, and validate/rotate BYOP provider secrets on the server.

## Performance Bottlenecks

**Synchronous audio analysis per request:**
- Problem: Each `/analyze` call streams the full upload to disk, converts non-WAV formats via `pydub`, and then runs CPU-heavy `librosa/parselmouth` scoring inside the request thread.
- Files: `backend/app/api/analyze.py:84-205`, `backend/app/analyzers/free.py:1-126`
- Cause: Blocking I/O + compute work happens inline instead of being offloaded, so concurrency is limited to the UVicorn worker count and large uploads tie up memory.
- Improvement path: Move conversion and scoring to a background worker or async task queue, reuse cached temp files, and cap concurrency/queued analysis jobs.

## Fragile Areas

**Curriculum import assumptions:**
- Files: `mobile/assets/curriculum/index.ts:1-31`, `mobile/screens/HomeScreen.tsx:76-95`
- Why fragile: `HomeScreen` dereferences `CURRICULUM_BY_DAY[dayToLoad]` without checking for missing days. Removing or renaming a JSON entry or navigating to `selectedDay` outside 1–14 immediately crashes with `undefined`.
- Safe modification: Validate `dayToLoad` before calling `setCurrentDay`, provide a fallback day, and guard against missing keys when updating the curriculum JSON set.
- Test coverage: None—there are no unit tests asserting safe resolution of `CURRICULUM_BY_DAY`.

## Scaling Limits

**SQLite-backed primary database:**
- Current capacity: Single-process writes; `SessionLocal` uses `check_same_thread=False` but still serializes writes against the `data/app.db` file.
- Limit: Concurrent users or multiple backend instances will hit SQLite locking and there is no replication/path to horizontal scaling.
- Scaling path: Switch `DATABASE_URL` to PostgreSQL/managed SQL, add connection pooling, and migrate via Alembic instead of always running `create_all`.
- Files: `backend/app/models.py:19-65`

## Dependencies at Risk

**Deprecated `expo-av`:**
- Risk: `App.tsx` explicitly silences the warning that `expo-av` is removed in SDK 54 and the dependency is still listed in `mobile/package.json`.
- Files: `mobile/App.tsx:46-49`, `mobile/package.json:6-35`
- Impact: Upgrading Expo beyond SDK 54 (required for newer React Native/TS tooling) will break the app because the removed `expo-av` APIs are expected but no longer bundled.
- Migration plan: Replace `expo-av` usage with a supported media playback library (or the new Expo AV shim) and remove the dependency before bumping the SDK.

## Missing Critical Features

**Offline/resilient progress persistence:**
- Problem: `SessionCompletionScreen.handleDone` immediately POSTs to `/api/v1/progress` and only shows an alert on failure; no retry, caching, or local queue exists.
- Blocks: Users with spotty connectivity lose streak data and scores, preventing reliable habit tracking.
- Files: `mobile/screens/SessionCompletionScreen.tsx:56-88`

## Test Coverage Gaps

**Untested mobile UI and analyzer path:**
- What's not tested: The entire `mobile/` workspace has no jest/tsx tests or scripts, and the analyzer tests are gated behind the presence of heavy libs.
- Files: `mobile/package.json:6-15`, `backend/tests/test_analyze_api.py:10-31`
- Risk: Front-end regressions slip through (no automated smoke tests), and critical `/analyze` flows rarely run in CI unless `librosa`/`parselmouth` happen to be installed.
- Priority: High (UI is the user-facing product and the analyze API is CPU-intensive), so add jest/unit tests and mock the analyzer dependencies.

---

*Concerns audit: 2026-02-24*
