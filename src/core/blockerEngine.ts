import { cellKey } from './grid';
import { isSpecial } from './tile';
import type { Coord, Grid, SpecialKind } from './types';
import type { SeededRng } from './rng';
import { cellsForSpecial, pickPropellerTarget, type ObjectiveContext } from './specialEngine';

const NEIGHBORS: Coord[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

export function isBlockedForSwap(grid: Grid, row: number, col: number): boolean {
  const cell = grid[row]![col]!;
  if (cell.crateLayers > 0) return true;
  if (!cell.tile) return true;
  if (cell.iceLayers > 0) return true;
  return false;
}

export function damageAdjacentCrates(grid: Grid, hitCells: Coord[]): void {
  const damaged = new Set<string>();

  for (const hit of hitCells) {
    for (const delta of NEIGHBORS) {
      const row = hit.row + delta.row;
      const col = hit.col + delta.col;
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0]!.length) continue;
      const key = cellKey(row, col);
      if (damaged.has(key)) continue;
      const cell = grid[row]![col]!;
      if (cell.crateLayers > 0) {
        cell.crateLayers -= 1;
        damaged.add(key);
      }
    }
  }
}

/** Match or special hits adjacent to ice remove one layer (Royal Match style). */
export function damageAdjacentIce(grid: Grid, hitCells: Coord[]): void {
  const damaged = new Set<string>();

  for (const hit of hitCells) {
    for (const delta of NEIGHBORS) {
      const row = hit.row + delta.row;
      const col = hit.col + delta.col;
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0]!.length) continue;
      const key = cellKey(row, col);
      if (damaged.has(key)) continue;
      const cell = grid[row]![col]!;
      if (cell.iceLayers > 0) {
        cell.iceLayers -= 1;
        damaged.add(key);
      }
    }
  }
}

export type ClearResult = {
  /** Cells whose tile was removed. */
  clearedTiles: Coord[];
  /** Every cell targeted by this clear wave. */
  hitCells: Coord[];
  clearedJelly: number;
  activated: SpecialKind[];
};

/**
 * Apply a clear wave to cells. Ice absorbs one hit before the tile is removed.
 * Returns coords whose tiles were actually removed.
 */
export function applyClearWave(grid: Grid, targets: Coord[]): ClearResult {
  const unique = new Map<string, Coord>();
  for (const cell of targets) unique.set(cellKey(cell.row, cell.col), cell);

  const clearedTiles: Coord[] = [];
  let clearedJelly = 0;
  const activated: SpecialKind[] = [];

  for (const cell of unique.values()) {
    const slot = grid[cell.row]![cell.col]!;

    if (slot.jelly) {
      slot.jelly = false;
      clearedJelly += 1;
    }

    if (slot.crateLayers > 0) {
      slot.crateLayers -= 1;
      continue;
    }

    if (slot.iceLayers > 0) {
      slot.iceLayers -= 1;
      if (slot.iceLayers > 0) continue;
      // Last ice layer broke — tile clears in the same wave when it was matched.
    }

    if (slot.tile) {
      if (isSpecial(slot.tile)) {
        activated.push(slot.tile.special);
      }
      slot.tile = null;
      clearedTiles.push(cell);
    }
  }

  return { clearedTiles, hitCells: [...unique.values()], clearedJelly, activated };
}

/** Resolve propeller flight after the origin tile was cleared. */
export function applyPropellerHit(
  grid: Grid,
  origin: Coord,
  rows: number,
  cols: number,
  rng: SeededRng,
  ctx?: ObjectiveContext,
): ClearResult {
  const target = pickPropellerTarget(grid, origin, rows, cols, rng, ctx);
  if (!target) return { clearedTiles: [], hitCells: [], clearedJelly: 0, activated: [] };

  const slot = grid[target.row]![target.col]!;
  let extra: Coord[] = [];

  if (slot.tile && isSpecial(slot.tile)) {
    extra = cellsForSpecial(slot.tile.special, target, rows, cols);
  }

  const all = [{ ...target }, ...extra];
  return applyClearWave(grid, all);
}

export function collectSpecialActivations(
  grid: Grid,
  coords: Coord[],
  rows: number,
  cols: number,
): Coord[] {
  const map = new Map<string, Coord>();

  for (const coord of coords) {
    const tile = grid[coord.row]![coord.col]!.tile;
    if (!tile || !isSpecial(tile)) continue;
    for (const cell of cellsForSpecial(tile.special, coord, rows, cols)) {
      map.set(cellKey(cell.row, cell.col), cell);
    }
  }

  return [...map.values()];
}
