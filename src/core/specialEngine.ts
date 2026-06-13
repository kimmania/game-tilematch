import { cellKey } from './grid';
import { tileColor } from './tile';
import type {
  CollectibleKind,
  Coord,
  GoalProgress,
  Grid,
  LevelGoal,
  MatchGroup,
  SpecialKind,
  SpecialSpawn,
  TileColor,
} from './types';

/** Cells cleared by a special tile (excluding combo extras). */
export function cellsForSpecial(
  special: SpecialKind,
  origin: Coord,
  rows: number,
  cols: number,
  grid?: Grid,
): Coord[] {
  const cells: Coord[] = [];

  switch (special) {
    case 'rocket-h':
      for (let col = 0; col < cols; col += 1) {
        cells.push({ row: origin.row, col });
      }
      break;
    case 'rocket-v':
      for (let row = 0; row < rows; row += 1) {
        cells.push({ row, col: origin.col });
      }
      break;
    case 'bomb':
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const row = origin.row + dr;
          const col = origin.col + dc;
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            cells.push({ row, col });
          }
        }
      }
      break;
    case 'color-bomb': {
      if (!grid) {
        cells.push(origin);
        break;
      }
      const color = tileColor(grid[origin.row]![origin.col]!.tile);
      if (!color) {
        cells.push(origin);
        break;
      }
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (tileColor(grid[row]![col]!.tile) === color) {
            cells.push({ row, col });
          }
        }
      }
      break;
    }
    case 'propeller':
      cells.push(origin);
      break;
  }

  return cells;
}

function allTileCells(grid: Grid): Coord[] {
  const cells: Coord[] = [];
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[0]!.length; col += 1) {
      if (grid[row]![col]!.tile) cells.push({ row, col });
    }
  }
  return cells;
}

/** Combo when two specials are swapped together. */
export function cellsForSpecialCombo(
  a: SpecialKind,
  b: SpecialKind,
  posA: Coord,
  posB: Coord,
  rows: number,
  cols: number,
  grid: Grid,
): Coord[] {
  const map = new Map<string, Coord>();

  const add = (cells: Coord[]) => {
    for (const cell of cells) {
      map.set(cellKey(cell.row, cell.col), cell);
    }
  };

  if (a === 'color-bomb' && b === 'color-bomb') {
    add(allTileCells(grid));
    return [...map.values()];
  }

  if (a === 'propeller' || b === 'propeller') {
    add(cellsForSpecial(a, posA, rows, cols, grid));
    add(cellsForSpecial(b, posB, rows, cols, grid));
    add(cellsForSpecial('bomb', posA, rows, cols));
    add(cellsForSpecial('bomb', posB, rows, cols));
    return [...map.values()];
  }

  if (a === 'bomb' && b === 'bomb') {
    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) {
        const row = posA.row + dr;
        const col = posA.col + dc;
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          add([{ row, col }]);
        }
      }
    }
    return [...map.values()];
  }

  const rocketA = a.startsWith('rocket') ? a : b.startsWith('rocket') ? b : null;
  const rocketB = a.startsWith('rocket') ? b : b.startsWith('rocket') ? a : null;

  if (rocketA && rocketB) {
    add(cellsForSpecial('rocket-h', posA, rows, cols));
    add(cellsForSpecial('rocket-v', posA, rows, cols));
    add(cellsForSpecial('rocket-h', posB, rows, cols));
    add(cellsForSpecial('rocket-v', posB, rows, cols));
    return [...map.values()];
  }

  if ((a.startsWith('rocket') && b === 'bomb') || (b.startsWith('rocket') && a === 'bomb')) {
    const rocketPos = a.startsWith('rocket') ? posA : posB;
    add(cellsForSpecial('rocket-h', rocketPos, rows, cols));
    add(cellsForSpecial('rocket-v', rocketPos, rows, cols));
    add(cellsForSpecial('bomb', rocketPos, rows, cols));
    add(cellsForSpecial('bomb', posA, rows, cols));
    add(cellsForSpecial('bomb', posB, rows, cols));
    return [...map.values()];
  }

  if (
    (a.startsWith('rocket') && b === 'color-bomb') ||
    (b.startsWith('rocket') && a === 'color-bomb')
  ) {
    const rocketPos = a.startsWith('rocket') ? posA : posB;
    const colorPos = a === 'color-bomb' ? posA : posB;
    add(cellsForSpecial('rocket-h', rocketPos, rows, cols));
    add(cellsForSpecial('rocket-v', rocketPos, rows, cols));
    add(cellsForSpecial('color-bomb', colorPos, rows, cols, grid));
    return [...map.values()];
  }

  if ((a === 'bomb' && b === 'color-bomb') || (b === 'bomb' && a === 'color-bomb')) {
    const colorPos = a === 'color-bomb' ? posA : posB;
    const bombPos = a === 'bomb' ? posA : posB;
    add(cellsForSpecial('color-bomb', colorPos, rows, cols, grid));
    add(cellsForSpecial('bomb', bombPos, rows, cols));
    return [...map.values()];
  }

  add(cellsForSpecial(a, posA, rows, cols, grid));
  add(cellsForSpecial(b, posB, rows, cols, grid));
  return [...map.values()];
}

function isStraightLine(cells: Coord[]): { horizontal: boolean; vertical: boolean } {
  const rows = new Set(cells.map((c) => c.row));
  const cols = new Set(cells.map((c) => c.col));
  return { horizontal: rows.size === 1, vertical: cols.size === 1 };
}

function findSquare(cells: Coord[]): Coord[] | null {
  if (cells.length < 4) return null;
  const set = new Set(cells.map((c) => cellKey(c.row, c.col)));
  for (const cell of cells) {
    const key = (r: number, c: number) => cellKey(r, c);
    if (
      set.has(key(cell.row, cell.col + 1)) &&
      set.has(key(cell.row + 1, cell.col)) &&
      set.has(key(cell.row + 1, cell.col + 1))
    ) {
      return [
        cell,
        { row: cell.row, col: cell.col + 1 },
        { row: cell.row + 1, col: cell.col },
        { row: cell.row + 1, col: cell.col + 1 },
      ];
    }
  }
  return null;
}

function pickSpawnCell(cells: Coord[], swapA?: Coord, swapB?: Coord): Coord {
  if (swapA && cells.some((c) => c.row === swapA.row && c.col === swapA.col)) return swapA;
  if (swapB && cells.some((c) => c.row === swapB.row && c.col === swapB.col)) return swapB;
  return cells[Math.floor(cells.length / 2)]!;
}

/** Decide which special (if any) to spawn from a matched cell cluster. */
export function classifySpecialSpawn(
  groups: MatchGroup[],
  color: TileColor,
  swapA?: Coord,
  swapB?: Coord,
): SpecialSpawn | null {
  const cells = groups.flatMap((g) => g.cells);
  const unique = new Map<string, Coord>();
  for (const cell of cells) unique.set(cellKey(cell.row, cell.col), cell);
  const cluster = [...unique.values()];
  const maxLen = Math.max(...groups.map((g) => g.length));

  if (maxLen >= 5) {
    const line = groups.find((g) => g.length >= 5);
    if (line) {
      const straight = isStraightLine(line.cells);
      if (straight.horizontal || straight.vertical) {
        return {
          coord: pickSpawnCell(line.cells, swapA, swapB),
          special: 'color-bomb',
          color,
        };
      }
    }
  }

  for (const group of groups) {
    if (group.length === 4) {
      const line = isStraightLine(group.cells);
      if (line.horizontal) {
        return {
          coord: pickSpawnCell(group.cells, swapA, swapB),
          special: 'rocket-h',
          color,
        };
      }
      if (line.vertical) {
        return {
          coord: pickSpawnCell(group.cells, swapA, swapB),
          special: 'rocket-v',
          color,
        };
      }
    }
  }

  const square = findSquare(cluster);
  if (square) {
    return {
      coord: pickSpawnCell(square, swapA, swapB),
      special: 'propeller',
      color,
    };
  }

  if (cluster.length >= 5 && !isStraightLine(cluster).horizontal && !isStraightLine(cluster).vertical) {
    return {
      coord: pickSpawnCell(cluster, swapA, swapB),
      special: 'bomb',
      color,
    };
  }

  return null;
}

export type ObjectiveContext = {
  goals: LevelGoal[];
  progress: GoalProgress;
  grassTargets?: Coord[];
};

function needsMore(goal: LevelGoal, progress: GoalProgress, kind: CollectibleKind): boolean {
  if (goal.type === 'collect' && goal.item === kind) {
    return progress.collected[kind] < goal.target;
  }
  if (goal.type === 'drop' && goal.item === kind) {
    return progress.dropped[kind] < goal.target;
  }
  return false;
}

function dropPriority(cell: Grid[0][0], ctx?: ObjectiveContext): number {
  if (!cell.drop) return 0;
  if (ctx && needsMore({ type: 'drop', target: 0, item: cell.drop }, ctx.progress, cell.drop)) {
    return 50;
  }
  return 48;
}

function collectPriority(cell: Grid[0][0], ctx?: ObjectiveContext): number {
  if (!cell.collectible) return 0;
  if (
    ctx &&
    needsMore({ type: 'collect', target: 0, item: cell.collectible }, ctx.progress, cell.collectible)
  ) {
    return 45;
  }
  return 43;
}

function grassPriority(row: number, col: number, grid: Grid, ctx?: ObjectiveContext): number {
  if (!ctx?.grassTargets?.length) return 0;
  const isTarget = ctx.grassTargets.some((t) => t.row === row && t.col === col);
  if (!isTarget || grid[row]![col]!.grass) return 0;
  return 42;
}

export function pickPropellerTarget(
  grid: Grid,
  origin: Coord,
  rows: number,
  cols: number,
  rng: { nextInt(max: number): number },
  ctx?: ObjectiveContext,
): Coord | null {
  const candidates: { coord: Coord; priority: number }[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (row === origin.row && col === origin.col) continue;
      const cell = grid[row]![col]!;
      let priority = dropPriority(cell, ctx);
      if (priority === 0) priority = collectPriority(cell, ctx);
      if (priority === 0) priority = grassPriority(row, col, grid, ctx);
      if (priority === 0 && cell.jelly) priority = 40;
      else if (priority === 0 && cell.crateLayers > 0) priority = 30;
      else if (priority === 0 && cell.iceLayers > 0) priority = 20;
      else if (priority === 0 && cell.tile) priority = 10;
      else if (priority === 0) continue;
      candidates.push({ coord: { row, col }, priority });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.priority - a.priority);
  const top = candidates[0]!.priority;
  const best = candidates.filter((c) => c.priority === top);
  return best[rng.nextInt(best.length)]!.coord;
}
