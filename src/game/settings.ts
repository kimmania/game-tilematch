export type GameSettings = {
  sound: boolean;
  haptic: boolean;
  reduceMotion: boolean;
};

const SETTINGS_KEY = 'tilematch-settings';

const DEFAULTS: GameSettings = {
  sound: true,
  haptic: true,
  reduceMotion: false,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS, reduceMotion: prefersReducedMotion() };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      sound: parsed.sound ?? DEFAULTS.sound,
      haptic: parsed.haptic ?? DEFAULTS.haptic,
      reduceMotion: parsed.reduceMotion ?? prefersReducedMotion(),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
