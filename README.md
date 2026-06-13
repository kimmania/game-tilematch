# Tile Match

A mobile-first match-3 PWA in the Royal Match–lite style. Swap adjacent tiles, trigger cascades, and reach the score goal before you run out of moves.

## How to play

1. **Tap a tile** to select it.
2. **Tap an adjacent tile** to swap.
3. Swaps count when they create a **match of 3 or more**, a **2×2 square**, or swap two **special tiles**.
4. Matched tiles clear, new tiles fall in, and **cascades** chain for bonus score.
5. **Match 4** for a rocket, **5/L-shape** for a bomb, **2×2** for a propeller.
6. **Win** by reaching all goals (score and/or jelly). Earn up to **3 stars** for higher scores.

See `docs/MECHANICS.md` for scoring rules and `docs/PLAN.md` for the milestone roadmap.

## Development

```bash
npm install
npm run generate-icons
npm run generate-manifest
npm run dev
```

Open the URL from the terminal (usually `http://localhost:5175/game-tilematch/`).

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run validate-levels` | Schema + board sanity check for every level |
| `npm run generate-manifest` | Regenerate `public/levels/index.json` |
| `npm run generate-icons` | Regenerate PNG icons from `public/icons/icon.svg` |

## Levels

Levels live in `public/levels/*.json`. `public/levels/index.json` is generated — never edit it by hand. After adding a level file, run `npm run generate-manifest`.

## GitHub Pages

Pushes to `main` run tests, validate levels, build, and deploy via GitHub Actions.

1. Repo **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. Live site: `https://kimmania.github.io/game-tilematch/`

## Install (PWA)

Works on **HTTPS** (GitHub Pages) or `npm run preview` locally.

### iPhone / iPad (Safari)

1. Open the game in **Safari**.
2. Tap **Share** → **Add to Home Screen**.

### Android (Chrome)

1. Open the site in Chrome.
2. Menu → **Install app** or **Add to Home screen**.

## License

MIT
