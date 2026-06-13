import {
  applyGravity,
  cloneGrid,
  createEmptyGrid,
  areAdjacent,
  swapCells,
  wouldCreateMatch,
} from './grid';
import {
  findMatchGroups,
  hasAnyMatch,
  hasAnyValidSwap,
  mergedClearCells,
  scoreForStep,
} from './matchEngine';
import { SeededRng } from './rng';
import { paletteForCount } from './tileColors';
import type {
  CascadeStep,
  Coord,
  GameState,
  GameStatus,
  Grid,
  LevelDef,
  SwapResult,
  TileColor,
} from './types';

export function createGridWithoutMatches(
  rows: number,
  cols: number,
  palette: TileColor[],
  rng: SeededRng,
): Grid {
  const grid = createEmptyGrid(rows, cols);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let tile: TileColor;
      let attempts = 0;
      do {
        tile = rng.pick(palette);
        attempts += 1;
        grid[row]![col]!.tile = tile;
      } while (wouldCreateMatch(grid, row, col) && attempts < 24);

      if (wouldCreateMatch(grid, row, col)) {
        grid[row]![col]!.tile = pickNonMatchingColor(grid, row, col, palette);
      }
    }
  }

  if (hasAnyMatch(grid)) {
    return shuffleGridColors(grid, palette, rng);
  }

  return grid;
}

function pickNonMatchingColor(
  grid: Grid,
  row: number,
  col: number,
  palette: TileColor[],
): TileColor {
  for (const color of palette) {
    grid[row]![col]!.tile = color;
    if (!wouldCreateMatch(grid, row, col)) return color;
  }
  return palette[0]!;
}

function shuffleGridColors(grid: Grid, palette: TileColor[], rng: SeededRng): Grid {
  const next = cloneGrid(grid);
  for (let attempt = 0; attempt < 48; attempt += 1) {
    for (let row = 0; row < next.length; row += 1) {
      for (let col = 0; col < next[0]!.length; col += 1) {
        next[row]![col]!.tile = rng.pick(palette);
      }
    }
    if (!hasAnyMatch(next)) return next;
  }
  return next;
}

function refillGrid(grid: Grid, palette: TileColor[], rng: SeededRng): void {
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[0]!.length; col += 1) {
      if (grid[row]![col]!.tile === null) {
        grid[row]![col]!.tile = rng.pick(palette);
      }
    }
  }
}

export function runCascade(state: GameState, rng: SeededRng): CascadeStep[] {
  const steps: CascadeStep[] = [];
  let combo = 0;

  while (true) {
    const matches = findMatchGroups(state.grid);
    if (matches.length === 0) break;

    combo += 1;
    const cleared = mergedClearCells(matches);
    const points = scoreForStep(matches, combo);
    state.score += points;

    for (const cell of cleared) {
      state.grid[cell.row]![cell.col]!.tile = null;
    }

    applyGravity(state.grid);
    refillGrid(state.grid, state.palette, rng);

    steps.push({ matches, cleared, points, combo });
  }

  state.rngState = rng.getState();
  return steps;
}

export function createGameState(level: LevelDef): GameState {
  const palette = paletteForCount(level.colors);
  const rng = new SeededRng(level.seed);
  let grid = createGridWithoutMatches(level.rows, level.cols, palette, rng);

  if (!hasAnyValidSwap(grid)) {
    grid = shuffleGridColors(grid, palette, rng);
  }

  return {
    levelId: level.id,
    rows: level.rows,
    cols: level.cols,
    grid,
    palette,
    movesLeft: level.moves,
    score: 0,
    status: 'playing',
    rngState: rng.getState(),
    goals: level.goals,
    stars: level.stars,
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    grid: cloneGrid(state.grid),
    goals: [...state.goals],
    stars: [...state.stars],
  };
}

export function scoreGoalTarget(state: GameState): number {
  const goal = state.goals.find((entry) => entry.type === 'score');
  return goal?.target ?? state.stars[0];
}

export function starsEarned(state: GameState): number {
  if (state.score >= state.stars[2]) return 3;
  if (state.score >= state.stars[1]) return 2;
  if (state.score >= state.stars[0]) return 1;
  return 0;
}

export function goalsMet(state: GameState): boolean {
  return state.score >= scoreGoalTarget(state);
}

export function resolveStatus(state: GameState): GameStatus {
  if (goalsMet(state)) return 'won';
  if (state.movesLeft <= 0) return 'lost';
  return 'playing';
}

export function trySwap(state: GameState, a: Coord, b: Coord): SwapResult {
  if (state.status !== 'playing') {
    return { ok: false, reason: 'not-playing' };
  }

  if (!areAdjacent(a, b)) {
    return { ok: false, reason: 'not-adjacent' };
  }

  if (!state.grid[a.row]![a.col]!.tile || !state.grid[b.row]![b.col]!.tile) {
    return { ok: false, reason: 'empty-cell' };
  }

  const next = cloneGameState(state);
  swapCells(next.grid, a, b);

  if (!hasAnyMatch(next.grid)) {
    return { ok: false, reason: 'no-match' };
  }

  next.movesLeft -= 1;
  const rng = SeededRng.fromState(next.rngState);
  const steps = runCascade(next, rng);
  next.status = resolveStatus(next);

  return { ok: true, state: next, steps };
}

export function statusLabel(status: GameStatus): string {
  switch (status) {
    case 'won':
      return 'Won';
    case 'lost':
      return 'Out of moves';
    default:
      return 'Playing';
  }
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}
