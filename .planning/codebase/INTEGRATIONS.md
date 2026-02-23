# External Integrations

**Analysis Date:** 2026-02-24

## APIs & External Services

**Speech Recognition (BYOP - Bring Your Own Provider):**
- Azure Speech Services - Speech-to-text recognition for pronunciation analysis
  - SDK/Client: `azure-cognitiveservices-speech` (SpeechRecognizer)
  - Auth: User-provided API key (passed per-request via `api_key` form field)
  - Config: `region` parameter (defaults to `eastus`)

- Google Cloud Speech-to-Text - Speech recognition alternative
  - SDK/Client: `google-cloud-speech` v1 (SpeechClient)
  - Auth: User-provided API key (passed per-request)
  - Config: LINEAR16 encoding, 16kHz sample rate, en-US

- OpenAI Whisper API - Speech transcription
  - SDK/Client: `openai` (AsyncOpenAI)
  - Auth: User-provided API key (passed per-request)
  - Model: `whisper-1`

**Speech Analysis (Free/Local):**
- librosa - Local audio signal processing (no external API)
- parselmouth (Praat) - Local pitch/intonation analysis (no external API)

**Audio Content (Pre-generated):**
- ElevenLabs TTS - Example audio files bundled in app (not a runtime integration)

## Data Storage

**Databases:**
- SQLite (MVP) - Local file-based database
  - Connection: `DATABASE_URL` env var (default: `sqlite:///./data/app.db`)
  - Client: SQLAlchemy ORM
  - Tables: `users`, `session_results`
  - Planned upgrade: PostgreSQL

**File Storage:**
- Local filesystem only
  - Temp files for audio processing (`tempfile.NamedTemporaryFile`)
  - Bundled JSON curriculum in `backend/app/content/` and `mobile/assets/`

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None (no authentication)
- User creation via simple POST `/api/v1/users` (no auth required)
- User ID stored in AsyncStorage on mobile
- API keys for speech providers stored in `expo-secure-store` on mobile

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- Console logging only (`console.error` on mobile)
- No structured logging on backend

## CI/CD & Deployment

**Hosting:**
- Docker container (backend) - `python:3.11-slim` base image
- EAS Build (mobile) - Expo Application Services (project ID: `3b25ceb8-1c89-4b6e-a10b-a0750be1e6d7`)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
  - Triggers: push/PR to `main`
  - Backend job: Python 3.12, pip install, ruff lint+format check, pytest
  - Mobile job: Node.js 20, npm install, tsc typecheck, oxlint, oxfmt check

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Database connection string (optional, has SQLite default)

**Optional env vars (runtime, per-request):**
- Azure API key + region - Passed by user from mobile app
- Google Cloud API key - Passed by user from mobile app
- OpenAI API key - Passed by user from mobile app

**Secrets location:**
- Mobile: `expo-secure-store` for user-provided API keys
- Backend: No server-side secrets required (BYOP model)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-02-24*
