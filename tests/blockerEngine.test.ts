import { describe, expect, it } from 'vitest';
import {
  applyClearWave,
  damageAdjacentCrates,
  damageAdjacentIce,
} from '../src/core/blockerEngine';
import { createEmptyGrid } from '../src/core/grid';
import { makeTile } from '../src/core/tile';

describe('blockerEngine', () => {
  it('clears jelly when a cell is hit', () => {
    const grid = createEmptyGrid(3, 3);
    grid[1]![1]!.jelly = true;
    grid[1]![1]!.tile = makeTile('ruby');

    const result = applyClearWave(grid, [{ row: 1, col: 1 }]);
    expect(result.clearedJelly).toBe(1);
    expect(grid[1]![1]!.jelly).toBe(false);
    expect(grid[1]![1]!.tile).toBeNull();
  });

  it('clears a 1-layer iced tile in one direct hit', () => {
    const grid = createEmptyGrid(3, 3);
    grid[1]![1]!.tile = makeTile('ruby');
    grid[1]![1]!.iceLayers = 1;

    applyClearWave(grid, [{ row: 1, col: 1 }]);
    expect(grid[1]![1]!.iceLayers).toBe(0);
    expect(grid[1]![1]!.tile).toBeNull();
  });

  it('clears a 2-layer iced tile in two direct hits', () => {
    const grid = createEmptyGrid(3, 3);
    grid[1]![1]!.tile = makeTile('ruby');
    grid[1]![1]!.iceLayers = 2;

    applyClearWave(grid, [{ row: 1, col: 1 }]);
    expect(grid[1]![1]!.iceLayers).toBe(1);
    expect(grid[1]![1]!.tile).not.toBeNull();

    applyClearWave(grid, [{ row: 1, col: 1 }]);
    expect(grid[1]![1]!.iceLayers).toBe(0);
    expect(grid[1]![1]!.tile).toBeNull();
  });

  it('damages adjacent crates on a match', () => {
    const grid = createEmptyGrid(3, 3);
    grid[1]![0]!.tile = makeTile('ruby');
    grid[1]![1]!.crateLayers = 1;

    damageAdjacentCrates(grid, [{ row: 1, col: 0 }]);
    expect(grid[1]![1]!.crateLayers).toBe(0);
  });

  it('damages adjacent ice on a match', () => {
    const grid = createEmptyGrid(3, 3);
    grid[1]![0]!.tile = makeTile('ruby');
    grid[1]![1]!.tile = makeTile('sapphire');
    grid[1]![1]!.iceLayers = 2;

    damageAdjacentIce(grid, [{ row: 1, col: 0 }]);
    expect(grid[1]![1]!.iceLayers).toBe(1);
    expect(grid[1]![1]!.tile).not.toBeNull();
  });
});
