import type { EditorDraft } from './editorState';

const STORAGE_KEY = 'tilematch-editor-draft';

export function saveEditorDraft(draft: EditorDraft): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadEditorDraft(): EditorDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EditorDraft;
  } catch {
    return null;
  }
}

export function clearEditorDraft(): void {
  localStorage.removeItem(STORAGE_KEY);
}
