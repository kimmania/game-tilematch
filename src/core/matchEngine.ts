import { cellKey } from './grid';
import type { Coord, Grid, MatchGroup } from './types';

function collectRun(
  grid: Grid,
  row: number,
  col: number,
  dr: number,
  dc: number,
): Coord[] {
  const color = grid[row]![col]!.tile;
  if (!color) return [];

  const cells: Coord[] = [{ row, col }];
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < grid.length && c >= 0 && c < grid[0]!.length) {
    if (grid[r]![c]!.tile !== color) break;
    cells.push({ row: r, col: c });
    r += dr;
    c += dc;
  }

  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < grid.length && c >= 0 && c < grid[0]!.length) {
    if (grid[r]![c]!.tile !== color) break;
    cells.unshift({ row: r, col: c });
    r -= dr;
    c -= dc;
  }

  return cells.length >= 3 ? cells : [];
}

export function findMatchGroups(grid: Grid): MatchGroup[] {
  const rows = grid.length;
  const cols = grid[0]!.length;
  const seen = new Set<string>();
  const groups: MatchGroup[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!grid[row]![col]!.tile) continue;

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

export function scoreForStep(groups: MatchGroup[], combo: number): number {
  const multiplier = combo <= 1 ? 1 : combo === 2 ? 1.5 : 2;
  const tiles = mergedClearCells(groups).length;
  return Math.round(tiles * 60 * multiplier);
}

export function hasAnyValidSwap(grid: Grid): boolean {
  const rows = grid.length;
  const cols = grid[0]!.length;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!grid[row]![col]!.tile) continue;

      for (const [dr, dc] of [
        [0, 1] as const,
        [1, 0] as const,
      ]) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= rows || nc >= cols) continue;
        if (!grid[nr]![nc]!.tile) continue;

        const a = grid[row]![col]!.tile;
        const b = grid[nr]![nc]!.tile;
        grid[row]![col]!.tile = b;
        grid[nr]![nc]!.tile = a;

        const matched = hasAnyMatch(grid);

        grid[row]![col]!.tile = a;
        grid[nr]![nc]!.tile = b;

        if (matched) return true;
      }
    }
  }

  return false;
}
