# Content And Audio Workflow

This guide explains:

1. how to author/generate lessons,
2. how to add model audio,
3. how to explicitly mark audio as missing.

## Lesson Content Sources

Mobile app lesson content is loaded from:

- `mobile/assets/curriculum/day-01.json` ... `day-14.json`
- `mobile/assets/phrases/meetings.json`

Backend keeps a parallel content set plus schema models under:

- `backend/app/content/curriculum/`
- `backend/app/content/phrases/`
- `backend/app/content/schema/`

When changing curriculum structure, keep mobile and backend content aligned.

## Generate/Refresh Schema

Run the schema generator after model/content structure changes:

```bash
just backend-schema
```

This runs:

```bash
cd backend && uv run python ../scripts/generate_schema.py
```

and refreshes JSON schema files under `backend/app/content/schema/`.

## Authoring A New Lesson Day

1. Copy an existing `mobile/assets/curriculum/day-XX.json`.
2. Update:
   - `day`
   - `theme`
   - `exercises[]`
3. For each exercise include:
   - `id`, `type`, `title`, `instruction`, `targetText`, `tips`
   - optional: `stressPattern`, `chunks`, `audioUrl`
4. Export the new file from `mobile/assets/curriculum/index.ts`.

Optional: mirror the same day in `backend/app/content/curriculum/` for backend-side consistency.

## Audio URL Rules

`audioUrl` accepts:

- remote URL (`https://...`) for pre-generated model audio,
- `null` when model audio is intentionally missing.

Use `null` explicitly instead of empty string.

## Create Model Audio Files

Recommended flow:

1. Generate speech from your TTS provider (for example ElevenLabs/OpenAI/Azure TTS).
2. Export to `mp3` or `m4a`.
3. Upload to a stable hosted URL (CDN/object storage/public file host).
4. Put that URL into `audioUrl`.

Example:

```json
{
  "audioUrl": "https://cdn.example.com/erc/day-03/ex-02.mp3"
}
```

## Missing Audio Behavior In App

Current app behavior when `audioUrl` is `null`:

- practice screens still show the play button,
- `AudioPlayer` uses Text-to-Speech fallback for model voice,
- UI label shows `TTS model voice`.

Shadowing mode also falls back to TTS for model playback when `audioUrl` is missing.

## Quick Validation Checklist

After content/audio changes:

1. open the updated lesson in app,
2. verify play button works,
3. verify `audioUrl: null` shows TTS fallback,
4. run checks:

```bash
just mobile-typecheck
just mobile-lint
cd mobile && npx oxfmt --check .
```
