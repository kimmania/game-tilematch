import type { SpecialKind, Tile, TileColor } from './types';

export function makeTile(color: TileColor, special?: SpecialKind): Tile {
  return special ? { color, special } : { color };
}

export function isSpecial(tile: Tile | null | undefined): tile is Tile & { special: SpecialKind } {
  return tile != null && tile.special !== undefined;
}

export function tileColor(tile: Tile | null | undefined): TileColor | null {
  return tile?.color ?? null;
}

export function sameColor(a: Tile | null, b: Tile | null): boolean {
  return a != null && b != null && a.color === b.color;
}

export function specialLabel(special: SpecialKind): string {
  switch (special) {
    case 'rocket-h':
      return 'Horizontal rocket';
    case 'rocket-v':
      return 'Vertical rocket';
    case 'bomb':
      return 'Bomb';
    case 'color-bomb':
      return 'Color bomb';
    case 'propeller':
      return 'Propeller';
  }
}
