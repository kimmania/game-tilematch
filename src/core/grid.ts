import type { Coord, Grid, TileColor } from './types';

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseCellKey(key: string): Coord {
  const [row, col] = key.split(',').map(Number);
  return { row: row!, col: col! };
}

export function createEmptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ tile: null })),
  );
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
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

export function getTile(grid: Grid, row: number, col: number): TileColor | null {
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
  const color = getTile(grid, row, col);
  if (!color) return 0;

  let count = 1;
  let r = row + dr;
  let c = col + dc;
  while (getTile(grid, r, c) === color) {
    count += 1;
    r += dr;
    c += dc;
  }

  r = row - dr;
  c = col - dc;
  while (getTile(grid, r, c) === color) {
    count += 1;
    r -= dr;
    c -= dc;
  }

  return count;
}

export function wouldCreateMatch(grid: Grid, row: number, col: number): boolean {
  return (
    countMatchesAt(grid, row, col, 0, 1) >= 3 ||
    countMatchesAt(grid, row, col, 1, 0) >= 3
  );
}

export function applyGravity(grid: Grid): void {
  const rows = grid.length;
  const cols = grid[0]!.length;

  for (let col = 0; col < cols; col += 1) {
    let writeRow = rows - 1;
    for (let row = rows - 1; row >= 0; row -= 1) {
      const tile = grid[row]![col]!.tile;
      if (tile !== null) {
        if (row !== writeRow) {
          grid[writeRow]![col]!.tile = tile;
          grid[row]![col]!.tile = null;
        }
        writeRow -= 1;
      }
    }
  }
}

export function countEmptyCells(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.tile === null) count += 1;
    }
  }
  return count;
}
