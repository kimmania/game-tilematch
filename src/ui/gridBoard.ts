import type { Coord, GameState } from '../core/types';
import { TILE_CSS } from '../core/tileColors';

export type GridBoardOptions = {
  reduceMotion?: boolean;
  onSwapAttempt: (a: Coord, b: Coord) => void;
};

export type GridBoard = {
  render: (state: GameState, selected?: Coord | null) => void;
  setBusy: (busy: boolean) => void;
  flashInvalidSwap: (a: Coord, b: Coord) => void;
  destroy: () => void;
};

export function createGridBoard(host: HTMLElement, options: GridBoardOptions): GridBoard {
  let selected: Coord | null = null;
  let busy = false;
  let state: GameState | null = null;

  const root = document.createElement('div');
  root.className = 'grid-board';
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

        const isSelected = sel?.row === row && sel?.col === col;
        if (isSelected) cell.classList.add('selected');

        const tile = current.grid[row]![col]!.tile;
        if (tile) {
          const gem = document.createElement('span');
          gem.className = `tile tile-${tile}`;
          gem.style.setProperty('--tile-bg', TILE_CSS[tile].bg);
          gem.style.setProperty('--tile-edge', TILE_CSS[tile].edge);
          gem.setAttribute('aria-hidden', 'true');
          cell.appendChild(gem);
          cell.setAttribute('aria-label', `${TILE_CSS[tile].label} tile`);
        } else {
          cell.setAttribute('aria-label', 'Empty cell');
        }

        cell.disabled = busy || current.status !== 'playing';
        cell.addEventListener('click', () => handleCellTap(row, col));
        root.appendChild(cell);
      }
    }
  }

  function handleCellTap(row: number, col: number): void {
    if (busy || !state || state.status !== 'playing') return;
    if (!state.grid[row]![col]!.tile) return;

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
    destroy: () => {
      host.replaceChildren();
    },
  };
}
