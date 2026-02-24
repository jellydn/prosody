# External Integrations

**Analysis Date:** 2026-02-24

## APIs & External Services

**Speech analysis (BYOP providers):**
- Azure Speech Services – optional provider when users save an Azure key via `mobile/screens/SettingsScreen.tsx`; `backend/app/analyzers/azure.py` instantiates `SpeechRecognizer` from the `azure-cognitiveservices-speech` SDK to transcribe user audio, responding to the `provider` form field and header. SDK/Client: `azure-cognitiveservices-speech` (`backend/pyproject.toml`). Auth: API key supplied in the `X-Provider-Api-Key` header created by `mobile/config/byop.ts`.
- Google Cloud Speech-to-Text – `backend/app/analyzers/google.py` uses `google.cloud.speech_v1` (client configured via service-account JSON or plain API key) whenever BYOP provider is `google`. SDK/Client: `google-cloud-speech`. Auth: same `X-Provider-Api-Key` header.
- OpenAI Whisper – `backend/app/analyzers/openai.py` calls `AsyncOpenAI.audio.transcriptions.create` with `model="whisper-1"` for OpenAI-based analysis. SDK/Client: `openai`. Auth: `X-Provider-Api-Key` header.

**Speech analysis (local/free):**
- Free analyzer – `backend/app/analyzers/free.py` loads uploads with `librosa`, calculates rhythm/stress/pacing/intonation with `numpy` and `praat-parselmouth`, and generates feedback without calling upstream services. SDK/Client: `librosa`, `numpy`, `praat-parselmouth`. Auth: n/a.

**Mobile ↔ Backend REST surface:**
- FastAPI endpoints (`backend/app/api/analyze.py`, `backend/app/api/progress.py`, `backend/app/main.py`) exposed under `/api/v1/*` handle audio uploads, user creation, progress submission, and summaries. The Expo app hits these routes via `fetch` in screens such as `mobile/screens/ChunkSpeakingScreen.tsx`, `StressDrillScreen.tsx`, `LinkingPracticeScreen.tsx`, `SessionCompletionScreen.tsx`, `HomeScreen.tsx`, and `DashboardScreen.tsx`, all of which resolve `API_BASE_URL` through `mobile/config/api.ts`. SDK/Client: native `fetch`. Auth: no bearer tokens—backend trusts user IDs, while premium providers rely on `X-Provider-Api-Key` headers.

## Data Storage

**Databases:**
- SQLite by default (`DATABASE_URL` fallback handled in `backend/app/models.py` with `sqlite:///./data/app.db`), accessible via SQLAlchemy `SessionLocal` and the ORM models `User`/`SessionResult`. Alternate databases are supported when `DATABASE_URL` points elsewhere.

**File Storage:**
- Uploaded audio is streamed to a temporary WAV file via `tempfile.NamedTemporaryFile` in `backend/app/api/analyze.py`, optionally converted with `pydub` before being analyzed and deleted after processing.

**Caching:**
- None (no caching layer is configured; each analysis request and progress query hits the API/database directly).

## Authentication & Identity

**Auth Provider:**
- Custom BYOP headers/profiles stored per device – `mobile/config/byop.ts` tracks the chosen provider and API key in `expo-secure-store`, and `mobile/screens/SettingsScreen.tsx` persists the values. When the analyzer is invoked, the header `X-Provider-Api-Key` is appended along with the `provider` form field so `backend/app/analyzers/factory.py` can instantiate the correct class.
- Implementation: the backend treats these headers as credentials for Azure/Google/OpenAI; there is no OAuth or JWT-based user auth beyond the `user_id` created in `/api/v1/users` (per `mobile/screens/OnboardingScreen.tsx`).

## Monitoring & Observability

**Error Tracking:**
- None; the backend relies on standard Python logging (configured in `backend/app/main.py` via `LOG_LEVEL`).

**Logs:**
- `logging.basicConfig` in `backend/app/main.py` captures structured logs, and numerous `logger.info`/`logger.warning`/`logger.exception` calls in `backend/app/api/analyze.py` surface request details and failures.

## CI/CD & Deployment

**Hosting:**
- Backend containers are defined by `backend/Dockerfile` (Python 3.11 `uv` base) and can run anywhere Docker is supported.
- Mobile builds are Expo-managed (plugins, permissions, and EAS project ID defined in `mobile/app.json`), ready for Expo Go or EAS submissions.

**CI Pipeline:**
- Not present; README instead documents local commands (`uv run uvicorn`, `npx expo start`, lint/format scripts) rather than an automated pipeline.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL`, `LOG_LEVEL`, `CORS_ORIGINS` drive backend database/credentials/origins (`backend/app/models.py`, `backend/app/main.py`).
- `EXPO_PUBLIC_API_BASE_URL` allows overriding the mobile app’s API target; default resolution logic lives in `mobile/config/api.ts` alongside emulator fallbacks.

**Secrets location:**
- BYOP API keys are kept client-side inside `expo-secure-store` as seen in `mobile/config/byop.ts` and saved/retrieved in `mobile/screens/SettingsScreen.tsx`; backend secrets (Azure/Google/OpenAI creds) are passed per-request via headers.

## Webhooks & Callbacks

**Incoming:**
- None beyond the REST endpoints defined in `backend/app/api/analyze.py` and `progress.py`.

**Outgoing:**
- None (speech analysis integrates synchronously via SDK clients rather than triggering outbound webhooks, and no async callback services are configured).

---

*Integration audit: 2026-02-24*
