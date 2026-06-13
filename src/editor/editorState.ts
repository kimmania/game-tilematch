import type { Coord, CrateDef, IceDef, LevelDef, LevelGoal } from '../core/types';

export type EditorTool = 'jelly' | 'crate' | 'ice' | 'erase';

export type EditorDraft = {
  id: number;
  name: string;
  rows: number;
  cols: number;
  moves: number;
  colors: number;
  seed: number;
  scoreTarget: number;
  starTwo: number;
  starThree: number;
  includeJellyGoal: boolean;
  jelly: Coord[];
  crates: CrateDef[];
  ice: IceDef[];
};

export function createEmptyDraft(): EditorDraft {
  return {
    id: 99,
    name: 'New level',
    rows: 8,
    cols: 8,
    moves: 20,
    colors: 4,
    seed: 9001,
    scoreTarget: 3000,
    starTwo: 4500,
    starThree: 6500,
    includeJellyGoal: false,
    jelly: [],
    crates: [],
    ice: [],
  };
}

export function draftFromLevel(level: LevelDef): EditorDraft {
  const scoreGoal = level.goals.find((g) => g.type === 'score');
  const jellyGoal = level.goals.find((g) => g.type === 'jelly');

  return {
    id: level.id,
    name: level.name,
    rows: level.rows,
    cols: level.cols,
    moves: level.moves,
    colors: level.colors,
    seed: level.seed,
    scoreTarget: scoreGoal?.target ?? level.stars[0],
    starTwo: level.stars[1],
    starThree: level.stars[2],
    includeJellyGoal: jellyGoal != null,
    jelly: (level.layout?.jelly ?? []).map((c) => ({ ...c })),
    crates: (level.layout?.crates ?? []).map((c) => ({ ...c })),
    ice: (level.layout?.ice ?? []).map((c) => ({ ...c })),
  };
}

export function toLevelDef(draft: EditorDraft): LevelDef {
  const goals: LevelGoal[] = [{ type: 'score', target: draft.scoreTarget }];
  if (draft.includeJellyGoal && draft.jelly.length > 0) {
    goals.push({ type: 'jelly', target: draft.jelly.length });
  }

  const level: LevelDef = {
    id: draft.id,
    name: draft.name.trim() || `Level ${draft.id}`,
    rows: draft.rows,
    cols: draft.cols,
    moves: draft.moves,
    colors: draft.colors,
    seed: draft.seed,
    goals,
    stars: [draft.scoreTarget, draft.starTwo, draft.starThree],
  };

  if (draft.jelly.length > 0 || draft.crates.length > 0 || draft.ice.length > 0) {
    level.layout = {};
    if (draft.jelly.length > 0) {
      level.layout.jelly = draft.jelly.map((c) => ({ ...c }));
    }
    if (draft.crates.length > 0) {
      level.layout.crates = draft.crates.map((c) => ({ ...c }));
    }
    if (draft.ice.length > 0) {
      level.layout.ice = draft.ice.map((c) => ({ ...c }));
    }
  }

  return level;
}

function findJellyIndex(draft: EditorDraft, row: number, col: number): number {
  return draft.jelly.findIndex((c) => c.row === row && c.col === col);
}

function findCrateIndex(draft: EditorDraft, row: number, col: number): number {
  return draft.crates.findIndex((c) => c.row === row && c.col === col);
}

function findIceIndex(draft: EditorDraft, row: number, col: number): number {
  return draft.ice.findIndex((c) => c.row === row && c.col === col);
}

export function toggleJelly(draft: EditorDraft, row: number, col: number): void {
  const index = findJellyIndex(draft, row, col);
  if (index >= 0) draft.jelly.splice(index, 1);
  else draft.jelly.push({ row, col });
}

export function cycleCrate(draft: EditorDraft, row: number, col: number): void {
  const index = findCrateIndex(draft, row, col);
  if (index < 0) {
    draft.crates.push({ row, col, layers: 1 });
    return;
  }
  const crate = draft.crates[index]!;
  if (crate.layers >= 2) draft.crates.splice(index, 1);
  else crate.layers += 1;
}

export function cycleIce(draft: EditorDraft, row: number, col: number): void {
  const index = findIceIndex(draft, row, col);
  if (index < 0) {
    draft.ice.push({ row, col, layers: 1 });
    return;
  }
  const ice = draft.ice[index]!;
  if (ice.layers >= 2) draft.ice.splice(index, 1);
  else ice.layers += 1;
}

export function eraseCell(draft: EditorDraft, row: number, col: number): void {
  const j = findJellyIndex(draft, row, col);
  if (j >= 0) draft.jelly.splice(j, 1);
  const c = findCrateIndex(draft, row, col);
  if (c >= 0) draft.crates.splice(c, 1);
  const i = findIceIndex(draft, row, col);
  if (i >= 0) draft.ice.splice(i, 1);
}

export function applyTool(draft: EditorDraft, tool: EditorTool, row: number, col: number): void {
  if (row < 0 || row >= draft.rows || col < 0 || col >= draft.cols) return;

  switch (tool) {
    case 'jelly':
      toggleJelly(draft, row, col);
      break;
    case 'crate':
      cycleCrate(draft, row, col);
      break;
    case 'ice':
      cycleIce(draft, row, col);
      break;
    case 'erase':
      eraseCell(draft, row, col);
      break;
  }
}

export function draftSummary(draft: EditorDraft): string {
  return `${draft.rows}×${draft.cols} · ${draft.moves} moves · ${draft.colors} colors · jelly ${draft.jelly.length}`;
}

export function normalizeDraftBounds(draft: EditorDraft): void {
  draft.jelly = draft.jelly.filter(
    (c) => c.row >= 0 && c.row < draft.rows && c.col >= 0 && c.col < draft.cols,
  );
  draft.crates = draft.crates.filter(
    (c) => c.row >= 0 && c.row < draft.rows && c.col >= 0 && c.col < draft.cols,
  );
  draft.ice = draft.ice.filter(
    (c) => c.row >= 0 && c.row < draft.rows && c.col >= 0 && c.col < draft.cols,
  );
}
