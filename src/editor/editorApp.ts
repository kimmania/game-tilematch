import { fetchLevel } from '../core/levels';
import { gameBaseUrl } from './editMode';
import { createEditorBoard } from './editorBoard';
import {
  downloadLevelJson,
  prepareLevelExport,
  previewLevelExport,
} from './editorExport';
import { importDraftFromJson, readClipboardText } from './editorImport';
import { loadEditorDraft, saveEditorDraft } from './editorStorage';
import {
  applyTool,
  createEmptyDraft,
  draftFromLevel,
  draftSummary,
  normalizeDraftBounds,
  type EditorDraft,
  type EditorTool,
} from './editorState';

const TOOL_HINTS: Record<EditorTool, string> = {
  jelly: 'Tap a cell to toggle jelly (background goal tile).',
  crate: 'Tap to cycle crate: none → 1 layer → 2 layers → remove.',
  ice: 'Tap to cycle ice: none → 1 layer → 2 layers → remove.',
  erase: 'Tap to remove jelly, crate, and ice from a cell.',
};

async function loadInitialDraft(): Promise<EditorDraft> {
  const levelParam = new URLSearchParams(window.location.search).get('level');
  if (levelParam) {
    const levelId = Number(levelParam);
    if (Number.isFinite(levelId) && levelId >= 1) {
      try {
        return draftFromLevel(await fetchLevel(levelId));
      } catch {
        /* fall through */
      }
    }
  }

  const saved = loadEditorDraft();
  if (saved) {
    const restore = window.confirm('Restore your last saved editor draft?');
    if (restore) return saved;
  }

  return createEmptyDraft();
}

function bindNumberInput(input: HTMLInputElement, apply: (value: number) => void): void {
  input.addEventListener('change', () => {
    const value = Number(input.value);
    if (Number.isFinite(value)) apply(value);
  });
}

export async function bootstrapEditor(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  const draft = await loadInitialDraft();
  let tool: EditorTool = 'jelly';

  app.innerHTML = '';
  app.className = 'editor-app';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div>
      <h1 class="title">Level editor</h1>
      <a class="level-meta-btn" href="${gameBaseUrl()}">← Back to game</a>
    </div>
  `;

  const toolbar = document.createElement('div');
  toolbar.className = 'editor-toolbar';
  toolbar.setAttribute('role', 'toolbar');

  const tools: { id: EditorTool; label: string }[] = [
    { id: 'jelly', label: 'Jelly' },
    { id: 'crate', label: 'Crate' },
    { id: 'ice', label: 'Ice' },
    { id: 'erase', label: 'Erase' },
  ];

  const toolButtons = new Map<EditorTool, HTMLButtonElement>();
  for (const entry of tools) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn editor-tool-btn';
    btn.textContent = entry.label;
    btn.addEventListener('click', () => selectTool(entry.id));
    toolButtons.set(entry.id, btn);
    toolbar.appendChild(btn);
  }

  const metaForm = document.createElement('div');
  metaForm.className = 'editor-meta-form';

  function field(label: string, input: HTMLInputElement): HTMLLabelElement {
    const wrap = document.createElement('label');
    wrap.className = 'editor-field';
    const span = document.createElement('span');
    span.textContent = label;
    wrap.append(span, input);
    return wrap;
  }

  const idInput = document.createElement('input');
  idInput.type = 'number';
  idInput.min = '1';
  idInput.value = String(draft.id);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = draft.name;

  const rowsInput = document.createElement('input');
  rowsInput.type = 'number';
  rowsInput.min = '5';
  rowsInput.max = '10';
  rowsInput.value = String(draft.rows);

  const colsInput = document.createElement('input');
  colsInput.type = 'number';
  colsInput.min = '5';
  colsInput.max = '10';
  colsInput.value = String(draft.cols);

  const movesInput = document.createElement('input');
  movesInput.type = 'number';
  movesInput.min = '1';
  movesInput.value = String(draft.moves);

  const colorsInput = document.createElement('input');
  colorsInput.type = 'number';
  colorsInput.min = '3';
  colorsInput.max = '5';
  colorsInput.value = String(draft.colors);

  const seedInput = document.createElement('input');
  seedInput.type = 'number';
  seedInput.value = String(draft.seed);

  const scoreInput = document.createElement('input');
  scoreInput.type = 'number';
  scoreInput.min = '1';
  scoreInput.value = String(draft.scoreTarget);

  const star2Input = document.createElement('input');
  star2Input.type = 'number';
  star2Input.min = '1';
  star2Input.value = String(draft.starTwo);

  const star3Input = document.createElement('input');
  star3Input.type = 'number';
  star3Input.min = '1';
  star3Input.value = String(draft.starThree);

  const jellyGoalCheck = document.createElement('input');
  jellyGoalCheck.type = 'checkbox';
  jellyGoalCheck.checked = draft.includeJellyGoal;

  metaForm.append(
    field('Id', idInput),
    field('Name', nameInput),
    field('Rows', rowsInput),
    field('Cols', colsInput),
    field('Moves', movesInput),
    field('Colors', colorsInput),
    field('Seed', seedInput),
    field('Score goal', scoreInput),
    field('2★ score', star2Input),
    field('3★ score', star3Input),
  );

  const jellyGoalLabel = document.createElement('label');
  jellyGoalLabel.className = 'editor-field editor-field-check';
  jellyGoalLabel.append(jellyGoalCheck, document.createTextNode(' Jelly goal (all jelly cells)'));

  metaForm.appendChild(jellyGoalLabel);

  const hint = document.createElement('p');
  hint.className = 'hint editor-hint';

  const status = document.createElement('p');
  status.className = 'editor-status';
  status.setAttribute('role', 'status');

  const boardHost = document.createElement('div');
  boardHost.className = 'editor-board-host';

  const actions = document.createElement('div');
  actions.className = 'editor-actions';

  const previewBtn = document.createElement('button');
  previewBtn.type = 'button';
  previewBtn.className = 'btn';
  previewBtn.textContent = 'Validate';

  const saveDraftBtn = document.createElement('button');
  saveDraftBtn.type = 'button';
  saveDraftBtn.className = 'btn';
  saveDraftBtn.textContent = 'Save draft';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'btn btn-primary';
  copyBtn.textContent = 'Copy JSON';

  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'btn btn-primary';
  downloadBtn.textContent = 'Download .json';

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'btn';
  importBtn.textContent = 'Import JSON';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn';
  clearBtn.textContent = 'Clear layout';

  actions.append(previewBtn, saveDraftBtn, importBtn, copyBtn, downloadBtn, clearBtn);

  app.append(header, toolbar, metaForm, hint, boardHost, status, actions);

  const board = createEditorBoard(boardHost, (row, col) => {
    applyTool(draft, tool, row, col);
    refresh();
  });

  function readForm(): void {
    draft.id = Math.max(1, Math.floor(Number(idInput.value) || draft.id));
    draft.name = nameInput.value;
    draft.rows = Math.min(10, Math.max(5, Math.floor(Number(rowsInput.value) || draft.rows)));
    draft.cols = Math.min(10, Math.max(5, Math.floor(Number(colsInput.value) || draft.cols)));
    draft.moves = Math.max(1, Math.floor(Number(movesInput.value) || draft.moves));
    draft.colors = Math.min(5, Math.max(3, Math.floor(Number(colorsInput.value) || draft.colors)));
    draft.seed = Math.floor(Number(seedInput.value) || draft.seed);
    draft.scoreTarget = Math.max(1, Math.floor(Number(scoreInput.value) || draft.scoreTarget));
    draft.starTwo = Math.max(draft.scoreTarget + 1, Math.floor(Number(star2Input.value) || draft.starTwo));
    draft.starThree = Math.max(draft.starTwo + 1, Math.floor(Number(star3Input.value) || draft.starThree));
    draft.includeJellyGoal = jellyGoalCheck.checked;
    normalizeDraftBounds(draft);
  }

  function refresh(): void {
    readForm();
    board.render(draft, tool);
    hint.textContent = `${draftSummary(draft)} · ${TOOL_HINTS[tool]}`;
    for (const [id, btn] of toolButtons) {
      btn.classList.toggle('editor-tool-active', id === tool);
    }
  }

  function selectTool(next: EditorTool): void {
    tool = next;
    refresh();
  }

  bindNumberInput(idInput, () => {});
  bindNumberInput(rowsInput, () => refresh());
  bindNumberInput(colsInput, () => refresh());
  jellyGoalCheck.addEventListener('change', () => refresh());

  previewBtn.addEventListener('click', () => {
    readForm();
    const result = previewLevelExport(draft);
    status.textContent = result.message;
    status.dataset.variant = result.valid && result.playable ? 'ok' : 'error';
  });

  saveDraftBtn.addEventListener('click', () => {
    readForm();
    saveEditorDraft(draft);
    status.textContent = 'Draft saved locally.';
    status.dataset.variant = 'ok';
  });

  copyBtn.addEventListener('click', async () => {
    readForm();
    const result = prepareLevelExport(draft);
    if (!result.ok) {
      status.textContent = result.message;
      status.dataset.variant = 'error';
      return;
    }
    await navigator.clipboard.writeText(result.json);
    status.textContent = `Copied level ${result.level.id} JSON to clipboard.`;
    status.dataset.variant = 'ok';
  });

  downloadBtn.addEventListener('click', () => {
    readForm();
    const result = prepareLevelExport(draft);
    if (!result.ok) {
      status.textContent = result.message;
      status.dataset.variant = 'error';
      return;
    }
    downloadLevelJson(result.level, result.json);
    status.textContent = `Downloaded ${result.level.id}.json`;
    status.dataset.variant = 'ok';
  });

  importBtn.addEventListener('click', async () => {
    try {
      const raw = window.prompt('Paste level JSON:', await readClipboardText().catch(() => ''));
      if (!raw?.trim()) return;
      Object.assign(draft, importDraftFromJson(raw));
      idInput.value = String(draft.id);
      nameInput.value = draft.name;
      rowsInput.value = String(draft.rows);
      colsInput.value = String(draft.cols);
      movesInput.value = String(draft.moves);
      colorsInput.value = String(draft.colors);
      seedInput.value = String(draft.seed);
      scoreInput.value = String(draft.scoreTarget);
      star2Input.value = String(draft.starTwo);
      star3Input.value = String(draft.starThree);
      jellyGoalCheck.checked = draft.includeJellyGoal;
      refresh();
      status.textContent = `Imported level ${draft.id}.`;
      status.dataset.variant = 'ok';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Import failed';
      status.dataset.variant = 'error';
    }
  });

  clearBtn.addEventListener('click', () => {
    if (!window.confirm('Clear all jelly, crates, and ice?')) return;
    draft.jelly = [];
    draft.crates = [];
    draft.ice = [];
    refresh();
  });

  refresh();
}
