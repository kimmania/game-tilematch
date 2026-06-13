import type { LevelDef } from './types';
import { ALL_TILE_COLORS } from './tileColors';

export function validateLevel(level: LevelDef, expectedId?: number): void {
  if (expectedId !== undefined && level.id !== expectedId) {
    throw new Error(`id mismatch: file is ${level.id}, expected ${expectedId}`);
  }

  if (!level.name || typeof level.name !== 'string') {
    throw new Error('name is required');
  }

  if (!Number.isInteger(level.rows) || level.rows < 5 || level.rows > 10) {
    throw new Error('rows must be 5–10');
  }

  if (!Number.isInteger(level.cols) || level.cols < 5 || level.cols > 10) {
    throw new Error('cols must be 5–10');
  }

  if (!Number.isInteger(level.moves) || level.moves < 1) {
    throw new Error('moves must be a positive integer');
  }

  if (
    !Number.isInteger(level.colors) ||
    level.colors < 3 ||
    level.colors > ALL_TILE_COLORS.length
  ) {
    throw new Error(`colors must be 3–${ALL_TILE_COLORS.length}`);
  }

  if (!Number.isInteger(level.seed)) {
    throw new Error('seed must be an integer');
  }

  if (!Array.isArray(level.goals) || level.goals.length === 0) {
    throw new Error('goals must be a non-empty array');
  }

  for (const goal of level.goals) {
    if (goal.type !== 'score') {
      throw new Error(`unsupported goal type: ${(goal as { type: string }).type}`);
    }
    if (!Number.isInteger(goal.target) || goal.target < 1) {
      throw new Error('score goal target must be a positive integer');
    }
  }

  if (!Array.isArray(level.stars) || level.stars.length !== 3) {
    throw new Error('stars must be [1★, 2★, 3★] thresholds');
  }

  const [one, two, three] = level.stars;
  const target = level.goals.find((g) => g.type === 'score')!.target;

  if (one !== target) {
    throw new Error('stars[0] must equal the score goal target');
  }

  if (!(one < two && two < three)) {
    throw new Error('stars must be strictly increasing');
  }
}
