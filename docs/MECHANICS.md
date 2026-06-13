# Tile Match — mechanics reference

## Core rules (M1)

1. **Swap** two orthogonally adjacent tiles.
2. Swap is **valid** if it creates a match **or** swaps two **special** tiles together.
3. Invalid swaps **revert** (no move consumed).
4. Valid swaps **consume one move** and trigger a **cascade**:
   - Find all matches (horizontal, vertical lines of 3+, and 2×2 squares)
   - Clear matched tiles and award score
   - Tiles **fall** down within each column (crates split columns into segments)
   - Empty cells at the top are **refilled** with new random colors (seeded RNG)
   - Repeat until no matches remain
5. **Win** when all goals are met before moves run out.
6. **Lose** when moves reach 0 without meeting every goal.
7. **Stars**: 1★ = score goal, 2★/3★ = higher score thresholds from level JSON.

## Scoring

| Event | Points |
|-------|--------|
| Each tile cleared in a match | 60 × cascade combo multiplier |
| Cascade combo 1 | ×1 |
| Cascade combo 2 | ×1.5 |
| Cascade combo 3+ | ×2 |

## Special tiles (M2)

| Created by | Special | Effect when matched or combo-swapped |
|------------|---------|--------------------------------------|
| 4 in a row | **Rocket ↔** | Clears entire row |
| 4 in a column | **Rocket ↕** | Clears entire column |
| 5 in a straight line | **Color bomb** | Clears every tile of that color |
| 5 in an L/T shape | **Bomb** | Clears 3×3 area |
| 2×2 square | **Propeller** | Flies to a priority target (drop → collect → grass → jelly → crate → ice → tile) |

### Special combos (swap two adjacent specials)

| Combo | Effect |
|-------|--------|
| Rocket + Rocket | Cross blast (both row and column at each position) |
| Bomb + Bomb | 5×5 blast centered on first tile |
| Rocket + Bomb | Cross + bombs at both tiles |
| Color bomb + Color bomb | Clears every tile on the board |
| Propeller + anything | Large blast at both tiles + propeller targeting |

## Blockers (M2)

| Blocker | Behavior |
|---------|----------|
| **Jelly** | Background on a cell; cleared when that cell is hit by a match or special |
| **Crate** | Blocks the cell (no tile). Match **adjacent** to a crate removes one layer |
| **Ice** | Freezes the tile (cannot swap until ice is gone). Each direct or **adjacent** match/special hit removes one layer; when the last layer breaks, the tile clears in the same wave |

## Goals (M2–M4)

| Goal | Win condition |
|------|---------------|
| **Score** | Reach target score (required on every level) |
| **Jelly** | Clear target number of jelly cells |
| **Collect** | Match on or next to static cherries/coins on the board |
| **Drop** | Guide falling cherries/coins to the bottom row |
| **Grass** | Spread carpet onto all goal tiles from seed cells |

## Grass / carpet (M5)

| Rule | Behavior |
|------|----------|
| **Seeds** | Some cells start with green grass (`grassSeeds` in level JSON) |
| **Spread** | When a match touches grass (on a matched cell or adjacent), grass spreads to every cell in that match |
| **Goal** | Cover all `grass` goal tiles marked in the level layout |

## Collectibles (M4)

| Type | Behavior |
|------|----------|
| **Collect** | Static item on a cell; collected when that cell or a neighbor is hit |
| **Drop** | Sits on a tile; falls when tiles below clear; collected when it reaches the bottom row |

## Settings & tutorials (M4)

- **Sound**, **haptic feedback**, and **reduce motion** in the settings panel (⚙)
- **Tutorial overlays** appear once per mechanic (levels 1, 11, 13, 14, 31, 32)

## RNG

Each level has a `seed`. Initial board fill and refills use a deterministic PRNG so sessions can be saved and resumed.
