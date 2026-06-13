import { describe, expect, it } from 'vitest';
import { SeededRng } from '../src/core/rng';

describe('SeededRng', () => {
  it('is deterministic for the same seed', () => {
    const a = new SeededRng(42);
    const b = new SeededRng(42);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('restores from saved state', () => {
    const rng = new SeededRng(99);
    rng.next();
    rng.next();
    const saved = rng.getState();
    const expected = rng.next();

    const restored = SeededRng.fromState(saved);
    expect(restored.next()).toBe(expected);
  });
});
