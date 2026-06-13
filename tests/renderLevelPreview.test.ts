import { describe, expect, it } from 'vitest';
import { createGameState } from '../src/core/board';
import { renderLevelPreviewSvg } from '../src/ui/renderLevelPreview';
import type { LevelDef } from '../src/core/types';

const sample: LevelDef = {
  id: 1,
  name: 'Preview',
  rows: 6,
  cols: 6,
  moves: 20,
  colors: 4,
  seed: 1001,
  goals: [{ type: 'score', target: 1200 }],
  stars: [1200, 2000, 3200],
};

describe('renderLevelPreviewSvg', () => {
  it('returns SVG markup for a level state', () => {
    const state = createGameState(sample);
    const svg = renderLevelPreviewSvg(state);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('Level 1');
  });
});
