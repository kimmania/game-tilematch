export type TileColor = 'ruby' | 'sapphire' | 'emerald' | 'amber' | 'amethyst';

export type Coord = { row: number; col: number };

export type Cell = {
  tile: TileColor | null;
};

export type Grid = Cell[][];

export type ScoreGoal = {
  type: 'score';
  target: number;
};

export type LevelGoal = ScoreGoal;

export type LevelDef = {
  id: number;
  name: string;
  rows: number;
  cols: number;
  moves: number;
  /** Number of distinct tile colors (3–5). */
  colors: number;
  seed: number;
  goals: LevelGoal[];
  /** Score thresholds for 1★, 2★, 3★. */
  stars: [number, number, number];
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type GameState = {
  levelId: number;
  rows: number;
  cols: number;
  grid: Grid;
  palette: TileColor[];
  movesLeft: number;
  score: number;
  status: GameStatus;
  rngState: number;
  goals: LevelGoal[];
  stars: [number, number, number];
};

export type MatchGroup = {
  cells: Coord[];
  length: number;
};

export type CascadeStep = {
  matches: MatchGroup[];
  cleared: Coord[];
  points: number;
  combo: number;
};

export type SwapFailureReason =
  | 'not-playing'
  | 'not-adjacent'
  | 'empty-cell'
  | 'no-match';

export type SwapResult =
  | { ok: false; reason: SwapFailureReason }
  | { ok: true; state: GameState; steps: CascadeStep[] };
