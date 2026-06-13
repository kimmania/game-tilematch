import { describe, expect, it } from 'vitest';
import { createGameState, goalsMet, trySwap } from '../src/core/board';
import { pickPropellerTarget } from '../src/core/specialEngine';
import { createEmptyGrid } from '../src/core/grid';
import { makeTile } from '../src/core/tile';
import { SeededRng } from '../src/core/rng';
import { emptyCollectibleCounts } from '../src/core/types';
import type { LevelDef } from '../src/core/types';

describe('collect and drop goals', () => {
  const collectLevel: LevelDef = {
    id: 900,
    name: 'Test collect',
    rows: 5,
    cols: 5,
    moves: 10,
    colors: 3,
    seed: 42,
    goals: [
      { type: 'score', target: 100 },
      { type: 'collect', target: 1, item: 'cherry' },
    ],
    stars: [100, 200, 300],
    layout: {
      collect: [{ row: 2, col: 2, kind: 'cherry' }],
    },
  };

  it('tracks collected cherries toward the goal', () => {
    const state = createGameState(collectLevel);
    state.grid[2]![2]!.tile = makeTile('ruby');
    state.grid[2]![1]!.tile = makeTile('ruby');
    state.grid[2]![3]!.tile = makeTile('sapphire');

    const result = trySwap(state, { row: 2, col: 1 }, { row: 2, col: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.progress.collected.cherry).toBeGreaterThanOrEqual(1);
  });

  it('tracks dropped cherries at the bottom row', () => {
    const dropLevel: LevelDef = {
      ...collectLevel,
      goals: [
        { type: 'score', target: 100 },
        { type: 'drop', target: 1, item: 'cherry' },
      ],
      layout: {
        drops: [{ row: 0, col: 2, kind: 'cherry' }],
      },
    };

    const state = createGameState(dropLevel);
    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        if (row === 0 && col === 2) continue;
        state.grid[row]![col]!.tile = makeTile('amber');
      }
    }
    state.grid[0]![2]!.drop = 'cherry';
    state.grid[0]![2]!.tile = makeTile('ruby');
    state.grid[1]![2]!.tile = null;
    state.grid[2]![2]!.tile = null;
    state.grid[3]![2]!.tile = null;
    state.grid[4]![2]!.tile = null;

    const result = trySwap(state, { row: 0, col: 1 }, { row: 0, col: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.progress.dropped.cherry).toBeGreaterThanOrEqual(1);
  });
});

describe('propeller objective targeting', () => {
  it('prefers drops over jelly when drop goal is unmet', () => {
    const grid = createEmptyGrid(5, 5);
    grid[1]![1]!.jelly = true;
    grid[1]![1]!.tile = makeTile('ruby');
    grid[3]![3]!.drop = 'cherry';
    grid[3]![3]!.tile = makeTile('emerald');

    const target = pickPropellerTarget(
      grid,
      { row: 0, col: 0 },
      5,
      5,
      new SeededRng(1),
      {
        goals: [{ type: 'drop', target: 2, item: 'cherry' }],
        progress: {
          score: 0,
          jellyCleared: 0,
          collected: emptyCollectibleCounts(),
          dropped: { cherry: 0, coin: 0 },
        },
      },
    );

    expect(target).toEqual({ row: 3, col: 3 });
  });
});
