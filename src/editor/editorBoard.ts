import { TILE_CSS } from '../core/tileColors';
import type { EditorDraft, EditorTool } from './editorState';

export type EditorBoard = {
  render: (draft: EditorDraft, tool: EditorTool) => void;
};

export function createEditorBoard(
  host: HTMLElement,
  onCellTap: (row: number, col: number) => void,
): EditorBoard {
  const root = document.createElement('div');
  root.className = 'editor-grid-board';
  host.replaceChildren(root);

  function render(draft: EditorDraft, tool: EditorTool): void {
    root.style.setProperty('--grid-cols', String(draft.cols));
    root.replaceChildren();

    for (let row = 0; row < draft.rows; row += 1) {
      for (let col = 0; col < draft.cols; col += 1) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'editor-grid-cell';
        btn.dataset.row = String(row);
        btn.dataset.col = String(col);

        const jelly = draft.jelly.some((c) => c.row === row && c.col === col);
        const crate = draft.crates.find((c) => c.row === row && c.col === col)?.layers ?? 0;
        const ice = draft.ice.find((c) => c.row === row && c.col === col)?.layers ?? 0;

        if (jelly) btn.classList.add('has-jelly');
        if (crate > 0) btn.classList.add('has-crate');
        if (ice > 0) btn.classList.add('has-ice');

        const parts: string[] = [`${row},${col}`];
        if (jelly) parts.push('jelly');
        if (crate > 0) parts.push(`crate×${crate}`);
        if (ice > 0) parts.push(`ice×${ice}`);
        btn.setAttribute('aria-label', parts.join(' · '));

        if (crate > 0) {
          const el = document.createElement('span');
          el.className = 'blocker crate';
          el.textContent = String(crate);
          btn.appendChild(el);
        } else {
          const dot = document.createElement('span');
          dot.className = 'editor-cell-dot';
          dot.style.setProperty('--tile-bg', TILE_CSS.sapphire.bg);
          btn.appendChild(dot);
        }

        if (ice > 0) {
          const el = document.createElement('span');
          el.className = 'blocker ice';
          el.textContent = String(ice);
          btn.appendChild(el);
        }

        btn.title = `Tool: ${tool}`;
        btn.addEventListener('click', () => onCellTap(row, col));
        root.appendChild(btn);
      }
    }
  }

  return { render };
}
