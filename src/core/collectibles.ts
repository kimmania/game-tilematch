import { cellKey } from './grid';
import type { CollectibleCounts, CollectibleKind, Coord, Grid } from './types';
import { emptyCollectibleCounts } from './types';

const NEIGHBORS: Coord[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function addCount(counts: CollectibleCounts, kind: CollectibleKind): void {
  counts[kind] += 1;
}

/** Collect static items on hit cells and orthogonally adjacent cells. */
export function collectFromHits(grid: Grid, hitCells: Coord[]): CollectibleCounts {
  const counts = emptyCollectibleCounts();
  const visited = new Set<string>();

  const tryCollect = (row: number, col: number): void => {
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0]!.length) return;
    const key = cellKey(row, col);
    if (visited.has(key)) return;
    visited.add(key);

    const cell = grid[row]![col]!;
    if (cell.collectible) {
      addCount(counts, cell.collectible);
      cell.collectible = null;
    }
  };

  for (const hit of hitCells) {
    tryCollect(hit.row, hit.col);
    for (const delta of NEIGHBORS) {
      tryCollect(hit.row + delta.row, hit.col + delta.col);
    }
  }

  return counts;
}

/** Move falling items down within each column segment (crates split columns). */
export function applyDropGravity(grid: Grid): void {
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

      for (let row = segmentBottom; row >= segmentTop; row -= 1) {
        const cell = grid[row]![col]!;
        if (!cell.drop || cell.tile !== null) continue;

        let landing = row;
        for (let below = row + 1; below <= segmentBottom; below += 1) {
          landing = below;
          if (grid[below]![col]!.tile !== null) break;
        }

        if (landing !== row) {
          grid[landing]![col]!.drop = cell.drop;
          cell.drop = null;
        }
      }

      segmentBottom = segmentTop - 1;
    }
  }
}

/** Collect drops that reached the bottom row of the board. */
export function collectExitedDrops(grid: Grid): CollectibleCounts {
  const counts = emptyCollectibleCounts();
  const bottom = grid.length - 1;

  for (let col = 0; col < grid[0]!.length; col += 1) {
    const cell = grid[bottom]![col]!;
    if (cell.crateLayers > 0 || !cell.drop) continue;
    addCount(counts, cell.drop);
    cell.drop = null;
  }

  return counts;
}

export function mergeCounts(into: CollectibleCounts, add: CollectibleCounts): void {
  into.cherry += add.cherry;
  into.coin += add.coin;
}
