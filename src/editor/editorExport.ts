import { createGameState } from '../core/board';
import { hasAnyMatch, hasAnyValidSwap } from '../core/matchEngine';
import { validateLevel } from '../core/validateLevel';
import type { LevelDef } from '../core/types';
import type { EditorDraft } from './editorState';
import { normalizeDraftBounds, toLevelDef } from './editorState';

export type ExportSuccess = {
  ok: true;
  level: LevelDef;
  json: string;
};

export type ExportFailure = {
  ok: false;
  message: string;
};

export type ExportResult = ExportSuccess | ExportFailure;

export type PreviewResult = {
  json: string;
  valid: boolean;
  playable: boolean;
  message: string;
};

function checkPlayable(level: LevelDef): { ok: boolean; message: string } {
  const state = createGameState(level);
  if (hasAnyMatch(state.grid)) {
    return { ok: false, message: 'Initial board has accidental matches.' };
  }
  if (!hasAnyValidSwap(state.grid)) {
    return { ok: false, message: 'No valid opening swap on the generated board.' };
  }
  return { ok: true, message: 'Board generates without matches and has a valid opening swap.' };
}

export function previewLevelExport(draft: EditorDraft): PreviewResult {
  normalizeDraftBounds(draft);
  const level = toLevelDef(draft);
  const json = `${JSON.stringify(level, null, 2)}\n`;

  try {
    validateLevel(level);
  } catch (error) {
    return {
      json,
      valid: false,
      playable: false,
      message: error instanceof Error ? error.message : 'Invalid level',
    };
  }

  const playable = checkPlayable(level);
  return {
    json,
    valid: true,
    playable: playable.ok,
    message: playable.ok ? `Valid. ${playable.message}` : playable.message,
  };
}

export function prepareLevelExport(draft: EditorDraft): ExportResult {
  normalizeDraftBounds(draft);
  const level = toLevelDef(draft);

  try {
    validateLevel(level);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Invalid level',
    };
  }

  const playable = checkPlayable(level);
  if (!playable.ok) {
    return { ok: false, message: playable.message };
  }

  return {
    ok: true,
    level,
    json: `${JSON.stringify(level, null, 2)}\n`,
  };
}

export function downloadLevelJson(level: LevelDef, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${level.id}.json`;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
