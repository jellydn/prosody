# Technology Stack

**Analysis Date:** 2026-02-24

## Languages

**Primary:**
- TypeScript ~5.9.2 - Mobile app (React Native/Expo)
- Python 3.12 (CI) / 3.11 (Docker) - Backend API

**Secondary:**
- JSON - Curriculum content, schemas, app config

## Runtime

**Environment:**
- Node.js 20 (CI target)
- Python 3.12 (CI) / 3.11 (Dockerfile)
- Expo SDK 54 (managed workflow)

**Package Manager:**
- npm (mobile)
- Lockfile: present (`package-lock.json`)
- pip (backend)
- Lockfile: missing (uses `requirements.txt` without pinned versions)

## Frameworks

**Core:**
- FastAPI 0.x - Backend REST API
- React Native 0.81.5 - Mobile UI framework
- Expo ~54.0.33 - React Native managed workflow (build, dev, plugins)
- React 19.1.0 - UI component library
- React Navigation 7.x - Mobile navigation (native stack + bottom tabs)
- SQLAlchemy - Python ORM for database access
- Pydantic - Request/response validation (FastAPI models)

**Testing:**
- pytest + pytest-asyncio - Backend tests
- Jest - Mobile tests (referenced in justfile, no config file present)

**Build/Dev:**
- uvicorn[standard] - ASGI server for FastAPI
- Expo CLI - Mobile dev server, build tooling
- just - Task runner (justfile with all dev/test/lint commands)
- ruff - Python linting + formatting
- oxlint - TypeScript/React linting
- oxfmt - TypeScript/React formatting
- Docker - Backend containerization

## Key Dependencies

**Critical:**
- librosa - Audio signal processing (rhythm, stress, pacing analysis)
- parselmouth (Praat) - Pitch/intonation analysis from audio
- numpy - Numerical computation for audio analysis
- pydub - Audio format conversion (M4A/MP4 → WAV)
- expo-audio ~1.1.1 - Audio recording and playback on mobile
- openai (AsyncOpenAI) - OpenAI Whisper API client for speech recognition
- azure-cognitiveservices-speech - Azure Speech SDK for recognition
- google-cloud-speech v1 - Google Cloud Speech-to-Text SDK

**Infrastructure:**
- @react-native-async-storage/async-storage 2.2.0 - Local data persistence (onboarding state, user profile)
- expo-secure-store ~15.0.8 - Secure storage for API keys
- react-native-chart-kit ^6.12.0 - Dashboard charts/visualizations
- react-native-svg 15.12.1 - SVG rendering (logo, icons)
- @expo/vector-icons ^15.0.3 - Icon library
- python-multipart - Multipart form data for file uploads

## Configuration

**Environment:**
- `DATABASE_URL` env var (defaults to `sqlite:///./data/app.db`)
- No `.env` files in repo (env vars set externally)
- API keys passed per-request from mobile client (BYOP model)

**Build:**
- `app.json` - Expo app config (name, plugins, EAS project ID, permissions)
- `tsconfig.json` - TypeScript config (extends `expo/tsconfig.base`, strict mode)
- `Dockerfile` - Backend container build (python:3.11-slim base)
- `justfile` - Task runner recipes for all dev/test/lint/CI commands

## Platform Requirements

**Development:**
- Python 3.11+ with pip
- Node.js 20+ with npm
- Expo CLI (`npx expo`)
- just (task runner)
- Android: RECORD_AUDIO + MODIFY_AUDIO_SETTINGS permissions
- iOS: supportsTablet enabled

**Production:**
- Docker (backend deployment)
- EAS Build (mobile, project ID configured)
- SQLite file storage (MVP) → PostgreSQL (planned)

---

*Stack analysis: 2026-02-24*
