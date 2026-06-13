import { dismissMechanic, type TutorialId } from '../game/tutorial';

type TutorialStep = {
  title: string;
  body: string;
};

const STEPS: Record<TutorialId, TutorialStep[]> = {
  basics: [
    {
      title: 'Tap to swap',
      body: 'Tap a tile, then tap a neighbor (up, down, left, or right) to swap them. Diagonal swaps are not allowed.',
    },
    {
      title: 'Make a match',
      body: 'Line up 3 or more tiles of the same color in a row or column. Matched tiles clear, new ones fall in, and you score points.',
    },
    {
      title: 'Valid swaps only',
      body: 'A swap must create at least one match. If nothing would match, the tiles bounce back and that move is not counted.',
    },
    {
      title: 'Score and moves',
      body: 'Reach the level goal before you run out of moves. Earn up to 3 stars by scoring higher than the target.',
    },
  ],
  rocket: [
    {
      title: 'Rockets',
      body: 'Match 4 tiles in a straight line to create a rocket. Rockets clear an entire row or column when activated.',
    },
    {
      title: 'Special combos',
      body: 'Swap two special tiles together for a bigger blast. Try matching a rocket with a bomb!',
    },
  ],
  jelly: [
    {
      title: 'Jelly tiles',
      body: 'Some cells have jelly underneath. Clear the tile on top to remove the jelly — it counts toward your goal.',
    },
    {
      title: 'Specials help',
      body: 'Rockets, bombs, and propellers all clear jelly. Use them to reach the jelly target faster.',
    },
  ],
  'crate-ice': [
    {
      title: 'Crates and ice',
      body: 'Crates block tiles until you match next to them. Ice freezes tiles — chip away layers before the tile can move.',
    },
    {
      title: 'Adjacent hits',
      body: 'Matches and specials next to ice remove one layer. Break crates the same way.',
    },
  ],
  collect: [
    {
      title: 'Collect items',
      body: 'Cherries and coins sit on the board. Match on or next to them to collect — they count toward your goal.',
    },
    {
      title: 'Plan your clears',
      body: 'Static collectibles do not fall. Clear nearby tiles to reach items tucked in corners.',
    },
  ],
  drop: [
    {
      title: 'Drop items',
      body: 'Some items fall with gravity when tiles below them clear. Guide cherries to the bottom row to collect them.',
    },
    {
      title: 'Keep a path open',
      body: 'Items rest on tiles until the path opens. Clear columns so drops can reach the bottom.',
    },
  ],
  grass: [
    {
      title: 'Spread the grass',
      body: 'Green grass starts on seed tiles. When a match touches grass (on or next to it), grass spreads to every tile in that match.',
    },
    {
      title: 'Cover the goal',
      body: 'Spread grass onto all dashed-green goal tiles before you run out of moves.',
    },
  ],
  'color-bomb': [
    {
      title: 'Color bomb',
      body: 'Match 5 tiles in a straight row or column to create a color bomb — look for the rainbow disc on the tile.',
    },
    {
      title: 'Clear a color',
      body: 'Swap or match the color bomb to remove every tile of that color on the board. On this level, you need a big color-bomb blast to reach the score goal.',
    },
  ],
};

export const HELP_TOPICS: { id: TutorialId; label: string }[] = [
  { id: 'basics', label: 'Matching & goals' },
  { id: 'rocket', label: 'Rockets & combos' },
  { id: 'jelly', label: 'Jelly tiles' },
  { id: 'crate-ice', label: 'Crates & ice' },
  { id: 'collect', label: 'Collect items' },
  { id: 'drop', label: 'Drop items' },
  { id: 'grass', label: 'Grass goals' },
  { id: 'color-bomb', label: 'Color bomb' },
];

export type TutorialOverlayOptions = {
  /** Review from Help — do not mark the mechanic as dismissed. */
  review?: boolean;
};

export function openTutorialOverlay(
  id: TutorialId,
  onClose: () => void,
  options: TutorialOverlayOptions = {},
): void {
  closeTutorialOverlay();

  const steps = STEPS[id];
  const review = options.review === true;
  let stepIndex = 0;

  const overlay = document.createElement('div');
  overlay.id = 'tutorial-overlay';
  overlay.className = 'modal-overlay tutorial-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'tutorial-title');

  const panel = document.createElement('div');
  panel.className = 'modal-panel tutorial-panel';

  const kicker = document.createElement('p');
  kicker.className = 'tutorial-kicker';
  kicker.textContent = review ? 'Help' : 'How to play';

  const title = document.createElement('h2');
  title.id = 'tutorial-title';
  title.className = 'modal-title tutorial-title';

  const body = document.createElement('p');
  body.className = 'tutorial-body';

  const progress = document.createElement('p');
  progress.className = 'tutorial-progress';
  progress.setAttribute('aria-live', 'polite');

  const actions = document.createElement('div');
  actions.className = 'tutorial-actions';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn';
  backBtn.textContent = 'Back';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn btn-primary';
  nextBtn.textContent = 'Next';

  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'btn tutorial-skip';
  skipBtn.textContent = review ? 'Back to help' : 'Skip tutorial';

  function finish(): void {
    if (!review) dismissMechanic(id);
    closeTutorialOverlay();
    onClose();
  }

  function renderStep(): void {
    const step = steps[stepIndex]!;
    title.textContent = step.title;
    body.textContent = step.body;
    progress.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
    backBtn.disabled = stepIndex === 0;
    nextBtn.textContent =
      stepIndex === steps.length - 1 ? (review ? 'Done' : 'Start playing') : 'Next';
    nextBtn.focus();
  }

  backBtn.addEventListener('click', () => {
    if (stepIndex > 0) {
      stepIndex -= 1;
      renderStep();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (stepIndex < steps.length - 1) {
      stepIndex += 1;
      renderStep();
      return;
    }
    finish();
  });

  skipBtn.addEventListener('click', finish);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) finish();
  });

  actions.append(backBtn, nextBtn);
  panel.append(kicker, title, body, progress, actions, skipBtn);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  renderStep();
}

export function openHelpOverlay(onClose: () => void = () => {}): void {
  closeHelpOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'help-overlay';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'help-title');

  const panel = document.createElement('div');
  panel.className = 'modal-panel help-panel';

  const title = document.createElement('h2');
  title.id = 'help-title';
  title.className = 'modal-title';
  title.textContent = 'How to play';

  const intro = document.createElement('p');
  intro.className = 'help-intro';
  intro.textContent =
    'Pick a topic to review the rules. You can reopen this anytime from Settings.';

  const topics = document.createElement('div');
  topics.className = 'help-topics';

  for (const topic of HELP_TOPICS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn help-topic-btn';
    btn.textContent = topic.label;
    btn.addEventListener('click', () => {
      closeHelpOverlay();
      openTutorialOverlay(topic.id, () => openHelpOverlay(onClose), { review: true });
    });
    topics.appendChild(btn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn modal-close';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => {
    closeHelpOverlay();
    onClose();
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeHelpOverlay();
      onClose();
    }
  });

  panel.append(title, intro, topics, closeBtn);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  closeBtn.focus();
}

export function closeHelpOverlay(): void {
  document.getElementById('help-overlay')?.remove();
}

export function isHelpOpen(): boolean {
  return document.getElementById('help-overlay') !== null;
}

export function closeTutorialOverlay(): void {
  document.getElementById('tutorial-overlay')?.remove();
}

export function isTutorialOpen(): boolean {
  return document.getElementById('tutorial-overlay') !== null;
}
