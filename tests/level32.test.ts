import { describe, expect, it } from 'vitest';
import { createGameState, trySwap } from '../src/core/board';
import { makeTile } from '../src/core/tile';
import level32 from '../public/levels/32.json';

function dropAt(state: ReturnType<typeof createGameState>, row: number, col: number) {
  return state.grid[row]![col]!.drop;
}

function lowestDropRow(state: ReturnType<typeof createGameState>, col: number): number | null {
  for (let row = state.rows - 1; row >= 0; row -= 1) {
    if (state.grid[row]![col]!.drop) return row;
  }
  return null;
}

describe('level 32 cherry drops', () => {
  it('cherries move down the board when tiles below are cleared', () => {
    const state = createGameState(level32 as typeof level32);
    expect(dropAt(state, 1, 2)).toBe('cherry');

    const result = trySwap(state, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(lowestDropRow(result.state, 2)).toBeGreaterThan(1);
  });

  it('cherry falls when cleared as the middle tile in a vertical match', () => {
    const state = createGameState(level32 as typeof level32);
    const col = 2;
    state.grid[1]![col]!.tile = makeTile('ruby');
    state.grid[2]![col]!.tile = makeTile('ruby');
    state.grid[2]![col]!.drop = 'cherry';
    state.grid[3]![col]!.tile = makeTile('ruby');
    state.grid[4]![col]!.tile = makeTile('sapphire');

    const result = trySwap(state, { row: 1, col: 1 }, { row: 1, col: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(dropAt(result.state, 2, col)).toBeNull();
    expect(lowestDropRow(result.state, col)).toBeGreaterThan(2);
  });
});
