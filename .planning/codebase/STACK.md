# Technology Stack

**Analysis Date:** 2026-02-24

## Languages

**Primary:**
- TypeScript 5.9 (Expo-managed React Native app) described in `mobile/package.json` and governed by the strict `expo/tsconfig.base` extension in `mobile/tsconfig.json`.

**Secondary:**
- Python 3.10+ for FastAPI + SQLAlchemy backend (stated via `requires-python` in `backend/pyproject.toml` and the `ghcr.io/astral-sh/uv:python3.11-bookworm-slim` base used in `backend/Dockerfile`).

## Runtime

**Environment:**
- Expo SDK 54 (React Native 0.81.5) running on Node through `npx expo start` with platform-specific audio permissions and plugin configuration defined in `mobile/app.json`.
- FastAPI 0.131.0 served by `uvicorn` (`uv run uvicorn app.main:app`) in both local (`README.md`) and containerized (`backend/Dockerfile`) contexts.

**Package Manager:**
- `npm` for the mobile app, locked by `mobile/package-lock.json` and invoked via `mobile/package.json` scripts (`start`, `lint`, `fmt`).
- `uv` as the Python dependency manager (see the `tool.uv` section of `backend/pyproject.toml`, the `backend/uv.lock`, and `backend/Dockerfile` that runs `uv sync --frozen`).

## Frameworks

**Core:**
- React Navigation stacks/tabs in `mobile/navigation/TabNavigator.tsx` and root `mobile/App.tsx`, combining `@react-navigation/*`, `@expo/vector-icons`, and Expo-managed audio/secure-store/async-storage helpers for the UI and onboarding flows.
- FastAPI routers (`backend/app/api/analyze.py`, `backend/app/api/progress.py`) plus SQLAlchemy models in `backend/app/models.py` for HTTP surface and persistence.
- Audio analysis logic spanning `backend/app/analyzers/free.py` (librosa/parselmouth), `azure.py`, `google.py`, and `openai.py` for on-device and BYOP scoring options.

**Testing:**
- `pytest` and `pytest-asyncio` listed under `dev` dependencies in `backend/pyproject.toml` drive backend test tooling; the mobile app currently relies on manual QA (no JS test deps).

**Build/Dev:**
- Mobile development uses Expo CLI (`npx expo start`/`expo publish`) plus `oxlint` and `oxfmt` for linting/formatting defined in `mobile/package.json` scripts.
- Backend development runs `uv run uvicorn app.main:app` and dependency/lockfile commands (`uv sync`, `uv lock`) documented in `README.md` and encapsulated in `backend/Dockerfile` for production deployments.

## Key Dependencies

**Critical:**
- `expo`, `react`, `react-native`, `@expo/vector-icons`, `react-native-chart-kit`, `@react-navigation/native`, `expo-av`, `expo-secure-store`, `@react-native-async-storage/async-storage` from `mobile/package.json` powering UI, audio recording/playback (`mobile/components/*`), navigation, and persistent storage.
- `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pydantic`, `python-multipart`, `librosa`, `praat-parselmouth`, `numpy`, `pydub`, `PyJWT` from `backend/pyproject.toml` covering API layer, multipart uploads, SQLite/Postgres ORM, and the rhythm/stress/pacing analysis math in `backend/app/analyzers/free.py`.

**Infrastructure:**
- Optional BYOP clients `azure-cognitiveservices-speech`, `google-cloud-speech`, `openai` declared in `backend/pyproject.toml` and wired via `backend/app/analyzers/azure.py`, `google.py`, and `openai.py`.
- `uv` CLI from `backend/pyproject.toml`/`backend/Dockerfile` for reproducible Python installs; `expo` CLI in `mobile/package.json` for mobile bundling.

## Configuration

**Environment:**
- Backend honors `DATABASE_URL`, `LOG_LEVEL`, and `CORS_ORIGINS` in `backend/app/models.py` and `backend/app/main.py` (SQLite default in `./data/app.db`, log level override, and CORS allow-list). Reading `EXPO_PUBLIC_API_BASE_URL` and runtime host detection inside `mobile/config/api.ts` determine where the mobile app points; BYOP provider/API-key persistence lives in `mobile/config/byop.ts` and the Settings/recording screens that call `appendByopToFormData`.

**Build:**
- Expo config (`mobile/app.json`) declares orientation, plugin list (`expo-audio`, `expo-font`, `expo-asset`, `expo-secure-store`), permissions (record audio), and the EAS project ID used during builds.
- Backend container build uses `backend/Dockerfile` to install dependencies via `uv sync --frozen` and run `uvicorn` for production.

## Platform Requirements

**Development:**
- Backend: `uv sync --dev --frozen` and `uv run uvicorn app.main:app` per `README.md`, ensuring Python 3.11 in the `uv` container image.
- Mobile: `npx expo start`, `oxlint`, `oxfmt`, and the strict TypeScript compiler settings from `mobile/tsconfig.json` under Expo SDK 54 as documented in `README.md`.

**Production:**
- Backend deploys as a Docker container built from `backend/Dockerfile` (python3.11 base) and connects to SQLite or a database referenced by `DATABASE_URL`.
- Mobile ships as an Expo-managed React Native app configured in `mobile/app.json` (audio permissions, assets, EAS project) and runs on iOS/Android via Expo Go or custom builds.

---

*Stack analysis: 2026-02-24*
