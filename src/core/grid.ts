import { tileColor } from './tile';
import type { Cell, Coord, Grid, LevelLayout, Tile } from './types';

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseCellKey(key: string): Coord {
  const [row, col] = key.split(',').map(Number);
  return { row: row!, col: col! };
}

export function createEmptyCell(): Cell {
  return { tile: null, jelly: false, crateLayers: 0, iceLayers: 0 };
}

export function createEmptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createEmptyCell()),
  );
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      tile: cell.tile ? { ...cell.tile } : null,
    })),
  );
}

export function areAdjacent(a: Coord, b: Coord): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

export function inBounds(grid: Grid, row: number, col: number): boolean {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0]!.length;
}

export function swapCells(grid: Grid, a: Coord, b: Coord): void {
  const temp = grid[a.row]![a.col]!.tile;
  grid[a.row]![a.col]!.tile = grid[b.row]![b.col]!.tile;
  grid[b.row]![b.col]!.tile = temp;
}

export function getTile(grid: Grid, row: number, col: number): Tile | null {
  if (!inBounds(grid, row, col)) return null;
  return grid[row]![col]!.tile;
}

export function countMatchesAt(
  grid: Grid,
  row: number,
  col: number,
  dr: number,
  dc: number,
): number {
  const color = tileColor(getTile(grid, row, col));
  if (!color) return 0;

  let count = 1;
  let r = row + dr;
  let c = col + dc;
  while (tileColor(getTile(grid, r, c)) === color) {
    count += 1;
    r += dr;
    c += dc;
  }

  r = row - dr;
  c = col - dc;
  while (tileColor(getTile(grid, r, c)) === color) {
    count += 1;
    r -= dr;
    c -= dc;
  }

  return count;
}

export function wouldCreateMatch(grid: Grid, row: number, col: number): boolean {
  if (grid[row]![col]!.crateLayers > 0) return false;
  return (
    countMatchesAt(grid, row, col, 0, 1) >= 3 ||
    countMatchesAt(grid, row, col, 1, 0) >= 3
  );
}

export function wouldCreateSquare(grid: Grid, row: number, col: number): boolean {
  const color = tileColor(getTile(grid, row, col));
  if (!color || grid[row]![col]!.crateLayers > 0) return false;

  for (const dr of [0, -1] as const) {
    for (const dc of [0, -1] as const) {
      const baseRow = row + dr;
      const baseCol = col + dc;
      if (baseRow < 0 || baseCol < 0) continue;
      if (baseRow + 1 >= grid.length || baseCol + 1 >= grid[0]!.length) continue;

      const corners = [
        { row: baseRow, col: baseCol },
        { row: baseRow, col: baseCol + 1 },
        { row: baseRow + 1, col: baseCol },
        { row: baseRow + 1, col: baseCol + 1 },
      ];

      if (
        corners.every((c) => {
          const cell = grid[c.row]![c.col]!;
          return cell.crateLayers === 0 && tileColor(cell.tile) === color;
        })
      ) {
        return true;
      }
    }
  }

  return false;
}

export function wouldCreateAutoMatch(grid: Grid, row: number, col: number): boolean {
  return wouldCreateMatch(grid, row, col) || wouldCreateSquare(grid, row, col);
}

/** Gravity within each column segment separated by crates. */
export function applyGravity(grid: Grid): void {
  const rows = grid.length;
  const cols = grid[0]!.length;

  for (let col = 0; col < cols; col += 1) {
    let segmentBottom = rows - 1;

    while (segmentBottom >= 0) {
      while (segmentBottom >= 0 && grid[segmentBottom]![col]!.crateLayers > 0) {
        segmentBottom -= 1;
      }
      if (segmentBottom < 0) break;

      let segmentTop = segmentBottom;
      while (segmentTop >= 0 && grid[segmentTop]![col]!.crateLayers === 0) {
        segmentTop -= 1;
      }
      segmentTop += 1;

      let writeRow = segmentBottom;
      for (let row = segmentBottom; row >= segmentTop; row -= 1) {
        const tile = grid[row]![col]!.tile;
        if (tile !== null) {
          if (row !== writeRow) {
            grid[writeRow]![col]!.tile = tile;
            grid[row]![col]!.tile = null;
          }
          writeRow -= 1;
        }
      }

      segmentBottom = segmentTop - 1;
    }
  }
}

export function applyLayout(grid: Grid, layout: LevelLayout | undefined): number {
  if (!layout) return 0;

  let jellyCount = 0;

  for (const { row, col } of layout.jelly ?? []) {
    if (!inBounds(grid, row, col)) continue;
    grid[row]![col]!.jelly = true;
    jellyCount += 1;
  }

  for (const crate of layout.crates ?? []) {
    if (!inBounds(grid, crate.row, crate.col)) continue;
    grid[crate.row]![crate.col]!.crateLayers = crate.layers;
    grid[crate.row]![crate.col]!.tile = null;
  }

  for (const ice of layout.ice ?? []) {
    if (!inBounds(grid, ice.row, ice.col)) continue;
    grid[ice.row]![ice.col]!.iceLayers = ice.layers;
  }

  return jellyCount;
}

export function countEmptyFillableCells(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.tile === null && cell.crateLayers === 0) count += 1;
    }
  }
  return count;
}
