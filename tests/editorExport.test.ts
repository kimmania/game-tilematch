import { describe, expect, it } from 'vitest';
import { previewLevelExport, prepareLevelExport } from '../src/editor/editorExport';
import { draftFromLevel, toLevelDef, type EditorDraft } from '../src/editor/editorState';
import type { LevelDef } from '../src/core/types';

const sample: LevelDef = {
  id: 13,
  name: 'Jelly hall',
  rows: 8,
  cols: 8,
  moves: 22,
  colors: 4,
  seed: 2013,
  goals: [
    { type: 'score', target: 3000 },
    { type: 'jelly', target: 12 },
  ],
  stars: [3000, 4500, 6500],
  layout: {
    jelly: [
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },
    ],
  },
};

describe('editor export', () => {
  it('round-trips level JSON through draft', () => {
    const draft = draftFromLevel(sample);
    const level = toLevelDef(draft);
    expect(level.id).toBe(sample.id);
    expect(level.layout?.jelly).toHaveLength(12);
    expect(level.goals.find((g) => g.type === 'jelly')?.target).toBe(12);
  });

  it('validates a known-good level draft', () => {
    const draft = draftFromLevel(sample);
    const preview = previewLevelExport(draft);
    expect(preview.valid).toBe(true);
    expect(preview.playable).toBe(true);
  });

  it('rejects invalid star thresholds', () => {
    const draft: EditorDraft = {
      ...draftFromLevel(sample),
      starTwo: 1000,
    };
    const result = prepareLevelExport(draft);
    expect(result.ok).toBe(false);
  });
});
