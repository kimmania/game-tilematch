import type { GameState } from '../core/types';
import { TILE_CSS } from '../core/tileColors';

const CELL = 36;
const GAP = 4;
const PAD = 12;
const TITLE = 32;

export type LevelPreviewOptions = {
  showTitle?: boolean;
};

export function renderLevelPreviewSvg(state: GameState, options: LevelPreviewOptions = {}): string {
  const showTitle = options.showTitle !== false;
  const width = state.cols * CELL + (state.cols - 1) * GAP + PAD * 2;
  const height =
    state.rows * CELL + (state.rows - 1) * GAP + PAD * 2 + (showTitle ? TITLE : 0);

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
  );
  parts.push(`<rect width="100%" height="100%" fill="#1e2a3a"/>`);

  if (showTitle) {
    parts.push(
      `<text x="${PAD}" y="22" fill="#eef3fb" font-family="system-ui,sans-serif" font-size="14" font-weight="700">Level ${state.levelId}</text>`,
    );
  }

  const y0 = showTitle ? TITLE : 0;

  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const x = PAD + col * (CELL + GAP);
      const y = PAD + y0 + row * (CELL + GAP);
      const cell = state.grid[row]![col]!;

      let fill = '#354c68';
      if (cell.grass) fill = '#2d5a48';
      if (cell.jelly) fill = '#5a4520';
      if (cell.crateLayers > 0) fill = '#5c3d28';

      parts.push(
        `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="6" fill="${fill}" stroke="#4a6280" stroke-width="1"/>`,
      );

      if (cell.crateLayers > 0) {
        parts.push(
          `<text x="${x + CELL / 2}" y="${y + CELL / 2 + 4}" text-anchor="middle" fill="#ffe8d4" font-size="11" font-weight="700">C${cell.crateLayers}</text>`,
        );
      } else if (cell.tile) {
        const color = TILE_CSS[cell.tile.color];
        parts.push(
          `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${CELL * 0.34}" fill="${color.bg}" stroke="${color.edge}" stroke-width="2"/>`,
        );
        if (cell.tile.special) {
          parts.push(
            `<rect x="${x + 11}" y="${y + 14}" width="14" height="8" rx="2" fill="rgba(255,255,255,0.85)"/>`,
          );
        }
      }

      if (cell.iceLayers > 0) {
        parts.push(
          `<rect x="${x + 2}" y="${y + 2}" width="${CELL - 4}" height="${CELL - 4}" rx="5" fill="rgba(180,220,255,0.35)" stroke="rgba(220,240,255,0.8)" stroke-width="1.5"/>`,
        );
        parts.push(
          `<text x="${x + CELL - 6}" y="${y + 12}" text-anchor="end" fill="#1e2a3a" font-size="9" font-weight="700">${cell.iceLayers}</text>`,
        );
      }

      if (cell.collectible) {
        const fill = cell.collectible === 'cherry' ? '#c62828' : '#f0b429';
        parts.push(
          `<circle cx="${x + CELL - 8}" cy="${y + 8}" r="5" fill="${fill}" stroke="#fff" stroke-width="1"/>`,
        );
      }

      if (cell.drop) {
        const fill = cell.drop === 'cherry' ? '#c62828' : '#f0b429';
        parts.push(
          `<circle cx="${x + 8}" cy="${y + CELL - 8}" r="5" fill="${fill}" stroke="#fff" stroke-width="1"/>`,
        );
      }
    }
  }

  parts.push('</svg>');
  return parts.join('\n');
}
