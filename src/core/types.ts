export type TileColor = 'ruby' | 'sapphire' | 'emerald' | 'amber' | 'amethyst';

export type SpecialKind = 'rocket-h' | 'rocket-v' | 'bomb' | 'propeller';

export type Tile = {
  color: TileColor;
  special?: SpecialKind;
};

export type Coord = { row: number; col: number };

export type Cell = {
  tile: Tile | null;
  /** Background jelly — cleared when this cell is hit by a match or special. */
  jelly: boolean;
  /** Fixed blocker; no tile until layers reach 0. */
  crateLayers: number;
  /** Frozen layers on the tile — must chip away before the tile can move. */
  iceLayers: number;
};

export type Grid = Cell[][];

export type ScoreGoal = { type: 'score'; target: number };
export type JellyGoal = { type: 'jelly'; target: number };
export type LevelGoal = ScoreGoal | JellyGoal;

export type CrateDef = { row: number; col: number; layers: number };
export type IceDef = { row: number; col: number; layers: number };

export type LevelLayout = {
  jelly?: Coord[];
  crates?: CrateDef[];
  ice?: IceDef[];
};

export type LevelDef = {
  id: number;
  name: string;
  rows: number;
  cols: number;
  moves: number;
  colors: number;
  seed: number;
  goals: LevelGoal[];
  stars: [number, number, number];
  layout?: LevelLayout;
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type GoalProgress = {
  score: number;
  jellyCleared: number;
};

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
  progress: GoalProgress;
  totalJelly: number;
};

export type MatchGroup = {
  cells: Coord[];
  length: number;
};

export type CascadeStep = {
  matches: MatchGroup[];
  cleared: Coord[];
  spawned?: { coord: Coord; special: SpecialKind; color: TileColor };
  activated?: SpecialKind[];
  points: number;
  combo: number;
};

export type SwapFailureReason =
  | 'not-playing'
  | 'not-adjacent'
  | 'empty-cell'
  | 'blocked'
  | 'no-match';

export type SwapResult =
  | { ok: false; reason: SwapFailureReason }
  | { ok: true; state: GameState; steps: CascadeStep[] };

export type SpecialSpawn = {
  coord: Coord;
  special: SpecialKind;
  color: TileColor;
};
