/** Deterministic PRNG (mulberry32). */
export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  static fromState(state: number): SeededRng {
    const rng = new SeededRng(0);
    rng.state = state >>> 0;
    return rng;
  }

  getState(): number {
    return this.state;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [0, max). */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.nextInt(items.length)]!;
  }
}
