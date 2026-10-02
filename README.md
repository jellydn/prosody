# 🎵 English Rhythm Coach

<div align="center">
  <img src="logo.svg" width="200" alt="English Rhythm Coach Logo" />
</div>

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

| Layer                      | Technology                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| **Mobile App**             | React Native (Expo managed workflow)                             |
| **Backend**                | Python / FastAPI                                                 |
| **Speech Analysis (Free)** | Whisper + librosa + parselmouth (on-device)                      |
| **Speech Analysis (BYOP)** | Azure Speech / Google Cloud / OpenAI (user's own API key)        |
| **Example Audio**          | Hosted model audio URL or in-app TTS fallback (`audioUrl: null`) |
| **Database**               | SQLite (MVP) → PostgreSQL (later)                                |
| **Curriculum**             | JSON files in repo                                               |

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
│   └── assets/              # Curriculum + phrase JSON content
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
uv sync --dev --frozen
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Deploy API To Fly.io

Fly config is at `backend/fly.toml`.

1. Install/auth Fly CLI:

```bash
brew install flyctl
fly auth login
```

2. Create app and volume (one-time):

```bash
cd backend
fly apps create english-rhythm-coach-api
fly volumes create api_data --region sin --size 1
```

3. Set runtime env/secrets:

```bash
fly secrets set CORS_ORIGINS="https://your-mobile-web-origin.example"
```

4. Deploy:

```bash
cd backend
fly deploy
```

5. Verify:

```bash
fly status
fly logs
curl https://english-rhythm-coach-api.fly.dev/health
```

When you change dependencies:

```bash
cd backend
uv add <package>              # or: uv remove <package>
uv lock
uv sync --dev --frozen
```

### Mobile App

```bash
cd mobile
npx expo install
npx expo start
```

For local development, mobile defaults to `http://localhost:8000` (or `http://10.0.2.2:8000` on Android emulator). You can override explicitly:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000 npx expo start
```

### Test on Your iPhone with a Personal Team (like Oak)

Use a local Xcode build, not an EAS IPA, for free Apple Account testing. You need
a Mac with current Xcode and its iOS platform installed, Node.js 20.19.4 or newer,
CocoaPods, and an iPhone connected by USB for the first install.

1. Add your Apple Account in **Xcode → Settings → Accounts** and accept any Apple
   developer agreements. A free **Personal Team** is enough for direct testing.
2. Connect and trust the iPhone. Enable **Settings → Privacy & Security → Developer
   Mode**, restart the phone, and confirm the prompt.
3. From this repository on your Mac, install dependencies and generate the native
   project:

   ```bash
   git switch main
   git pull --ff-only
   npm ci --prefix mobile
   just mobile-prebuild
   just mobile-ios-open
   ```

   Open the generated `.xcworkspace`, not `.xcodeproj`, because React Native uses
   CocoaPods. The generated `mobile/ios/` directory is intentionally not committed.
4. In Xcode, select the application target under **Signing & Capabilities**, enable
   **Automatically manage signing**, and select your Personal Team. If the bundle
   ID is unavailable, use a unique local value such as `com.yourname.prosody.dev`.
   Do not commit a personal team ID or signing credentials. A later Expo prebuild
   can reset edits made only in the generated project.
5. Start a test backend on your Mac in a separate terminal:

   ```bash
   just backend-install
   just backend-dev
   ```

   Use disposable development data. Startup applies the committed migrations.
   Connect the phone and Mac to the same trusted Wi-Fi network, permit local
   network access, and allow port 8000 through the Mac firewall if prompted.
6. Build and install the development app with your Mac's LAN address:

   ```bash
   cd mobile
   EXPO_PUBLIC_API_BASE_URL="http://<MAC_LAN_IP>:8000" npx expo run:ios --device
   ```

   Replace `<MAC_LAN_IP>` with your Mac's Wi-Fi address and select the connected
   iPhone. Keep Metro running for the development build.
   `localhost` on the phone is the phone itself, not your Mac.

For a standalone Release build, first use a reachable HTTPS test API with a valid
certificate and the current backend migrations. Replace `<YOUR_TEST_API>` with
that API's hostname, then run:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL="https://<YOUR_TEST_API>" \
  npx expo run:ios --device --configuration Release
```

This embeds the JavaScript bundle, so Metro is not needed after installation.
The API URL is embedded at build time; rebuild to change it. The existing
`just mobile-ios-prod` command uses `https://prosody.itman.fyi`; check that service
and its certificate before using it. Do not disable TLS verification to work
around an expired certificate.

Test microphone permission, recording/playback, and a full practice session.
For offline progress, finish a session offline, tap Done twice, then reconnect:
one saved session should sync once. Repeat after restarting the app. Deploy the
idempotent progress backend before using retry-enabled clients against a shared
API. Native dependency changes such as NetInfo or Expo Crypto require a rebuild.

Free Personal Team profiles normally expire after seven days; reconnect and
rebuild to renew the app. This is not TestFlight, App Store, or general IPA
distribution. EAS internal iOS distribution is a separate signed-device workflow
and generally requires a paid Apple Developer team and registered devices.

### Build APK/IPA Artifacts (Sideload)

This repo now includes a GitHub Actions CD workflow at `.github/workflows/mobile-artifacts.yml` that builds downloadable mobile artifacts without App Store / Play Store submission.

1. Add repository secret `EXPO_TOKEN`:
   - Create token: https://expo.dev/accounts/[account]/settings/access-tokens
   - GitHub: `Settings -> Secrets and variables -> Actions -> New repository secret`
2. In GitHub Actions, run **Mobile Build Artifacts** with:
   - `platform=android` for `.apk`
   - `platform=ios` for `.ipa`
   - `platform=ios-simulator` for iOS simulator app artifact (`.app` packaged as `.tar.gz`)
   - `platform=both` for both artifacts
3. Download build files from workflow run artifacts:
   - `english-rhythm-coach-android-apk`
   - `english-rhythm-coach-ios-ipa`
   - `english-rhythm-coach-ios-simulator-app`

Notes:

- Android artifact is generated with EAS profile `android-apk`.
- iOS artifact is generated with EAS profile `ios-ipa` (`distribution: internal`), which still requires valid Apple signing credentials in Expo/EAS for device sideloading.
- iOS simulator artifact is generated with EAS profile `ios-simulator` and does not require Apple signing for simulator usage.
- Production artifact profiles (`production`, `android-apk`, `ios-ipa`) are configured to use `https://english-rhythm-coach-api.fly.dev` via `EXPO_PUBLIC_API_BASE_URL`.
- Bundle/package IDs are profile-based via `mobile/app.config.ts`:
  - `development`, `ios-simulator`: `com.englishrhythmcoach.app`
  - `production`, `android-apk`, `ios-ipa`: `com.dunghd.englishrhythmcoach`
- No store submission is performed by this workflow.

Local EAS build commands:

```bash
cd mobile
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
```

### Content And Audio

See content/audio authoring guide:

- `docs/content-and-audio-workflow.md`

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

---

## Connect

<div id="badges">
  <a href="https://www.linkedin.com/in/dunghd">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
  <a href="https://www.youtube.com/c/ITManVietnam">
    <img src="https://img.shields.io/badge/YouTube-red?style=for-the-badge&logo=youtube&logoColor=white" alt="Youtube Badge"/>
  </a>
  <a href="https://www.twitter.com/jellydn">
    <img src="https://img.shields.io/badge/Twitter-blue?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter Badge"/>
  </a>
  <a href="https://blog.productsway.com">
    <img src="https://img.shields.io/badge/Blog-FF5722?style=for-the-badge&logo=blogger&logoColor=white" alt="Blog Badge"/>
  </a>
</div>

---

## Show Your Support

If you find this project helpful, consider supporting the development:

[![kofi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/dunghd)
[![paypal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/dunghd)
[![buymeacoffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/dunghd)
