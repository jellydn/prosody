# 🎵 English Rhythm Coach

> _"Fitness app for English speaking rhythm"_

A mobile app that helps non-native English speakers sound more natural and confident through short daily exercises, AI feedback, and real-world speaking scenarios. Starting with Vietnamese professionals.

---

## Why This Exists

Most language apps focus on vocabulary and grammar. But professionals still struggle with:

- Speaking word-by-word instead of in chunks
- Flat intonation and weak sentence stress
- No real feedback on rhythm and flow
- Difficulty building a daily speaking habit

**English Rhythm Coach** fixes this — focusing on **prosody, not grammar**.

---

## How It Works

```
Open app → See daily lesson → Listen to example → Record yourself → Get AI feedback → View score → Done ✅
```

### Core Features

| Feature                      | Description                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------- |
| 🎧 **Daily 10-min Practice** | Guided exercises: stress drills, linking, chunk speaking, shadowing, intonation |
| 🎙️ **AI Speech Feedback**    | Record → analyze rhythm, stress, pacing, intonation → get actionable tips       |
| 📊 **Rhythm Dashboard**      | Track naturalness score, speaking speed, stress accuracy, streak                |
| 🧑‍💼 **Meeting Scenarios**     | Practice real phrases: updates, opinions, clarifications, presenting            |
| 🔁 **Shadowing Mode**        | Speak along with model audio, compare rhythm visually                           |

---

## Tech Stack

| Layer                      | Technology                                                |
| -------------------------- | --------------------------------------------------------- |
| **Mobile App**             | React Native (Expo managed workflow)                      |
| **Backend**                | Python / FastAPI                                          |
| **Speech Analysis (Free)** | Whisper + librosa + parselmouth (on-device)               |
| **Speech Analysis (BYOP)** | Azure Speech / Google Cloud / OpenAI (user's own API key) |
| **Example Audio**          | ElevenLabs TTS (pre-generated, bundled)                   |
| **Database**               | SQLite (MVP) → PostgreSQL (later)                         |
| **Curriculum**             | JSON files in repo                                        |

---

## Project Structure

```
english-rhythm-coach/
├── mobile/                  # React Native (Expo) app
│   ├── app/                 # Screens & navigation
│   ├── components/          # Reusable UI components
│   │   ├── AudioPlayer.tsx
│   │   ├── AudioRecorder.tsx
│   │   └── FeedbackCard.tsx
│   └── assets/              # Bundled audio files
├── backend/                 # Python FastAPI server
│   ├── app/
│   │   ├── main.py          # FastAPI app entry
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── routes/          # API endpoints
│   │   └── analyzers/       # Speech analysis providers
│   │       ├── base.py      # Abstract SpeechAnalyzer
│   │       ├── free.py      # Whisper + librosa
│   │       ├── azure.py     # Azure Speech Services
│   │       ├── google.py    # Google Cloud Speech
│   │       └── openai.py    # OpenAI Whisper API
│   └── data/                # SQLite database
├── content/                 # Curriculum content
│   ├── schema/              # JSON schema + Pydantic models
│   ├── curriculum/          # 14-day program (day-01.json → day-14.json)
│   └── phrases/             # Meeting phrase library (meetings.json)
├── scripts/ralph/           # Ralph autonomous agent config
│   └── prd.json             # Implementation stories
└── tasks/
    └── prd-english-rhythm-coach.md  # Full PRD
```

---

## MVP Scope (14-Day Program)

### Included

- ✅ Guided 14-day program with 5 exercise types
- ✅ Audio recording + playback
- ✅ AI feedback (free on-device + BYOP)
- ✅ Progress tracking & dashboard
- ✅ Meeting phrase library

### Excluded (Future)

- ❌ Social features / leaderboards
- ❌ Live coaching
- ❌ Multiple source languages
- ❌ Advanced phoneme correction
- ❌ Zoom/Teams integration

---

## API Endpoints

| Method | Endpoint                        | Description                      |
| ------ | ------------------------------- | -------------------------------- |
| `GET`  | `/health`                       | Health check                     |
| `POST` | `/api/v1/users`                 | Create user profile              |
| `POST` | `/api/v1/analyze`               | Submit audio for speech analysis |
| `POST` | `/api/v1/progress`              | Save session result              |
| `GET`  | `/api/v1/progress/{id}`         | Get user progress history        |
| `GET`  | `/api/v1/progress/{id}/summary` | Get aggregated stats             |

---

## Exercise Types

| Type           | Focus                     | Example                                             |
| -------------- | ------------------------- | --------------------------------------------------- |
| **Stress**     | Word & sentence stress    | **PRE**sent vs pre**SENT**                          |
| **Linking**    | Connecting words          | "pick‿it‿up"                                        |
| **Chunk**      | Thought groups            | "I was thinking / about the project / we discussed" |
| **Shadow**     | Real-time rhythm matching | Speak along with model audio                        |
| **Intonation** | Rising/falling patterns   | "You're coming?" ↗ vs "You're coming." ↘            |

---

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Mobile App

```bash
cd mobile
npx expo install
npx expo start
```

---

## Design Principles

- 🎯 **Simple feedback** — emoji indicators, not complex spectrograms
- 📱 **10 minutes/day** — short sessions that build habit
- 💪 **Confidence over perfection** — encourage, don't grade
- 🔓 **BYOP** — free by default, bring your own API key for premium
- 📦 **KISS** — no baseline tests, streak-reset only, simplified visuals

---

## Target Users

Vietnamese professionals working in English environments — engineers, knowledge workers, people preparing for meetings and presentations. Intermediate English speakers who are understood but want to sound more natural.

---

## Success Metrics

- Daily practice completion rate ≥ 60%
- Rhythm score improvement after 14 days
- ≥ 40% users record 5+ sessions/week
- Audio analysis response < 5 seconds (p95)
