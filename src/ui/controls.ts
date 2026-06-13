export function bindControls(handlers: {
  onRestart: () => void;
  onNext: () => void;
  onPrev: () => void;
  onLevels: () => void;
}): void {
  document.getElementById('restart')?.addEventListener('click', handlers.onRestart);
  document.getElementById('next-level')?.addEventListener('click', handlers.onNext);
  document.getElementById('prev-level')?.addEventListener('click', handlers.onPrev);
  document.getElementById('levels-btn')?.addEventListener('click', handlers.onLevels);
  document.getElementById('level-meta')?.addEventListener('click', handlers.onLevels);
}

export function updateHeader(levelName: string, levelId: number, total: number): void {
  const title = document.getElementById('level-title');
  const meta = document.getElementById('level-meta');
  if (title) title.textContent = levelName;
  if (meta) meta.textContent = `Level ${levelId} of ${total}`;
}

export function showWinPanel(show: boolean, message = 'Level cleared!'): void {
  const panel = document.getElementById('win-panel');
  const banner = document.getElementById('win-banner');
  if (panel) panel.classList.toggle('hidden', !show);
  if (banner) banner.textContent = message;
}

export function setMovesLeft(moves: number): void {
  const el = document.getElementById('move-counter');
  if (el) el.textContent = `Moves left: ${moves}`;
}

export function setGoalsHud(text: string): void {
  const el = document.getElementById('score-counter');
  if (el) el.textContent = text;
}

export function setStarsHud(thresholds: [number, number, number], score: number): void {
  const el = document.getElementById('stars-hud');
  if (!el) return;
  const filled = starsEarnedFromScore(score, thresholds);
  el.textContent = `${'★'.repeat(filled)}${'☆'.repeat(3 - filled)}`;
  el.setAttribute(
    'aria-label',
    `${filled} of 3 stars. Thresholds: ${thresholds.map((t) => t.toLocaleString()).join(', ')}`,
  );
}

function starsEarnedFromScore(score: number, thresholds: [number, number, number]): number {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}

export function setNextEnabled(enabled: boolean): void {
  const btn = document.getElementById('next-level') as HTMLButtonElement | null;
  if (btn) btn.disabled = !enabled;
}

export function setPrevEnabled(enabled: boolean): void {
  const btn = document.getElementById('prev-level') as HTMLButtonElement | null;
  if (btn) btn.disabled = !enabled;
}

export function setStatusChip(text: string, variant: 'playing' | 'won' | 'lost'): void {
  const chip = document.getElementById('status-chip');
  if (!chip) return;
  chip.textContent = text;
  chip.setAttribute('data-variant', variant);
}

export function setContinueBanner(text: string | null): void {
  const el = document.getElementById('continue-banner');
  if (!el) return;
  if (text) {
    el.textContent = text;
    el.classList.remove('hidden');
  } else {
    el.textContent = '';
    el.classList.add('hidden');
  }
}

export function setHint(text: string): void {
  const el = document.getElementById('hint');
  if (el) el.textContent = text;
}
