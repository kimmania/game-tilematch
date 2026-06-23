import { describe, expect, it } from 'vitest';
import { createGameState, trySwap, resolveStatus, starsEarned, goalsMet } from '../src/core/board';
import type { Coord, GameState, LevelDef } from '../src/core/types';

const sampleLevel: LevelDef = {
  id: 99,
  name: 'Integration test',
  rows: 6,
  cols: 6,
  moves: 10,
  colors: 4,
  seed: 4242,
  goals: [{ type: 'score', target: 500 }],
  stars: [500, 900, 1400],
};

function findAnyValidSwap(state: GameState): [Coord, Coord] | null {
  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      for (const [dr, dc] of [
        [0, 1] as const,
        [1, 0] as const,
      ]) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= state.rows || nc >= state.cols) continue;
        const a: Coord = { row, col };
        const b: Coord = { row: nr, col: nc };
        const result = trySwap(state, a, b);
        if (result.ok) return [a, b];
      }
    }
  }
  return null;
}

describe('integration', () => {
  it('creates a board with no initial matches and at least one valid swap', () => {
    const state = createGameState(sampleLevel);
    expect(state.status).toBe('playing');
    expect(state.movesLeft).toBe(sampleLevel.moves);
    expect(state.score).toBe(0);
    expect(findAnyValidSwap(state)).not.toBeNull();
  });

  it('rejects non-adjacent, blocked, and no-match swaps', () => {
    const state = createGameState(sampleLevel);

    const nonAdjacent = trySwap(state, { row: 0, col: 0 }, { row: 2, col: 2 });
    expect(nonAdjacent.ok).toBe(false);
    if (!nonAdjacent.ok) expect(nonAdjacent.reason).toBe('not-adjacent');

    const sameCell = trySwap(state, { row: 1, col: 1 }, { row: 1, col: 1 });
    expect(sameCell.ok).toBe(false);
    if (!sameCell.ok) expect(sameCell.reason).toBe('not-adjacent');
  });

  it('resolves a valid swap into cascade steps and consumes a move', () => {
    const state = createGameState(sampleLevel);
    const swap = findAnyValidSwap(state);
    expect(swap).not.toBeNull();
    if (!swap) return;

    const beforeMoves = state.movesLeft;
    const result = trySwap(state, swap[0], swap[1]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.movesLeft).toBe(beforeMoves - 1);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.state.score).toBeGreaterThan(0);
  });

  it('awards stars and resolves to won when score goal is exceeded', () => {
    const state = createGameState({
      ...sampleLevel,
      goals: [{ type: 'score', target: 1 }],
      stars: [1, 50, 100],
    });
    const swap = findAnyValidSwap(state);
    expect(swap).not.toBeNull();
    if (!swap) return;

    const result = trySwap(state, swap[0], swap[1]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(goalsMet(result.state)).toBe(true);
    expect(resolveStatus(result.state)).toBe('won');
    expect(starsEarned(result.state)).toBeGreaterThanOrEqual(1);
  });
});
