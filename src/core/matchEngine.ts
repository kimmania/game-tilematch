import { cellKey } from './grid';
import { isSpecial, tileColor } from './tile';
import type { Coord, Grid, MatchGroup, TileColor } from './types';

function collectRun(
  grid: Grid,
  row: number,
  col: number,
  dr: number,
  dc: number,
): Coord[] {
  const color = tileColor(grid[row]![col]!.tile);
  if (!color) return [];
  if (grid[row]![col]!.crateLayers > 0) return [];

  const cells: Coord[] = [{ row, col }];
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < grid.length && c >= 0 && c < grid[0]!.length) {
    const cell = grid[r]![c]!;
    if (cell.crateLayers > 0 || tileColor(cell.tile) !== color) break;
    cells.push({ row: r, col: c });
    r += dr;
    c += dc;
  }

  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < grid.length && c >= 0 && c < grid[0]!.length) {
    const cell = grid[r]![c]!;
    if (cell.crateLayers > 0 || tileColor(cell.tile) !== color) break;
    cells.unshift({ row: r, col: c });
    r -= dr;
    c -= dc;
  }

  return cells.length >= 3 ? cells : [];
}

function findSquareGroups(grid: Grid): MatchGroup[] {
  const rows = grid.length;
  const cols = grid[0]!.length;
  const groups: MatchGroup[] = [];
  const seen = new Set<string>();

  for (let row = 0; row < rows - 1; row += 1) {
    for (let col = 0; col < cols - 1; col += 1) {
      const cells: Coord[] = [
        { row, col },
        { row, col: col + 1 },
        { row: row + 1, col },
        { row: row + 1, col: col + 1 },
      ];

      const color = tileColor(grid[row]![col]!.tile);
      if (!color) continue;

      const valid = cells.every((c) => {
        const cell = grid[c.row]![c.col]!;
        return cell.crateLayers === 0 && tileColor(cell.tile) === color;
      });

      if (!valid) continue;

      const key = cells.map((cell) => cellKey(cell.row, cell.col)).join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      groups.push({ cells, length: 4 });
    }
  }

  return groups;
}

export function findMatchGroups(grid: Grid): MatchGroup[] {
  const rows = grid.length;
  const cols = grid[0]!.length;
  const seen = new Set<string>();
  const groups: MatchGroup[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!grid[row]![col]!.tile) continue;
      if (grid[row]![col]!.crateLayers > 0) continue;

      for (const [dr, dc] of [
        [0, 1] as const,
        [1, 0] as const,
      ]) {
        const cells = collectRun(grid, row, col, dr, dc);
        if (cells.length < 3) continue;

        const key = cells.map((cell) => cellKey(cell.row, cell.col)).join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        groups.push({ cells, length: cells.length });
      }
    }
  }

  for (const square of findSquareGroups(grid)) {
    const key = square.cells.map((cell) => cellKey(cell.row, cell.col)).join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push(square);
  }

  return groups;
}

export function hasAnyMatch(grid: Grid): boolean {
  return findMatchGroups(grid).length > 0;
}

export function mergedClearCells(groups: MatchGroup[]): Coord[] {
  const map = new Map<string, Coord>();
  for (const group of groups) {
    for (const cell of group.cells) {
      map.set(cellKey(cell.row, cell.col), cell);
    }
  }
  return [...map.values()];
}

export function scoreForStep(clearedCount: number, combo: number): number {
  const multiplier = combo <= 1 ? 1 : combo === 2 ? 1.5 : 2;
  return Math.round(clearedCount * 60 * multiplier);
}

function swapWouldMatch(grid: Grid, row: number, col: number, nr: number, nc: number): boolean {
  const a = grid[row]![col]!.tile;
  const b = grid[nr]![nc]!.tile;
  grid[row]![col]!.tile = b;
  grid[nr]![nc]!.tile = a;
  const matched = hasAnyMatch(grid);
  grid[row]![col]!.tile = a;
  grid[nr]![nc]!.tile = b;
  return matched;
}

export function hasAnyValidSwap(grid: Grid): boolean {
  const rows = grid.length;
  const cols = grid[0]!.length;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = grid[row]![col]!;
      if (!cell.tile || cell.crateLayers > 0 || cell.iceLayers > 0) continue;

      for (const [dr, dc] of [
        [0, 1] as const,
        [1, 0] as const,
      ]) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= rows || nc >= cols) continue;
        const other = grid[nr]![nc]!;
        if (!other.tile || other.crateLayers > 0 || other.iceLayers > 0) continue;

        if (isSpecial(cell.tile) && isSpecial(other.tile)) return true;
        if (swapWouldMatch(grid, row, col, nr, nc)) return true;
      }
    }
  }

  return false;
}

export function primaryMatchColor(groups: MatchGroup[], grid: Grid): TileColor | null {
  const first = groups[0]?.cells[0];
  if (!first) return null;
  return tileColor(grid[first.row]![first.col]!.tile);
}
