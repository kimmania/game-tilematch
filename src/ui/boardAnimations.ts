import type { CascadeStep, Coord, GameState, SettleFrame, Tile } from '../core/types';
import { TILE_CSS } from '../core/tileColors';

const CLEAR_MS = 160;
const FALL_MS = 300;
const SWAP_MS = 140;
const STEP_GAP_MS = 60;
const FALL_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function cellEl(root: HTMLElement, coord: Coord): HTMLElement | null {
  return root.querySelector(`[data-row="${coord.row}"][data-col="${coord.col}"]`);
}

function boardRect(root: HTMLElement): DOMRect {
  return root.getBoundingClientRect();
}

function cellCenterRect(root: HTMLElement, coord: Coord): DOMRect | null {
  const cell = cellEl(root, coord);
  if (!cell) return null;
  const tile = cell.querySelector('.tile');
  return (tile ?? cell).getBoundingClientRect();
}

function floaterSize(rect: DOMRect): number {
  return Math.min(rect.width, rect.height);
}

function createAnimLayer(root: HTMLElement): HTMLElement {
  const layer = document.createElement('div');
  layer.className = 'board-anim-layer';
  root.appendChild(layer);
  return layer;
}

function removeAnimLayer(layer: HTMLElement | null): void {
  layer?.remove();
}

export function createTileElement(tile: Tile): HTMLElement {
  const gem = document.createElement('span');
  gem.className = `tile tile-${tile.color}`;
  if (tile.special) gem.classList.add(`special-${tile.special}`);
  gem.style.setProperty('--tile-bg', TILE_CSS[tile.color].bg);
  gem.style.setProperty('--tile-edge', TILE_CSS[tile.color].edge);
  gem.setAttribute('aria-hidden', 'true');
  return gem;
}

function mountFloater(
  layer: HTMLElement,
  board: DOMRect,
  sourceRect: DOMRect,
  element: HTMLElement,
): HTMLElement {
  const size = floaterSize(sourceRect);
  element.classList.add('board-anim-floater');
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.left = `${sourceRect.left - board.left + (sourceRect.width - size) / 2}px`;
  element.style.top = `${sourceRect.top - board.top + (sourceRect.height - size) / 2}px`;
  layer.appendChild(element);
  return element;
}

function moveFloater(
  floater: HTMLElement,
  dx: number,
  dy: number,
  duration: number,
): void {
  floater.style.transition = `transform ${duration}ms ${FALL_EASING}`;
  requestAnimationFrame(() => {
    floater.style.transform = `translate(${dx}px, ${dy}px)`;
  });
}

function hideTile(tile: HTMLElement): void {
  tile.style.visibility = 'hidden';
}

async function animateClear(root: HTMLElement, cleared: Coord[]): Promise<void> {
  const tiles: HTMLElement[] = [];
  for (const coord of cleared) {
    const cell = cellEl(root, coord);
    const tile = cell?.querySelector('.tile') as HTMLElement | null;
    if (tile) {
      tile.classList.add('tile-clearing');
      tiles.push(tile);
    }
  }
  if (tiles.length === 0) return;
  await wait(CLEAR_MS);
  for (const tile of tiles) tile.remove();
}

async function animateSettle(
  root: HTMLElement,
  settle: SettleFrame,
  stateAfter: GameState,
): Promise<void> {
  if (settle.falls.length === 0 && settle.spawns.length === 0) return;

  const board = boardRect(root);
  const layer = createAnimLayer(root);

  for (const fall of settle.falls) {
    const fromRect = cellCenterRect(root, fall.from);
    const toRect = cellCenterRect(root, fall.to);
    const sourceTile = cellEl(root, fall.from)?.querySelector('.tile') as HTMLElement | null;
    if (!fromRect || !toRect || !sourceTile) continue;

    hideTile(sourceTile);
    const floater = mountFloater(layer, board, fromRect, sourceTile.cloneNode(true) as HTMLElement);
    moveFloater(floater, toRect.left - fromRect.left, toRect.top - fromRect.top, FALL_MS);
  }

  for (const spawn of settle.spawns) {
    const toRect = cellCenterRect(root, spawn.to);
    if (!toRect) continue;
    const slot = stateAfter.grid[spawn.to.row]![spawn.to.col]!;
    if (!slot.tile) continue;

    const floater = mountFloater(layer, board, toRect, createTileElement(slot.tile));
    const stride = measureVerticalStride(root);
    const deltaRows = spawn.to.row - spawn.fromRow;
    floater.style.transform = `translate(0, ${-deltaRows * stride}px)`;
    floater.getBoundingClientRect();
    moveFloater(floater, 0, 0, FALL_MS);
  }

  await wait(FALL_MS + 24);
  removeAnimLayer(layer);
}

function measureVerticalStride(root: HTMLElement): number {
  const top = cellEl(root, { row: 0, col: 0 });
  const below = cellEl(root, { row: 1, col: 0 });
  if (top && below) {
    return Math.max(1, below.getBoundingClientRect().top - top.getBoundingClientRect().top);
  }
  const cell = top ?? root.querySelector('.grid-cell');
  if (cell) {
    const rect = cell.getBoundingClientRect();
    const gap = Number.parseFloat(getComputedStyle(root).gap) || 5;
    return rect.height + gap;
  }
  return 48;
}

async function animateSwap(root: HTMLElement, a: Coord, b: Coord): Promise<void> {
  const rectA = cellCenterRect(root, a);
  const rectB = cellCenterRect(root, b);
  const tileA = cellEl(root, a)?.querySelector('.tile') as HTMLElement | null;
  const tileB = cellEl(root, b)?.querySelector('.tile') as HTMLElement | null;
  if (!rectA || !rectB || !tileA || !tileB) return;

  const board = boardRect(root);
  const layer = createAnimLayer(root);
  hideTile(tileA);
  hideTile(tileB);

  const floaterA = mountFloater(layer, board, rectA, tileA.cloneNode(true) as HTMLElement);
  const floaterB = mountFloater(layer, board, rectB, tileB.cloneNode(true) as HTMLElement);
  moveFloater(floaterA, rectB.left - rectA.left, rectB.top - rectA.top, SWAP_MS);
  moveFloater(floaterB, rectA.left - rectB.left, rectA.top - rectB.top, SWAP_MS);

  await wait(SWAP_MS + 24);
  removeAnimLayer(layer);
}

export type CascadePlayback = {
  root: HTMLElement;
  beforeSwap: GameState;
  visualStart: GameState;
  steps: CascadeStep[];
  swap?: { a: Coord; b: Coord };
  render: (state: GameState) => void;
};

export async function playCascadeAnimations(playback: CascadePlayback): Promise<void> {
  const { root, beforeSwap, visualStart, steps, swap, render } = playback;

  if (swap) {
    render(beforeSwap);
    await animateSwap(root, swap.a, swap.b);
  }

  render(visualStart);

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]!;
    await animateClear(root, step.cleared);
    await animateSettle(root, step.settle, step.after);
    render(step.after);
    if (i < steps.length - 1) await wait(STEP_GAP_MS);
  }
}
