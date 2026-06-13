# Tile Match — project plan (Royal Match–lite)

## Vision

A mobile-first match-3 PWA deployed to GitHub Pages. Swap adjacent tiles, create cascades, and beat score goals within a move limit. Progressively introduce Royal Match–style objectives, blockers, and special tiles.

## Architecture (mirrors [game-hexclear](https://github.com/kimmania/game-hexclear))

| Layer | Purpose |
|-------|---------|
| `src/core/` | Grid, match engine, cascade, RNG, level types, validation |
| `src/game/` | localStorage progress, settings, session resume |
| `src/ui/` | Grid board, HUD, level picker |
| `public/levels/` | JSON level files + generated `index.json` |
| `scripts/` | Manifest generation, level validation |
| `.github/workflows/` | Test → validate → build → deploy |

## Milestones

### M0 — Scaffold ✅

- Vite + TypeScript + `vite-plugin-pwa`
- GitHub Actions deploy to Pages (`base: /game-tilematch/`)
- App shell: header, HUD, grid host, controls
- Level manifest pipeline (`generate-manifest`, `validate-levels`)
- PWA icons and service worker

### M1 — Core match-3 ✅

- Swap adjacent tiles (invalid swaps bounce back)
- Match detection (3+ horizontal/vertical)
- Clear → gravity → seeded refill → cascade loop
- Score goal + move limit + 1★/2★/3★ thresholds
- 10 tutorial levels in chapter “First steps”
- Level picker, unlock progress, session resume
- Unit tests for match engine and RNG

### M2 — Special tiles + blockers ✅

- **Rocket** (4 in a row/col), **Bomb** (5-line or L/T), **Propeller** (2×2 square)
- **Crate** and **Ice** blockers (1–2 layers)
- **Jelly** under-tile clear objective
- Combo rules when swapping two specials
- Tutorial levels 11–15 in chapter “New mechanics”

### M3 — Level editor + content pack ✅

- In-browser editor (`?edit=1`)
- JSON schema validation + level preview script
- 30 hand-tuned levels across 4 chapters
- Star ratings persisted per level

### M4 — Objectives + polish

- Collect items, drop-and-collect goals
- Propeller targeting AI for objectives
- Sound, haptics, reduce-motion settings
- Tutorial overlays per mechanic

### M5 — Advanced mechanics (stretch)

- Grass/carpet spread objective
- Color bomb (5-in-a-line)
- Pre-level boosters (optional, no IAP)
- Daily seeded challenge level

## Level JSON schema

```json
{
  "id": 13,
  "name": "Jelly hall",
  "rows": 8,
  "cols": 8,
  "moves": 22,
  "colors": 4,
  "seed": 2013,
  "goals": [
    { "type": "score", "target": 3000 },
    { "type": "jelly", "target": 12 }
  ],
  "stars": [3000, 4500, 6500],
  "layout": {
    "jelly": [{ "row": 2, "col": 2 }],
    "crates": [{ "row": 3, "col": 3, "layers": 1 }],
    "ice": [{ "row": 5, "col": 2, "layers": 2 }]
  }
}
```

## Out of scope (v1)

- Lives / timers / IAP
- Multiplayer / leaderboards
- Automated solvability prover (designer-tested levels + schema validation)
