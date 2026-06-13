import type { GameSettings } from './settings';

let enabled = true;

export function configureHaptics(settings: GameSettings): void {
  enabled = settings.haptic;
}

export function pulseHaptic(pattern: number | number[] = 8): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}
