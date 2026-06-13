import type { CollectibleKind, LevelDef } from './types';
import { ALL_TILE_COLORS } from './tileColors';

const COLLECTIBLE_KINDS: CollectibleKind[] = ['cherry', 'coin'];

function jellyCount(level: LevelDef): number {
  return level.layout?.jelly?.length ?? 0;
}

function collectCount(level: LevelDef, kind: CollectibleKind): number {
  return (level.layout?.collect ?? []).filter((item) => item.kind === kind).length;
}

function dropCount(level: LevelDef, kind: CollectibleKind): number {
  return (level.layout?.drops ?? []).filter((item) => item.kind === kind).length;
}

function grassTargetCount(level: LevelDef): number {
  return level.layout?.grass?.length ?? 0;
}

function isCollectibleKind(value: unknown): value is CollectibleKind {
  return value === 'cherry' || value === 'coin';
}

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

  let hasScoreGoal = false;

  for (const goal of level.goals) {
    if (goal.type === 'score') {
      hasScoreGoal = true;
      if (!Number.isInteger(goal.target) || goal.target < 1) {
        throw new Error('score goal target must be a positive integer');
      }
    } else if (goal.type === 'jelly') {
      if (!Number.isInteger(goal.target) || goal.target < 1) {
        throw new Error('jelly goal target must be a positive integer');
      }
      const available = jellyCount(level);
      if (goal.target > available) {
        throw new Error(`jelly goal ${goal.target} exceeds layout jelly cells (${available})`);
      }
    } else if (goal.type === 'collect') {
      if (!isCollectibleKind(goal.item)) {
        throw new Error('collect goal item must be cherry or coin');
      }
      if (!Number.isInteger(goal.target) || goal.target < 1) {
        throw new Error('collect goal target must be a positive integer');
      }
      const available = collectCount(level, goal.item);
      if (goal.target > available) {
        throw new Error(
          `collect goal ${goal.target} exceeds layout ${goal.item} items (${available})`,
        );
      }
    } else if (goal.type === 'drop') {
      if (!isCollectibleKind(goal.item)) {
        throw new Error('drop goal item must be cherry or coin');
      }
      if (!Number.isInteger(goal.target) || goal.target < 1) {
        throw new Error('drop goal target must be a positive integer');
      }
      const available = dropCount(level, goal.item);
      if (goal.target > available) {
        throw new Error(
          `drop goal ${goal.target} exceeds layout ${goal.item} drops (${available})`,
        );
      }
    } else if (goal.type === 'grass') {
      if (!Number.isInteger(goal.target) || goal.target < 1) {
        throw new Error('grass goal target must be a positive integer');
      }
      const available = grassTargetCount(level);
      if (goal.target > available) {
        throw new Error(`grass goal ${goal.target} exceeds layout grass cells (${available})`);
      }
      if ((level.layout?.grassSeeds?.length ?? 0) < 1) {
        throw new Error('grass levels need at least one grassSeeds cell');
      }
    } else {
      throw new Error(`unsupported goal type: ${(goal as { type: string }).type}`);
    }
  }

  if (!hasScoreGoal) {
    throw new Error('levels must include at least one score goal');
  }

  if (!Array.isArray(level.stars) || level.stars.length !== 3) {
    throw new Error('stars must be [1★, 2★, 3★] thresholds');
  }

  const [one, two, three] = level.stars;
  const scoreTarget = level.goals.find((g) => g.type === 'score')!.target;

  if (one !== scoreTarget) {
    throw new Error('stars[0] must equal the score goal target');
  }

  if (!(one < two && two < three)) {
    throw new Error('stars must be strictly increasing');
  }

  for (const crate of level.layout?.crates ?? []) {
    if (
      !Number.isInteger(crate.row) ||
      !Number.isInteger(crate.col) ||
      crate.row < 0 ||
      crate.row >= level.rows ||
      crate.col < 0 ||
      crate.col >= level.cols
    ) {
      throw new Error('crate coordinates out of bounds');
    }
    if (!Number.isInteger(crate.layers) || crate.layers < 1 || crate.layers > 2) {
      throw new Error('crate layers must be 1–2');
    }
  }

  for (const ice of level.layout?.ice ?? []) {
    if (
      !Number.isInteger(ice.row) ||
      !Number.isInteger(ice.col) ||
      ice.row < 0 ||
      ice.row >= level.rows ||
      ice.col < 0 ||
      ice.col >= level.cols
    ) {
      throw new Error('ice coordinates out of bounds');
    }
    if (!Number.isInteger(ice.layers) || ice.layers < 1 || ice.layers > 2) {
      throw new Error('ice layers must be 1–2');
    }
  }

  for (const jelly of level.layout?.jelly ?? []) {
    if (
      !Number.isInteger(jelly.row) ||
      !Number.isInteger(jelly.col) ||
      jelly.row < 0 ||
      jelly.row >= level.rows ||
      jelly.col < 0 ||
      jelly.col >= level.cols
    ) {
      throw new Error('jelly coordinates out of bounds');
    }
  }

  for (const item of level.layout?.collect ?? []) {
    if (
      !Number.isInteger(item.row) ||
      !Number.isInteger(item.col) ||
      item.row < 0 ||
      item.row >= level.rows ||
      item.col < 0 ||
      item.col >= level.cols
    ) {
      throw new Error('collect coordinates out of bounds');
    }
    if (!isCollectibleKind(item.kind)) {
      throw new Error('collect kind must be cherry or coin');
    }
  }

  for (const item of level.layout?.drops ?? []) {
    if (
      !Number.isInteger(item.row) ||
      !Number.isInteger(item.col) ||
      item.row < 0 ||
      item.row >= level.rows ||
      item.col < 0 ||
      item.col >= level.cols
    ) {
      throw new Error('drop coordinates out of bounds');
    }
    if (!isCollectibleKind(item.kind)) {
      throw new Error('drop kind must be cherry or coin');
    }
  }

  for (const cell of [...(level.layout?.grass ?? []), ...(level.layout?.grassSeeds ?? [])]) {
    if (
      !Number.isInteger(cell.row) ||
      !Number.isInteger(cell.col) ||
      cell.row < 0 ||
      cell.row >= level.rows ||
      cell.col < 0 ||
      cell.col >= level.cols
    ) {
      throw new Error('grass coordinates out of bounds');
    }
  }
}

export { COLLECTIBLE_KINDS };
