import type { Coord, GameState } from '../core/types';
import { specialLabel } from '../core/tile';
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

function cellLabel(state: GameState, row: number, col: number): string {
  const cell = state.grid[row]![col]!;
  const parts: string[] = [];

  if (cell.jelly) parts.push('jelly');
  if (cell.crateLayers > 0) parts.push(`crate ${cell.crateLayers} layers`);
  if (cell.iceLayers > 0) parts.push(`ice ${cell.iceLayers} layers`);

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
        if (slot.crateLayers > 0) cell.classList.add('has-crate');
        if (slot.iceLayers > 0) cell.classList.add('has-ice');

        if (slot.crateLayers > 0) {
          const crate = document.createElement('span');
          crate.className = 'blocker crate';
          crate.textContent = slot.crateLayers > 1 ? '2' : '';
          crate.setAttribute('aria-hidden', 'true');
          cell.appendChild(crate);
        } else if (slot.tile) {
          const gem = document.createElement('span');
          gem.className = `tile tile-${slot.tile.color}`;
          if (slot.tile.special) {
            gem.classList.add(`special-${slot.tile.special}`);
          }
          gem.style.setProperty('--tile-bg', TILE_CSS[slot.tile.color].bg);
          gem.style.setProperty('--tile-edge', TILE_CSS[slot.tile.color].edge);
          gem.setAttribute('aria-hidden', 'true');
          cell.appendChild(gem);
        }

        if (slot.iceLayers > 0) {
          const ice = document.createElement('span');
          ice.className = 'blocker ice';
          ice.textContent = String(slot.iceLayers);
          ice.setAttribute('aria-hidden', 'true');
          cell.appendChild(ice);
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
