import type { LevelChapter } from '../core/levels';
import {
  formatLevelResult,
  getBestScore,
  getBestStars,
  type SavedProgress,
} from '../game/storage';

export type LevelCellStatus = 'locked' | 'current' | 'completed' | 'progress' | 'open';

export type LevelPickerOptions = {
  levelIds: number[];
  chapters: LevelChapter[];
  currentLevel: number;
  highestUnlocked: number;
  completedLevelIds: Set<number>;
  inProgressLevelIds: Set<number>;
  progress: SavedProgress;
  onSelect: (levelId: number) => void;
  onClose: () => void;
};

export function resolveLevelCellStatus(
  levelId: number,
  options: Pick<
    LevelPickerOptions,
    'currentLevel' | 'highestUnlocked' | 'completedLevelIds' | 'inProgressLevelIds'
  >,
): LevelCellStatus {
  if (levelId > options.highestUnlocked) return 'locked';
  if (levelId === options.currentLevel) return 'current';
  if (options.completedLevelIds.has(levelId)) return 'completed';
  if (options.inProgressLevelIds.has(levelId)) return 'progress';
  return 'open';
}

function statusMark(status: LevelCellStatus): string {
  switch (status) {
    case 'completed':
      return '✓';
    case 'progress':
      return '•';
    case 'locked':
      return '🔒';
    default:
      return '';
  }
}

function buildLevelCell(id: number, options: LevelPickerOptions): HTMLButtonElement {
  const status = resolveLevelCellStatus(id, options);
  const locked = status === 'locked';
  const stars = getBestStars(options.progress, id);
  const score = getBestScore(options.progress, id);
  const resultText = formatLevelResult(stars, score);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `level-cell level-cell-${status}`;
  btn.dataset.levelId = String(id);
  btn.setAttribute('aria-label', `Level ${id}${locked ? ', locked' : ''}`);
  if (locked) btn.disabled = true;

  const mark = document.createElement('span');
  mark.className = 'level-cell-mark';
  mark.textContent = statusMark(status);

  const num = document.createElement('span');
  num.className = 'level-cell-num';
  num.textContent = String(id);

  btn.append(mark, num);

  if (resultText) {
    const result = document.createElement('span');
    result.className = 'level-cell-score';
    result.textContent = resultText;
    btn.appendChild(result);
  }

  btn.addEventListener('click', () => options.onSelect(id));
  return btn;
}

let overlay: HTMLElement | null = null;

export function openLevelPicker(options: LevelPickerOptions): void {
  closeLevelPicker();

  overlay = document.createElement('div');
  overlay.className = 'level-picker-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Level picker');

  const panel = document.createElement('div');
  panel.className = 'level-picker-panel';

  const header = document.createElement('div');
  header.className = 'level-picker-header';

  const title = document.createElement('h2');
  title.className = 'level-picker-title';
  title.textContent = 'Levels';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => options.onClose());

  header.append(title, closeBtn);
  panel.appendChild(header);

  for (const chapter of options.chapters) {
    const chapterTitle = document.createElement('h3');
    chapterTitle.className = 'level-picker-chapter';
    chapterTitle.textContent = chapter.name;
    panel.appendChild(chapterTitle);

    const grid = document.createElement('div');
    grid.className = 'level-picker-grid';
    grid.setAttribute('role', 'listbox');

    for (const id of chapter.levelIds) {
      grid.appendChild(buildLevelCell(id, options));
    }

    panel.appendChild(grid);
  }

  overlay.appendChild(panel);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) options.onClose();
  });

  document.body.appendChild(overlay);
}

export function closeLevelPicker(): void {
  overlay?.remove();
  overlay = null;
}

export function isLevelPickerOpen(): boolean {
  return overlay !== null;
}
