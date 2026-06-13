export type TutorialId = 'basics' | 'rocket' | 'jelly' | 'crate-ice' | 'collect' | 'drop';

const STORAGE_KEY = 'tilematch-tutorial-dismissed';

function readDismissed(): Set<TutorialId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as TutorialId[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeDismissed(ids: Set<TutorialId>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable */
  }
}

export function isMechanicDismissed(id: TutorialId): boolean {
  return readDismissed().has(id);
}

export function dismissMechanic(id: TutorialId): void {
  const ids = readDismissed();
  ids.add(id);
  writeDismissed(ids);
}

export function tutorialForLevel(levelId: number): TutorialId | null {
  switch (levelId) {
    case 1:
      return 'basics';
    case 11:
      return 'rocket';
    case 13:
      return 'jelly';
    case 14:
      return 'crate-ice';
    case 31:
      return 'collect';
    case 32:
      return 'drop';
    default:
      return null;
  }
}

export function shouldShowTutorial(levelId: number): TutorialId | null {
  const id = tutorialForLevel(levelId);
  if (!id || isMechanicDismissed(id)) return null;
  return id;
}

export function clearTutorialDismissals(): void {
  localStorage.removeItem(STORAGE_KEY);
}
