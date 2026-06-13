export type TileColor = 'ruby' | 'sapphire' | 'emerald' | 'amber' | 'amethyst';

export type SpecialKind = 'rocket-h' | 'rocket-v' | 'bomb' | 'color-bomb' | 'propeller';

export type Tile = {
  color: TileColor;
  special?: SpecialKind;
};

export type Coord = { row: number; col: number };

export type CollectibleKind = 'cherry' | 'coin';

export type Cell = {
  tile: Tile | null;
  /** Background jelly — cleared when this cell is hit by a match or special. */
  jelly: boolean;
  /** Fixed blocker; no tile until layers reach 0. */
  crateLayers: number;
  /** Frozen layers on the tile — must chip away before the tile can move. */
  iceLayers: number;
  /** Static collectible — collected when this cell or a neighbor is hit. */
  collectible: CollectibleKind | null;
  /** Falling item — drops with gravity and exits at the bottom row. */
  drop: CollectibleKind | null;
  /** Spreadable grass/carpet — grows when matches touch it. */
  grass: boolean;
};

export type Grid = Cell[][];

export type ScoreGoal = { type: 'score'; target: number };
export type JellyGoal = { type: 'jelly'; target: number };
export type CollectGoal = { type: 'collect'; target: number; item: CollectibleKind };
export type DropGoal = { type: 'drop'; target: number; item: CollectibleKind };
export type GrassGoal = { type: 'grass'; target: number };
export type LevelGoal = ScoreGoal | JellyGoal | CollectGoal | DropGoal | GrassGoal;

export type CrateDef = { row: number; col: number; layers: number };
export type IceDef = { row: number; col: number; layers: number };
export type CollectDef = { row: number; col: number; kind: CollectibleKind };
export type DropDef = { row: number; col: number; kind: CollectibleKind };

export type LevelLayout = {
  jelly?: Coord[];
  crates?: CrateDef[];
  ice?: IceDef[];
  collect?: CollectDef[];
  drops?: DropDef[];
  /** Cells that must have grass spread onto them by end of level. */
  grass?: Coord[];
  /** Cells that start with grass (carpet seeds). */
  grassSeeds?: Coord[];
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

export type CollectibleCounts = Record<CollectibleKind, number>;

export function emptyCollectibleCounts(): CollectibleCounts {
  return { cherry: 0, coin: 0 };
}

export type GoalProgress = {
  score: number;
  jellyCleared: number;
  collected: CollectibleCounts;
  dropped: CollectibleCounts;
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
  grassTargets: Coord[];
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
