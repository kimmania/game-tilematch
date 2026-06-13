import type { Coord, Grid } from './types';

const NEIGHBORS: Coord[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** Spread grass/carpet to matched cells when the match touches existing grass. */
export function spreadGrassFromHits(grid: Grid, hitCells: Coord[]): void {
  if (hitCells.length === 0) return;

  let touchesGrass = false;
  for (const hit of hitCells) {
    const cell = grid[hit.row]![hit.col]!;
    if (cell.grass) touchesGrass = true;
    for (const delta of NEIGHBORS) {
      const row = hit.row + delta.row;
      const col = hit.col + delta.col;
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0]!.length) continue;
      if (grid[row]![col]!.grass) touchesGrass = true;
    }
  }

  if (!touchesGrass) return;

  for (const hit of hitCells) {
    const cell = grid[hit.row]![hit.col]!;
    if (cell.crateLayers === 0) cell.grass = true;
  }
}

export function countGrassOnTargets(grid: Grid, targets: Coord[]): number {
  let count = 0;
  for (const { row, col } of targets) {
    if (grid[row]?.[col]?.grass) count += 1;
  }
  return count;
}
