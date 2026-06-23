import {
  createGameState,
  formatGoals,
  starsEarned,
  statusLabel,
  trySwap,
} from './core/board';
import { fetchLevel, fetchLevelManifest, type LevelChapter } from './core/levels';
import type { Coord, GameState, GoalProgress, LevelDef } from './core/types';
import { emptyCollectibleCounts } from './core/types';
import { configureAudio, playSound, primeAudio } from './game/audio';
import { configureHaptics, pulseHaptic } from './game/haptics';
import { loadSettings, saveSettings } from './game/settings';
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
import { shouldShowTutorial } from './game/tutorial';
import { clearAllUserData } from './game/userData';
import {
  bindControls,
  setContinueBanner,
  setGoalsHud,
  setHint,
  setMovesLeft,
  setNextEnabled,
  setPrevEnabled,
  setStarsHud,
  setStatusChip,
  showWinPanel,
  updateHeader,
} from './ui/controls';
import { createGridBoard } from './ui/gridBoard';
import { closeLevelPicker, isLevelPickerOpen, openLevelPicker } from './ui/levelPicker';
import {
  applyMotionClass,
  closeSettingsPanel,
  openSettingsPanel,
} from './ui/settingsPanel';
import { closeHelpOverlay, closeTutorialOverlay, isTutorialOpen, openHelpOverlay, openTutorialOverlay } from './ui/tutorialOverlay';

const HINTS: Record<number, string> = {
  11: 'Match 4 in a row to create a rocket. Tap two adjacent tiles to swap.',
  12: 'Match 5 or an L-shape to create a bomb. Swap two specials for a combo.',
  13: 'Match a 2×2 square to create a propeller. Clear all jelly tiles.',
  14: 'Match next to crates to break them. Chip ice before the tile can move.',
  15: 'Use rockets, bombs, and propellers together to clear jelly and crates.',
  31: 'Match on or next to cherries to collect them.',
  32: 'Clear tiles in a cherry column — the cherry rides down on the candy below it until it exits the bottom row.',
  33: 'Green dashed tiles are grass goals — spread grass onto all of them to win.',
  34: 'Score goal is high so you can experiment. Match 5 in a straight line for a color bomb, then swap it to clear that color and score big.',
};

function normalizeProgress(progress: Partial<GoalProgress> | undefined): GoalProgress {
  return {
    score: progress?.score ?? 0,
    jellyCleared: progress?.jellyCleared ?? 0,
    collected: { ...emptyCollectibleCounts(), ...progress?.collected },
    dropped: { ...emptyCollectibleCounts(), ...progress?.dropped },
  };
}

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
    applyMotionClass(this.settings.reduceMotion);
    configureAudio(this.settings);
    configureHaptics(this.settings);
    primeAudio();

    bindControls({
      onRestart: () => void this.restartLevel(),
      onNext: () => void this.goToLevel(this.currentLevelId() + 1),
      onPrev: () => void this.goToLevel(this.currentLevelId() - 1),
      onLevels: () => this.openLevels(),
      onSettings: () => this.openSettings(),
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
    closeSettingsPanel();

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
          progress: normalizeProgress(session.progress),
          totalJelly: session.totalJelly,
          grassTargets: session.grassTargets ?? [],
        };
      } else {
        this.state = createGameState(level);
      }

      this.progress = { ...this.progress, currentLevel: clamped };
      saveProgress(this.progress);
      this.refreshUi();
      this.maybeShowTutorial(clamped);
    } finally {
      this.loading = false;
    }
  }

  private maybeShowTutorial(levelId: number): void {
    const tutorialId = shouldShowTutorial(levelId);
    if (!tutorialId || isTutorialOpen()) return;
    openTutorialOverlay(tutorialId, () => {});
  }

  private refreshUi(): void {
    if (!this.state || !this.levelDef) return;

    updateHeader(this.levelDef.name, this.levelDef.id, this.levelIds.length);
    setMovesLeft(this.state.movesLeft);
    setGoalsHud(formatGoals(this.state));
    setStarsHud(this.state.stars, this.state.score);
    setStatusChip(statusLabel(this.state.status), this.state.status);
    setPrevEnabled(this.levelDef.id > 1);
    setNextEnabled(this.state.status === 'won' && this.levelDef.id < this.levelIds.at(-1)!);
    setHint(HINTS[this.levelDef.id] ?? 'Tap a tile, then tap an adjacent tile to swap and match 3+.');
    setContinueBanner(null);

    if (this.state.status === 'won') {
      const stars = starsEarned(this.state);
      showWinPanel(true, `Level cleared! ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, 'won');
    } else if (this.state.status === 'lost') {
      showWinPanel(true, 'Out of moves — try again!', 'lost');
    } else {
      showWinPanel(false);
    }

    this.board.render(this.state);
  }

  private async handleSwap(a: Coord, b: Coord): Promise<void> {
    if (!this.state || this.busy || this.state.status !== 'playing') return;

    playSound('tap');
    pulseHaptic(4);
    this.busy = true;
    this.board.setBusy(true);

    const beforeSwap = this.state;
    const result = trySwap(this.state, a, b);

    if (!result.ok) {
      if (result.reason === 'no-match') {
        this.board.flashInvalidSwap(a, b);
        playSound('blocked');
        pulseHaptic(12);
      }
      this.busy = false;
      this.board.setBusy(false);
      return;
    }

    playSound('slide');
    if (result.steps.length > 0) {
      playSound('match');
      pulseHaptic([6, 30, 6]);
    }

    await this.board.playCascade({
      beforeSwap,
      visualStart: result.visualStart,
      steps: result.steps,
      swap: result.swapped ? { a, b } : undefined,
    });

    this.state = result.state;
    saveSession(this.levelDef!.id, this.state);

    if (this.state.status === 'won') {
      clearSession(this.levelDef!.id);
      playSound('win');
      pulseHaptic([10, 40, 10, 40, 20]);
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

  private openSettings(): void {
    if (document.getElementById('settings-panel')) {
      closeSettingsPanel();
      return;
    }

    openSettingsPanel({
      settings: this.settings,
      onChange: (next) => {
        this.settings = next;
        saveSettings(next);
        applyMotionClass(next.reduceMotion);
        configureAudio(next);
        configureHaptics(next);
        this.board.destroy();
        this.board = createGridBoard(document.getElementById('board-host')!, {
          reduceMotion: next.reduceMotion,
          onSwapAttempt: (a, b) => void this.handleSwap(a, b),
        });
        if (this.state) this.board.render(this.state);
      },
      onHelp: () => {
        closeSettingsPanel();
        openHelpOverlay();
      },
      onResetData: () => {
        if (!window.confirm('Reset all progress, saves, and settings?')) return;
        clearAllUserData();
        closeSettingsPanel();
        closeTutorialOverlay();
        closeHelpOverlay();
        this.progress = loadProgress();
        this.settings = loadSettings();
        applyMotionClass(this.settings.reduceMotion);
        configureAudio(this.settings);
        configureHaptics(this.settings);
        void this.loadLevel(1);
      },
      onClose: () => closeSettingsPanel(),
    });
  }
}

export async function bootstrap(): Promise<void> {
  const app = new TileMatchApp();
  await app.init();
}
