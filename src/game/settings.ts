export type GameSettings = {
  reduceMotion: boolean;
};

const SETTINGS_KEY = 'tilematch-settings';

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { reduceMotion: false };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return { reduceMotion: parsed.reduceMotion === true };
  } catch {
    return { reduceMotion: false };
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
