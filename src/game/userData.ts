import { clearEditorDraft } from '../editor/editorStorage';
import { clearTutorialDismissals } from './tutorial';
import { clearAllSessions, PROGRESS_STORAGE_KEY } from './storage';

const SETTINGS_STORAGE_KEY = 'tilematch-settings';
const INSTALL_HINT_STORAGE_KEY = 'tilematch-install-hint';

export function clearAllUserData(): void {
  localStorage.removeItem(PROGRESS_STORAGE_KEY);
  clearAllSessions();
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
  clearEditorDraft();
  localStorage.removeItem(INSTALL_HINT_STORAGE_KEY);
  clearTutorialDismissals();
}
