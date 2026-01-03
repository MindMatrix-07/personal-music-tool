Personal Music Tool - Musixmatch Helpers

This repo adds lightweight tools in the web UI to help create and sync lyrics for Musixmatch.

Features added:
- Inline lyrics editor with toolbar
- One-click timestamp insertion and capture from audio previews (Spotify/iTunes previews) and YouTube (via IFrame API)
- Line-length and readability checks
- Repetition/structure detection
- Punctuation and question-mark checks
- Capitalization and proper-noun checks (small list)
- Language/script mixing detection for common scripts
- Simple syllable estimator per line
- Per-line inline notes saved in browser localStorage
- Reviewer-simulation report (Run Checks)

Usage
1. Open `index.html` in a browser (serve via a simple HTTP server for API routes).
2. Search for a song (Spotify/Apple/YouTube) and select a result.
3. If a preview is available, use the audio player controls and click "Capture Time" to insert `[mm:ss.xx]` timestamps.
4. Edit lyrics in the editor, use `Run Checks` to get a reviewer-like report, and `Save Notes` to persist per-line notes locally.

Limitations
- Cross-origin embed restrictions prevent capturing timestamps from all embed types. The app uses preview URLs for reliable audio capture and the YouTube IFrame API where available.
- Proper-noun checking uses a small built-in list; expand as needed.

Development
- This is a static HTML/JS app. To run APIs (lyrics, tunebat, statsfm, youtube-search) use the existing `api/` endpoints included in the repo.

Files changed
- `index.html` — added lyrics editor, controls, timestamp capture and checks.

If you want, I can:
- Expand the proper-noun dictionary and add fuzzy name matching
- Add unit tests for the checkers and a demo HTML with sample lyrics
- Integrate a persistent notes file export/import

