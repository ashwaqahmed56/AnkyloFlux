import type { PlayerEngine } from './types';
import { MseEngine } from './MseEngine';
import { MpvEngine } from './MpvEngine';

function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window
  );
}

export const isDesktop = isTauri();

export const engine: PlayerEngine = isTauri()
  ? new MpvEngine()
  : new MseEngine();

export function mpvEngine(): MpvEngine | null {
  return isTauri() ? (engine as MpvEngine) : null;
}
