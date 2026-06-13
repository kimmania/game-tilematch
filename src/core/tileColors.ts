import type { TileColor } from './types';

export const ALL_TILE_COLORS: TileColor[] = [
  'ruby',
  'sapphire',
  'emerald',
  'amber',
  'amethyst',
];

export function paletteForCount(count: number): TileColor[] {
  if (!Number.isInteger(count) || count < 3 || count > ALL_TILE_COLORS.length) {
    throw new Error(`colors must be 3–${ALL_TILE_COLORS.length}`);
  }
  return ALL_TILE_COLORS.slice(0, count);
}

export const TILE_CSS: Record<TileColor, { bg: string; edge: string; label: string }> = {
  ruby: { bg: '#e85d6a', edge: '#c94452', label: 'Ruby' },
  sapphire: { bg: '#4a9cf0', edge: '#2d7fd4', label: 'Sapphire' },
  emerald: { bg: '#45c98a', edge: '#2da86c', label: 'Emerald' },
  amber: { bg: '#f0b429', edge: '#d99812', label: 'Amber' },
  amethyst: { bg: '#a978e8', edge: '#8b57d4', label: 'Amethyst' },
};
