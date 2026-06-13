import type { CascadeStep, CollectibleKind, Coord, GameState } from '../core/types';
import { specialLabel } from '../core/tile';
import { TILE_CSS } from '../core/tileColors';
import { createTileElement, playCascadeAnimations } from './boardAnimations';

export type GridBoardOptions = {
  reduceMotion?: boolean;
  onSwapAttempt: (a: Coord, b: Coord) => void;
};

export type CascadePlaybackOptions = {
  beforeSwap: GameState;
  visualStart: GameState;
  steps: CascadeStep[];
  swap?: { a: Coord; b: Coord };
};

export type GridBoard = {
  render: (state: GameState, selected?: Coord | null) => void;
  setBusy: (busy: boolean) => void;
  flashInvalidSwap: (a: Coord, b: Coord) => void;
  playCascade: (options: CascadePlaybackOptions) => Promise<void>;
  destroy: () => void;
};

function collectibleLabel(kind: CollectibleKind): string {
  return kind === 'cherry' ? 'cherry' : 'coin';
}

function cellLabel(state: GameState, row: number, col: number): string {
  const cell = state.grid[row]![col]!;
  const parts: string[] = [];

  if (cell.jelly) parts.push('jelly');
  if (cell.grass) parts.push('grass');
  if (cell.crateLayers > 0) parts.push(`crate ${cell.crateLayers} layers`);
  if (cell.iceLayers > 0) parts.push(`ice ${cell.iceLayers} layers`);
  if (cell.collectible) parts.push(`collect ${collectibleLabel(cell.collectible)}`);
  if (cell.drop) parts.push(`drop ${collectibleLabel(cell.drop)}`);

  if (cell.tile) {
    const color = TILE_CSS[cell.tile.color].label;
    parts.push(cell.tile.special ? `${specialLabel(cell.tile.special)} (${color})` : color);
  }

  return parts.length > 0 ? parts.join(', ') : 'Empty cell';
}

export function createGridBoard(host: HTMLElement, options: GridBoardOptions): GridBoard {
  let selected: Coord | null = null;
  let busy = false;
  let state: GameState | null = null;

  const root = document.createElement('div');
  root.className = 'grid-board';
  host.classList.add('board-frame');
  host.replaceChildren(root);

  function renderBoard(current: GameState, sel: Coord | null = selected): void {
    state = current;
    selected = sel;
    root.style.setProperty('--grid-cols', String(current.cols));
    root.replaceChildren();

    for (let row = 0; row < current.rows; row += 1) {
      for (let col = 0; col < current.cols; col += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'grid-cell';
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);

        const slot = current.grid[row]![col]!;
        const isSelected = sel?.row === row && sel?.col === col;
        if (isSelected) cell.classList.add('selected');
        if (slot.jelly) cell.classList.add('has-jelly');
        if (slot.grass) cell.classList.add('has-grass');
        if (slot.crateLayers > 0) cell.classList.add('has-crate');
        if (slot.iceLayers > 0) cell.classList.add('has-ice');

        if (slot.crateLayers > 0) {
          const crate = document.createElement('span');
          crate.className = 'blocker crate';
          crate.textContent = slot.crateLayers > 1 ? '2' : '';
          crate.setAttribute('aria-hidden', 'true');
          cell.appendChild(crate);
        } else if (slot.tile) {
          cell.appendChild(createTileElement(slot.tile));
        }

        if (slot.iceLayers > 0) {
          const ice = document.createElement('span');
          ice.className = 'blocker ice';
          ice.textContent = String(slot.iceLayers);
          ice.setAttribute('aria-hidden', 'true');
          cell.appendChild(ice);
        }

        if (slot.collectible) {
          const item = document.createElement('span');
          item.className = `collectible collectible-${slot.collectible}`;
          item.setAttribute('aria-hidden', 'true');
          cell.appendChild(item);
        }

        if (slot.drop) {
          const item = document.createElement('span');
          item.className = `collectible drop-item drop-${slot.drop}`;
          item.setAttribute('aria-hidden', 'true');
          cell.classList.add('has-drop');
          cell.appendChild(item);
        }

        cell.setAttribute('aria-label', cellLabel(current, row, col));

        const canTap = slot.crateLayers === 0 && slot.tile && slot.iceLayers === 0;
        cell.disabled = busy || current.status !== 'playing' || !canTap;
        cell.addEventListener('click', () => handleCellTap(row, col));
        root.appendChild(cell);
      }
    }
  }

  function handleCellTap(row: number, col: number): void {
    if (busy || !state || state.status !== 'playing') return;
    const slot = state.grid[row]![col]!;
    if (slot.crateLayers > 0 || !slot.tile || slot.iceLayers > 0) return;

    const tapped: Coord = { row, col };

    if (!selected) {
      selected = tapped;
      renderBoard(state, selected);
      return;
    }

    if (selected.row === row && selected.col === col) {
      selected = null;
      renderBoard(state, null);
      return;
    }

    const from = selected;
    selected = null;
    renderBoard(state, null);
    options.onSwapAttempt(from, tapped);
  }

  return {
    render: (next, sel) => renderBoard(next, sel ?? null),
    setBusy: (value) => {
      busy = value;
      root.classList.toggle('board-busy', value);
      if (state) renderBoard(state, selected);
    },
    flashInvalidSwap: (a, b) => {
      if (options.reduceMotion || !state) return;
      const cellA = root.querySelector(`[data-row="${a.row}"][data-col="${a.col}"]`);
      const cellB = root.querySelector(`[data-row="${b.row}"][data-col="${b.col}"]`);
      for (const el of [cellA, cellB]) {
        el?.classList.add('invalid-swap');
        window.setTimeout(() => el?.classList.remove('invalid-swap'), 280);
      }
    },
    playCascade: async (playback) => {
      if (options.reduceMotion) {
        renderBoard(playback.steps.at(-1)?.after ?? playback.visualStart);
        return;
      }
      await playCascadeAnimations({
        root,
        beforeSwap: playback.beforeSwap,
        visualStart: playback.visualStart,
        steps: playback.steps,
        swap: playback.swap,
        render: (next) => renderBoard(next, null),
      });
    },
    destroy: () => {
      host.replaceChildren();
    },
  };
}
