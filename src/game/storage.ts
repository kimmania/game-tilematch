import type { GameState } from '../core/types';

export const PROGRESS_STORAGE_KEY = 'tilematch-progress';

const STORAGE_KEY = PROGRESS_STORAGE_KEY;

export type SavedProgress = {
  highestUnlocked: number;
  currentLevel: number;
  completedLevels?: number[];
  bestStars?: Record<string, number>;
  bestScore?: Record<string, number>;
};

export function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { highestUnlocked: 1, currentLevel: 1 };
    const parsed = JSON.parse(raw) as SavedProgress;
    if (
      typeof parsed.highestUnlocked === 'number' &&
      typeof parsed.currentLevel === 'number' &&
      parsed.highestUnlocked >= 1 &&
      parsed.currentLevel >= 1
    ) {
      return parsed;
    }
  } catch {
    /* ignore corrupt data */
  }
  return { highestUnlocked: 1, currentLevel: 1 };
}

export function saveProgress(progress: SavedProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export type SessionSnapshot = Pick<
  GameState,
  | 'grid'
  | 'movesLeft'
  | 'score'
  | 'status'
  | 'rngState'
  | 'palette'
  | 'progress'
  | 'totalJelly'
  | 'grassTargets'
> & {
  rows: number;
  cols: number;
  goals: GameState['goals'];
  stars: GameState['stars'];
};

export function saveSession(levelId: number, state: GameState): void {
  const key = `${STORAGE_KEY}:level:${levelId}`;
  const snapshot: SessionSnapshot = {
    rows: state.rows,
    cols: state.cols,
    grid: state.grid,
    palette: state.palette,
    movesLeft: state.movesLeft,
    score: state.score,
    status: state.status,
    rngState: state.rngState,
    goals: state.goals,
    stars: state.stars,
    progress: state.progress,
    totalJelly: state.totalJelly,
    grassTargets: state.grassTargets,
  };
  localStorage.setItem(key, JSON.stringify(snapshot));
}

export function loadSession(levelId: number): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:level:${levelId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SessionSnapshot;
  } catch {
    return null;
  }
}

export function clearSession(levelId: number): void {
  localStorage.removeItem(`${STORAGE_KEY}:level:${levelId}`);
}

export function clearAllSessions(): void {
  const prefix = `${STORAGE_KEY}:level:`;
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function getCompletedLevelIds(progress: SavedProgress): Set<number> {
  return new Set(progress.completedLevels ?? []);
}

export function getBestStars(progress: SavedProgress, levelId: number): number | undefined {
  return progress.bestStars?.[String(levelId)];
}

export function getBestScore(progress: SavedProgress, levelId: number): number | undefined {
  return progress.bestScore?.[String(levelId)];
}

export function recordBestResult(
  progress: SavedProgress,
  levelId: number,
  stars: number,
  score: number,
): SavedProgress {
  const key = String(levelId);
  const bestStars = { ...progress.bestStars };
  const bestScore = { ...progress.bestScore };
  const prevStars = bestStars[key] ?? 0;
  const prevScore = bestScore[key] ?? 0;

  if (stars > prevStars) bestStars[key] = stars;
  if (score > prevScore) bestScore[key] = score;

  return { ...progress, bestStars, bestScore };
}

export function unlockNextLevel(progress: SavedProgress, levelId: number): SavedProgress {
  const completed = new Set(progress.completedLevels ?? []);
  completed.add(levelId);
  const highestUnlocked = Math.max(progress.highestUnlocked, levelId + 1);
  return {
    ...progress,
    completedLevels: [...completed],
    highestUnlocked,
    currentLevel: levelId,
  };
}

export function findInProgressLevelIds(): Set<number> {
  const prefix = `${STORAGE_KEY}:level:`;
  const ids = new Set<number>();
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const id = Number(key.slice(prefix.length));
    if (Number.isInteger(id)) ids.add(id);
  }
  return ids;
}

export function findResumeLevel(
  levelIds: number[],
  progress: SavedProgress,
): number | undefined {
  const inProgress = findInProgressLevelIds();
  for (const id of levelIds) {
    if (inProgress.has(id) && id <= progress.highestUnlocked) return id;
  }
  return undefined;
}

export function formatLevelResult(
  stars: number | undefined,
  score: number | undefined,
): string | null {
  if (stars === undefined && score === undefined) return null;
  const starText = stars ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : '';
  if (score !== undefined && starText) return `${starText} · ${score.toLocaleString()}`;
  if (score !== undefined) return score.toLocaleString();
  return starText || null;
}
