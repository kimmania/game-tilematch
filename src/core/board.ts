import {
  applyClearWave,
  applyPropellerHit,
  collectSpecialActivations,
  damageAdjacentCrates,
  damageAdjacentIce,
  isBlockedForSwap,
} from './blockerEngine';
import {
  applyGravity,
  applyLayout,
  cloneGrid,
  createEmptyGrid,
  areAdjacent,
  swapCells,
  wouldCreateAutoMatch,
} from './grid';
import {
  findMatchGroups,
  hasAnyMatch,
  hasAnyValidSwap,
  mergedClearCells,
  primaryMatchColor,
  scoreForStep,
} from './matchEngine';
import { SeededRng } from './rng';
import { cellsForSpecialCombo, classifySpecialSpawn } from './specialEngine';
import { isSpecial, makeTile } from './tile';
import { paletteForCount } from './tileColors';
import type {
  CascadeStep,
  Coord,
  GameState,
  GameStatus,
  Grid,
  LevelDef,
  LevelGoal,
  SwapResult,
  TileColor,
} from './types';

function createGridWithoutMatches(
  rows: number,
  cols: number,
  palette: TileColor[],
  rng: SeededRng,
  grid: Grid,
): void {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (grid[row]![col]!.crateLayers > 0) continue;

      let color: TileColor;
      let attempts = 0;
      do {
        color = rng.pick(palette);
        attempts += 1;
        grid[row]![col]!.tile = makeTile(color);
      } while (wouldCreateAutoMatch(grid, row, col) && attempts < 24);

      if (wouldCreateAutoMatch(grid, row, col)) {
        grid[row]![col]!.tile = makeTile(pickNonMatchingColor(grid, row, col, palette));
      }
    }
  }
}

function pickNonMatchingColor(
  grid: Grid,
  row: number,
  col: number,
  palette: TileColor[],
): TileColor {
  for (const color of palette) {
    grid[row]![col]!.tile = makeTile(color);
    if (!wouldCreateAutoMatch(grid, row, col)) return color;
  }
  return palette[0]!;
}

function shuffleGridColors(grid: Grid, palette: TileColor[], rng: SeededRng): void {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    for (let row = 0; row < grid.length; row += 1) {
      for (let col = 0; col < grid[0]!.length; col += 1) {
        if (grid[row]![col]!.crateLayers > 0) continue;
        grid[row]![col]!.tile = makeTile(rng.pick(palette));
      }
    }
    if (!hasAnyMatch(grid)) return;
  }
}

function refillGrid(grid: Grid, palette: TileColor[], rng: SeededRng): void {
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[0]!.length; col += 1) {
      const cell = grid[row]![col]!;
      if (cell.tile === null && cell.crateLayers === 0) {
        cell.tile = makeTile(rng.pick(palette));
      }
    }
  }
}

function mergeCoords(...lists: Coord[][]): Coord[] {
  const map = new Map<string, Coord>();
  for (const list of lists) {
    for (const cell of list) {
      map.set(`${cell.row},${cell.col}`, cell);
    }
  }
  return [...map.values()];
}

function damageNeighbors(grid: Grid, hitCells: Coord[]): void {
  damageAdjacentCrates(grid, hitCells);
  damageAdjacentIce(grid, hitCells);
}

function propellersInCells(grid: Grid, cells: Coord[]): Coord[] {
  return cells.filter((c) => grid[c.row]![c.col]!.tile?.special === 'propeller');
}

function runCascadeStep(
  state: GameState,
  rng: SeededRng,
  combo: number,
  swapA?: Coord,
  swapB?: Coord,
): CascadeStep | null {
  const matches = findMatchGroups(state.grid);
  if (matches.length === 0) return null;

  const matchedCells = mergedClearCells(matches);
  const color = primaryMatchColor(matches, state.grid);
  const spawn = color != null ? classifySpecialSpawn(matches, color, swapA, swapB) : null;

  const activationCells = collectSpecialActivations(
    state.grid,
    matchedCells,
    state.rows,
    state.cols,
  );

  const propellerOrigins = propellersInCells(state.grid, matchedCells);

  let clearTargets = mergeCoords(matchedCells, activationCells);
  if (spawn) {
    clearTargets = clearTargets.filter(
      (c) => !(c.row === spawn.coord.row && c.col === spawn.coord.col),
    );
  }

  const clearResult = applyClearWave(state.grid, clearTargets);
  damageNeighbors(state.grid, clearResult.hitCells);
  state.progress.jellyCleared += clearResult.clearedJelly;

  for (const origin of propellerOrigins) {
    const propResult = applyPropellerHit(state.grid, origin, state.rows, state.cols, rng);
    state.progress.jellyCleared += propResult.clearedJelly;
    damageNeighbors(state.grid, propResult.hitCells);
    clearResult.clearedTiles.push(...propResult.clearedTiles);
    if (propResult.activated.length > 0) {
      clearResult.activated.push(...propResult.activated);
    }
  }

  const points = scoreForStep(clearResult.clearedTiles.length, combo);
  state.score += points;

  if (spawn) {
    state.grid[spawn.coord.row]![spawn.coord.col]!.tile = makeTile(spawn.color, spawn.special);
  }

  applyGravity(state.grid);
  refillGrid(state.grid, state.palette, rng);

  return {
    matches,
    cleared: clearResult.clearedTiles,
    spawned: spawn ?? undefined,
    activated: clearResult.activated.length > 0 ? clearResult.activated : undefined,
    points,
    combo,
  };
}

function runSpecialCombo(
  state: GameState,
  posA: Coord,
  posB: Coord,
  rng: SeededRng,
): CascadeStep[] {
  const tileA = state.grid[posA.row]![posA.col]!.tile!;
  const tileB = state.grid[posB.row]![posB.col]!.tile!;
  const specialA = tileA.special!;
  const specialB = tileB.special!;

  const targets = cellsForSpecialCombo(
    specialA,
    specialB,
    posA,
    posB,
    state.rows,
    state.cols,
  );

  state.grid[posA.row]![posA.col]!.tile = null;
  state.grid[posB.row]![posB.col]!.tile = null;

  const clearResult = applyClearWave(state.grid, targets);
  damageNeighbors(state.grid, clearResult.hitCells);
  state.progress.jellyCleared += clearResult.clearedJelly;

  const points = scoreForStep(clearResult.clearedTiles.length, 1);
  state.score += points;

  applyGravity(state.grid);
  refillGrid(state.grid, state.palette, rng);

  const step: CascadeStep = {
    matches: [],
    cleared: clearResult.clearedTiles,
    activated: [specialA, specialB],
    points,
    combo: 1,
  };

  return [step, ...runCascade(state, rng)];
}

export function runCascade(
  state: GameState,
  rng: SeededRng,
  swapA?: Coord,
  swapB?: Coord,
): CascadeStep[] {
  const steps: CascadeStep[] = [];
  let combo = 0;
  let first = true;

  while (true) {
    combo += 1;
    const step = runCascadeStep(
      state,
      rng,
      combo,
      first ? swapA : undefined,
      first ? swapB : undefined,
    );
    first = false;
    if (!step) break;
    steps.push(step);
  }

  state.rngState = rng.getState();
  return steps;
}

export function createGameState(level: LevelDef): GameState {
  const palette = paletteForCount(level.colors);
  const rng = new SeededRng(level.seed);
  const grid = createEmptyGrid(level.rows, level.cols);
  const totalJelly = applyLayout(grid, level.layout);
  createGridWithoutMatches(level.rows, level.cols, palette, rng, grid);

  if (!hasAnyValidSwap(grid)) {
    shuffleGridColors(grid, palette, rng);
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
    progress: { score: 0, jellyCleared: 0 },
    totalJelly,
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    grid: cloneGrid(state.grid),
    goals: [...state.goals],
    stars: [...state.stars],
    progress: { ...state.progress },
  };
}

export function scoreGoalTarget(state: GameState): number | null {
  const goal = state.goals.find((entry) => entry.type === 'score');
  return goal?.target ?? null;
}

export function jellyGoalTarget(state: GameState): number | null {
  const goal = state.goals.find((entry) => entry.type === 'jelly');
  return goal?.target ?? null;
}

export function starsEarned(state: GameState): number {
  if (state.score >= state.stars[2]) return 3;
  if (state.score >= state.stars[1]) return 2;
  if (state.score >= state.stars[0]) return 1;
  return 0;
}

function goalMet(state: GameState, goal: LevelGoal): boolean {
  if (goal.type === 'score') return state.score >= goal.target;
  return state.progress.jellyCleared >= goal.target;
}

export function goalsMet(state: GameState): boolean {
  return state.goals.every((goal) => goalMet(state, goal));
}

export function resolveStatus(state: GameState): GameStatus {
  if (goalsMet(state)) return 'won';
  if (state.movesLeft <= 0) return 'lost';
  return 'playing';
}

function isSpecialComboSwap(state: GameState, a: Coord, b: Coord): boolean {
  const tileA = state.grid[a.row]![a.col]!.tile;
  const tileB = state.grid[b.row]![b.col]!.tile;
  return isSpecial(tileA) && isSpecial(tileB);
}

export function trySwap(state: GameState, a: Coord, b: Coord): SwapResult {
  if (state.status !== 'playing') {
    return { ok: false, reason: 'not-playing' };
  }

  if (!areAdjacent(a, b)) {
    return { ok: false, reason: 'not-adjacent' };
  }

  if (isBlockedForSwap(state.grid, a.row, a.col) || isBlockedForSwap(state.grid, b.row, b.col)) {
    return { ok: false, reason: 'blocked' };
  }

  const next = cloneGameState(state);
  const combo = isSpecialComboSwap(next, a, b);

  if (!combo) {
    swapCells(next.grid, a, b);
    if (!hasAnyMatch(next.grid)) {
      return { ok: false, reason: 'no-match' };
    }
  }

  next.movesLeft -= 1;
  const rng = SeededRng.fromState(next.rngState);

  const steps = combo
    ? runSpecialCombo(next, a, b, rng)
    : runCascade(next, rng, a, b);

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

export function formatGoals(state: GameState): string {
  const parts: string[] = [];
  const scoreTarget = scoreGoalTarget(state);
  if (scoreTarget != null) {
    parts.push(`Score ${state.score.toLocaleString()}/${scoreTarget.toLocaleString()}`);
  }
  const jellyTarget = jellyGoalTarget(state);
  if (jellyTarget != null) {
    parts.push(`Jelly ${state.progress.jellyCleared}/${jellyTarget}`);
  }
  return parts.join(' · ');
}
