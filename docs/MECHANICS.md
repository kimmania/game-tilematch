# Tile Match — mechanics reference

## Core rules (M1)

1. **Swap** two orthogonally adjacent tiles.
2. Swap is **valid** only if it creates at least one line of **3+ matching colors**.
3. Invalid swaps **revert** (no move consumed).
4. Valid swaps **consume one move** and trigger a **cascade**:
   - Find all matches (horizontal and vertical lines of 3+)
   - Clear matched tiles and award score
   - Tiles **fall** down within each column
   - Empty cells at the top are **refilled** with new random colors (seeded RNG)
   - Repeat until no matches remain
5. **Win** when the score goal is reached before moves run out.
6. **Lose** when moves reach 0 without meeting the goal.
7. **Stars**: 1★ = goal score, 2★/3★ = higher score thresholds from level JSON.

## Scoring

| Event | Points |
|-------|--------|
| Each tile cleared in a match | 60 × cascade combo multiplier |
| Cascade combo 1 | ×1 |
| Cascade combo 2 | ×1.5 |
| Cascade combo 3+ | ×2 |

## Colors

Up to 5 tile colors per level (`colors` field). Fewer colors = easier matching.

## RNG

Each level has a `seed`. Initial board fill and refills use a deterministic PRNG so sessions can be saved and resumed.

## Planned (M2+)

See `docs/PLAN.md` for rockets, bombs, propellers, crates, ice, jelly, and collection goals.
