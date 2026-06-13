import { dismissMechanic, type TutorialId } from '../game/tutorial';

type TutorialStep = {
  title: string;
  body: string;
};

const STEPS: Record<TutorialId, TutorialStep[]> = {
  basics: [
    {
      title: 'Swap to match',
      body: 'Tap a tile, then tap an adjacent tile to swap. Match 3 or more of the same color in a row or column to clear them.',
    },
    {
      title: 'Score and moves',
      body: 'Reach the score goal before you run out of moves. Earn up to 3 stars by scoring higher.',
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

export function openTutorialOverlay(id: TutorialId, onClose: () => void): void {
  closeTutorialOverlay();

  const steps = STEPS[id];
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
  kicker.textContent = 'How to play';

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
  skipBtn.textContent = 'Skip tutorial';

  function finish(): void {
    dismissMechanic(id);
    closeTutorialOverlay();
    onClose();
  }

  function renderStep(): void {
    const step = steps[stepIndex]!;
    title.textContent = step.title;
    body.textContent = step.body;
    progress.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
    backBtn.disabled = stepIndex === 0;
    nextBtn.textContent = stepIndex === steps.length - 1 ? 'Start playing' : 'Next';
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

export function closeTutorialOverlay(): void {
  document.getElementById('tutorial-overlay')?.remove();
}

export function isTutorialOpen(): boolean {
  return document.getElementById('tutorial-overlay') !== null;
}
