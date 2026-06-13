import { describe, expect, it } from 'vitest';
import { createGameState } from '../src/core/board';
import { damageAdjacentIce } from '../src/core/blockerEngine';
import type { LevelDef } from '../src/core/types';

const level14: LevelDef = {
  id: 14,
  name: 'Frozen crates',
  rows: 8,
  cols: 8,
  moves: 20,
  colors: 5,
  seed: 2014,
  goals: [
    { type: 'score', target: 4500 },
    { type: 'jelly', target: 8 },
  ],
  stars: [4500, 6500, 9000],
  layout: {
    jelly: [
      { row: 1, col: 3 },
      { row: 1, col: 4 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 5, col: 3 },
      { row: 5, col: 4 },
      { row: 6, col: 3 },
      { row: 6, col: 4 },
    ],
    crates: [
      { row: 3, col: 3, layers: 1 },
      { row: 3, col: 4, layers: 1 },
    ],
    ice: [
      { row: 5, col: 2, layers: 1 },
      { row: 5, col: 5, layers: 2 },
    ],
  },
};

describe('level 14 ice', () => {
  it('starts with ice on both flank cells', () => {
    const state = createGameState(level14);
    expect(state.grid[5]![2]!.iceLayers).toBe(1);
    expect(state.grid[5]![5]!.iceLayers).toBe(2);
  });

  it('chips right ice when matching on adjacent jelly column', () => {
    const state = createGameState(level14);
    damageAdjacentIce(state.grid, [{ row: 5, col: 4 }]);
    expect(state.grid[5]![5]!.iceLayers).toBe(1);
  });

  it('chips left ice when matching on adjacent jelly column', () => {
    const state = createGameState(level14);
    damageAdjacentIce(state.grid, [{ row: 5, col: 3 }]);
    expect(state.grid[5]![2]!.iceLayers).toBe(0);
  });
});
