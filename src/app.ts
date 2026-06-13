import {
  createGameState,
  scoreGoalTarget,
  starsEarned,
  statusLabel,
  trySwap,
} from './core/board';
import { fetchLevel, fetchLevelManifest, type LevelChapter } from './core/levels';
import type { Coord, GameState, LevelDef } from './core/types';
import { loadSettings } from './game/settings';
import {
  clearSession,
  findInProgressLevelIds,
  findResumeLevel,
  getCompletedLevelIds,
  loadProgress,
  loadSession,
  recordBestResult,
  saveProgress,
  saveSession,
  unlockNextLevel,
} from './game/storage';
import {
  bindControls,
  setContinueBanner,
  setHint,
  setMovesLeft,
  setNextEnabled,
  setPrevEnabled,
  setScoreHud,
  setStarsHud,
  setStatusChip,
  showWinPanel,
  updateHeader,
} from './ui/controls';
import { createGridBoard } from './ui/gridBoard';
import { closeLevelPicker, isLevelPickerOpen, openLevelPicker } from './ui/levelPicker';

export class TileMatchApp {
  private state: GameState | null = null;
  private levelDef: LevelDef | null = null;
  private levelIds: number[] = [];
  private levelChapters: LevelChapter[] = [];
  private progress = loadProgress();
  private settings = loadSettings();
  private loading = false;
  private busy = false;

  private board = createGridBoard(document.getElementById('board-host')!, {
    reduceMotion: this.settings.reduceMotion,
    onSwapAttempt: (a, b) => void this.handleSwap(a, b),
  });

  async init(): Promise<void> {
    bindControls({
      onRestart: () => void this.restartLevel(),
      onNext: () => void this.goToLevel(this.currentLevelId() + 1),
      onPrev: () => void this.goToLevel(this.currentLevelId() - 1),
      onLevels: () => this.openLevels(),
    });

    const manifest = await fetchLevelManifest();
    this.levelIds = manifest.levels.map((level) => level.id);
    this.levelChapters = manifest.chapters;

    const resumeId = findResumeLevel(this.levelIds, this.progress);
    const startId = resumeId ?? this.progress.currentLevel;
    await this.loadLevel(startId, { preferSession: Boolean(resumeId) });

    if (resumeId) {
      setContinueBanner(`Resuming level ${resumeId}…`);
    }
  }

  private currentLevelId(): number {
    return this.levelDef?.id ?? this.progress.currentLevel;
  }

  private async loadLevel(
    levelId: number,
    options: { preferSession?: boolean } = {},
  ): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    closeLevelPicker();

    try {
      const clamped = Math.min(Math.max(levelId, 1), this.levelIds.at(-1) ?? 1);
      const level = await fetchLevel(clamped);
      this.levelDef = level;

      const session = options.preferSession ? loadSession(clamped) : null;
      if (session && session.status === 'playing') {
        this.state = {
          levelId: clamped,
          rows: session.rows,
          cols: session.cols,
          grid: session.grid,
          palette: session.palette,
          movesLeft: session.movesLeft,
          score: session.score,
          status: session.status,
          rngState: session.rngState,
          goals: session.goals,
          stars: session.stars,
        };
      } else {
        this.state = createGameState(level);
      }

      this.progress = { ...this.progress, currentLevel: clamped };
      saveProgress(this.progress);
      this.refreshUi();
    } finally {
      this.loading = false;
    }
  }

  private refreshUi(): void {
    if (!this.state || !this.levelDef) return;

    const target = scoreGoalTarget(this.state);
    updateHeader(this.levelDef.name, this.levelDef.id, this.levelIds.length);
    setMovesLeft(this.state.movesLeft);
    setScoreHud(this.state.score, target);
    setStarsHud(this.state.stars, this.state.score);
    setStatusChip(statusLabel(this.state.status), this.state.status);
    setPrevEnabled(this.levelDef.id > 1);
    setNextEnabled(this.state.status === 'won' && this.levelDef.id < this.levelIds.at(-1)!);
    setHint('Tap a tile, then tap an adjacent tile to swap and match 3+.');
    setContinueBanner(null);

    if (this.state.status === 'won') {
      const stars = starsEarned(this.state);
      showWinPanel(true, `Level cleared! ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`);
    } else if (this.state.status === 'lost') {
      showWinPanel(true, 'Out of moves — try again!');
    } else {
      showWinPanel(false);
    }

    this.board.render(this.state);
  }

  private handleSwap(a: Coord, b: Coord): void {
    if (!this.state || this.busy || this.state.status !== 'playing') return;

    this.busy = true;
    this.board.setBusy(true);

    const result = trySwap(this.state, a, b);

    if (!result.ok) {
      if (result.reason === 'no-match') {
        this.board.flashInvalidSwap(a, b);
      }
      this.busy = false;
      this.board.setBusy(false);
      return;
    }

    this.state = result.state;
    saveSession(this.levelDef!.id, this.state);

    if (this.state.status === 'won') {
      clearSession(this.levelDef!.id);
      const stars = starsEarned(this.state);
      this.progress = recordBestResult(
        unlockNextLevel(this.progress, this.levelDef!.id),
        this.levelDef!.id,
        stars,
        this.state.score,
      );
      saveProgress(this.progress);
    } else if (this.state.status === 'lost') {
      clearSession(this.levelDef!.id);
    }

    this.refreshUi();
    this.busy = false;
    this.board.setBusy(false);
  }

  private async restartLevel(): Promise<void> {
    if (!this.levelDef) return;
    clearSession(this.levelDef.id);
    this.state = createGameState(this.levelDef);
    this.refreshUi();
  }

  private async goToLevel(levelId: number): Promise<void> {
    if (levelId < 1 || levelId > this.levelIds.at(-1)!) return;
    if (levelId > this.progress.highestUnlocked && this.state?.status !== 'won') return;
    await this.loadLevel(levelId);
  }

  private openLevels(): void {
    if (isLevelPickerOpen()) {
      closeLevelPicker();
      return;
    }

    openLevelPicker({
      levelIds: this.levelIds,
      chapters: this.levelChapters,
      currentLevel: this.currentLevelId(),
      highestUnlocked: this.progress.highestUnlocked,
      completedLevelIds: getCompletedLevelIds(this.progress),
      inProgressLevelIds: findInProgressLevelIds(),
      progress: this.progress,
      onSelect: (id) => {
        closeLevelPicker();
        if (id <= this.progress.highestUnlocked) {
          void this.loadLevel(id, { preferSession: true });
        }
      },
      onClose: () => closeLevelPicker(),
    });
  }
}

export async function bootstrap(): Promise<void> {
  const app = new TileMatchApp();
  await app.init();
}
