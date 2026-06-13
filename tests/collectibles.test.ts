import { describe, expect, it } from 'vitest';
import {
  applyDropGravity,
  collectExitedDrops,
  collectFromHits,
} from '../src/core/collectibles';
import { createEmptyGrid, applyGravity } from '../src/core/grid';
import { makeTile } from '../src/core/tile';

describe('collectibles', () => {
  it('collects static items on hit and adjacent cells', () => {
    const grid = createEmptyGrid(5, 5);
    grid[2]![2]!.tile = makeTile('ruby');
    grid[2]![2]!.collectible = 'cherry';
    grid[2]![3]!.collectible = 'coin';

    const counts = collectFromHits(grid, [{ row: 2, col: 2 }]);
    expect(counts.cherry).toBe(1);
    expect(counts.coin).toBe(1);
    expect(grid[2]![2]!.collectible).toBeNull();
    expect(grid[2]![3]!.collectible).toBeNull();
  });

  it('drops fall through empty cells and collect at bottom', () => {
    const grid = createEmptyGrid(5, 5);
    grid[1]![2]!.drop = 'cherry';

    applyDropGravity(grid);
    expect(grid[4]![2]!.drop).toBe('cherry');
    expect(grid[1]![2]!.drop).toBeNull();

    const counts = collectExitedDrops(grid);
    expect(counts.cherry).toBe(1);
    expect(grid[4]![2]!.drop).toBeNull();
  });

  it('drops rest on the next tile below when orphaned', () => {
    const grid = createEmptyGrid(5, 5);
    grid[1]![2]!.drop = 'cherry';
    grid[3]![2]!.tile = makeTile('emerald');

    applyDropGravity(grid);
    expect(grid[3]![2]!.drop).toBe('cherry');
    expect(grid[1]![2]!.drop).toBeNull();
  });

  it('drops move with their tile during tile gravity', () => {
    const grid = createEmptyGrid(5, 5);
    grid[1]![2]!.drop = 'cherry';
    grid[1]![2]!.tile = makeTile('ruby');

    applyGravity(grid);
    expect(grid[4]![2]!.drop).toBe('cherry');
    expect(grid[4]![2]!.tile?.color).toBe('ruby');
    expect(grid[1]![2]!.drop).toBeNull();
  });

  it('drops rest on tiles until the path opens', () => {
    const grid = createEmptyGrid(5, 5);
    grid[1]![2]!.drop = 'cherry';
    grid[2]![2]!.tile = makeTile('emerald');

    applyDropGravity(grid);
    expect(grid[2]![2]!.drop).toBe('cherry');

    grid[2]![2]!.tile = null;
    applyDropGravity(grid);
    expect(grid[4]![2]!.drop).toBe('cherry');
  });
});