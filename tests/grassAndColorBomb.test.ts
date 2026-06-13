import { describe, expect, it } from 'vitest';
import { spreadGrassFromHits, countGrassOnTargets } from '../src/core/grassEngine';
import { createEmptyGrid } from '../src/core/grid';
import { cellsForSpecial } from '../src/core/specialEngine';
import { makeTile } from '../src/core/tile';

describe('grassEngine', () => {
  it('spreads grass to matched cells when a match touches grass', () => {
    const grid = createEmptyGrid(5, 5);
    grid[2]![2]!.grass = true;
    grid[2]![3]!.tile = makeTile('ruby');
    grid[2]![4]!.tile = makeTile('ruby');
    grid[3]![4]!.tile = makeTile('ruby');

    spreadGrassFromHits(grid, [
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 3, col: 4 },
    ]);

    expect(grid[2]![3]!.grass).toBe(true);
    expect(grid[2]![4]!.grass).toBe(true);
    expect(grid[3]![4]!.grass).toBe(true);
  });

  it('does not spread when match is far from grass', () => {
    const grid = createEmptyGrid(5, 5);
    grid[0]![0]!.grass = true;
    grid[4]![4]!.tile = makeTile('ruby');

    spreadGrassFromHits(grid, [{ row: 4, col: 4 }]);
    expect(grid[4]![4]!.grass).toBe(false);
  });

  it('counts covered grass targets', () => {
    const grid = createEmptyGrid(5, 5);
    grid[1]![1]!.grass = true;
    grid[2]![2]!.grass = false;
    const targets = [
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ];
    expect(countGrassOnTargets(grid, targets)).toBe(1);
  });
});

describe('color bomb', () => {
  it('clears all tiles of the same color', () => {
    const grid = createEmptyGrid(5, 5);
    grid[2]![2]!.tile = makeTile('ruby', 'color-bomb');
    grid[1]![1]!.tile = makeTile('ruby');
    grid[3]![3]!.tile = makeTile('sapphire');

    const cells = cellsForSpecial('color-bomb', { row: 2, col: 2 }, 5, 5, grid);
    expect(cells).toHaveLength(2);
    expect(cells.some((c) => c.row === 1 && c.col === 1)).toBe(true);
    expect(cells.some((c) => c.row === 2 && c.col === 2)).toBe(true);
  });
});
