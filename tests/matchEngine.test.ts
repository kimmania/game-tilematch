import { describe, expect, it } from 'vitest';
import { createEmptyGrid } from '../src/core/grid';
import { findMatchGroups, hasAnyMatch, scoreForStep } from '../src/core/matchEngine';
import { makeTile } from '../src/core/tile';

describe('matchEngine', () => {
  it('finds horizontal and vertical matches of 3+', () => {
    const grid = createEmptyGrid(5, 5);
    grid[2]![1]!.tile = makeTile('ruby');
    grid[2]![2]!.tile = makeTile('ruby');
    grid[2]![3]!.tile = makeTile('ruby');
    grid[0]![4]!.tile = makeTile('emerald');
    grid[1]![4]!.tile = makeTile('emerald');
    grid[2]![4]!.tile = makeTile('emerald');

    const groups = findMatchGroups(grid);
    expect(groups).toHaveLength(2);
    expect(hasAnyMatch(grid)).toBe(true);
  });

  it('scores matches with cascade multiplier', () => {
    const groups = [{ cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], length: 3 }];
    expect(scoreForStep(3, 1)).toBe(180);
    expect(scoreForStep(3, 2)).toBe(270);
    expect(scoreForStep(3, 3)).toBe(360);
  });
});
