<div align="center">
  <img src="ZenTiles.png" width="88" height="88" alt="ZenTiles" />

  <h1>ZenTiles</h1>

  <p>A mindful memory tile-matching game. Find stillness in the match.</p>

  [![Live Demo](https://img.shields.io/badge/Play-Live%20Demo-22d3ee?style=flat-square)](https://mananmadani.github.io/ZenTiles)
  [![License: MIT](https://img.shields.io/badge/License-MIT-a78bfa?style=flat-square)](LICENSE)
  [![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-818cf8?style=flat-square)](https://mananmadani.github.io/ZenTiles)
  [![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-4ade80?style=flat-square)](#)

</div>

---

## About

ZenTiles is a mobile-first memory game built with zero dependencies — pure HTML, CSS, and JavaScript. Flip tiles, match Zen symbol pairs, and beat your personal best across two difficulty modes.

The UI uses a Gemini-inspired dark aesthetic with glassmorphism surfaces, 3D tile flip animations, and haptic feedback for a native app feel.

---

## Features

- **Two difficulties** — Beginner (4×4) and Expert (6×6)
- **18 Zen symbols** — shuffled into unique pairs each game
- **Live stats** — move counter and timer with per-difficulty best score
- **Haptic feedback** — distinct vibration patterns for flip, match, mismatch, and win
- **Installable PWA** — add to home screen on iOS & Android
- **Fully offline** — service worker caches all assets on first load

---

## Getting Started

```bash
git clone https://github.com/mananmadani/ZenTiles.git
cd ZenTiles

# Serve locally (a server is required for PWA features)
npx http-server -p 8080
```

Open `http://localhost:8080`. That's it — no installs, no build step.

---

## Project Structure

```
ZenTiles/
├── index.html          # App shell — home & game screens
├── style.css           # Layout, animations, glassmorphism
├── app.js              # Game logic, haptics, PWA registration
├── manifest.json       # PWA metadata
├── service-worker.js   # Cache-first offline strategy
└── ZenTiles.png        # App icon
```

---

## Deploying

Push to GitHub and enable **Settings → Pages → main branch / root**. Your game will be live at `https://<username>.github.io/ZenTiles` for free.

---

## Contributing

Bug reports and feature ideas are welcome — use the [issue templates](../../issues/new/choose). For code contributions, see [CONTRIBUTING.md](.github/CONTRIBUTING.md).

---

<div align="center">
  <sub>MIT License · Made by <a href="https://github.com/mananmadani">Manan Madani</a></sub>
</div>
