import { validateLevel } from '../core/validateLevel';
import type { LevelDef } from '../core/types';
import { draftFromLevel, type EditorDraft } from './editorState';

export function parseLevelJson(raw: string): LevelDef {
  const data = JSON.parse(raw) as LevelDef;
  validateLevel(data);
  return data;
}

export function importDraftFromJson(raw: string): EditorDraft {
  return draftFromLevel(parseLevelJson(raw));
}

export async function readClipboardText(): Promise<string> {
  if (!navigator.clipboard?.readText) {
    throw new Error('Clipboard read is not supported in this browser.');
  }
  return navigator.clipboard.readText();
}
