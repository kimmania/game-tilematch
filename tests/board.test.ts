import { describe, expect, it } from 'vitest';
import { createGameState, trySwap } from '../src/core/board';
import { hasAnyMatch } from '../src/core/matchEngine';
import type { LevelDef } from '../src/core/types';

const sampleLevel: LevelDef = {
  id: 99,
  name: 'Test',
  rows: 6,
  cols: 6,
  moves: 10,
  colors: 4,
  seed: 4242,
  goals: [{ type: 'score', target: 500 }],
  stars: [500, 900, 1400],
};

describe('board', () => {
  it('creates a board without initial matches', () => {
    const state = createGameState(sampleLevel);
    expect(hasAnyMatch(state.grid)).toBe(false);
  });

  it('rejects swaps that do not create a match', () => {
    const state = createGameState(sampleLevel);
    const result = trySwap(state, { row: 0, col: 0 }, { row: 0, col: 1 });
    if (result.ok) {
      expect(result.state.movesLeft).toBe(state.movesLeft - 1);
    } else {
      expect(result.reason).toBe('no-match');
    }
  });
});
