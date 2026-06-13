import { isEditMode } from './editor/editMode';
import { bootstrapEditor } from './editor/editorApp';

if (isEditMode()) {
  bootstrapEditor().catch((error) => {
    console.error('Failed to start editor:', error);
  });
} else {
  import('./bootstrapGame').then(({ startGame }) => startGame());
}
