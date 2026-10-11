import { useCallback, useEffect, useRef } from 'react';
import { usePlayerStore } from '../state/playerStore';

const HIDE_DELAY = 2500;

export function useIdleHide(): void {
  const timer = useRef<number | undefined>(undefined);

  const reset = useCallback(() => {
    usePlayerStore.getState().setControlsVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const s = usePlayerStore.getState();
      if (s.playing && s.hasMedia) s.setControlsVisible(false);
    }, HIDE_DELAY);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'wheel'] as const;
    for (const ev of events) {
      window.addEventListener(ev, reset, { passive: true });
    }
    reset();
    return () => {
      for (const ev of events) window.removeEventListener(ev, reset);
      window.clearTimeout(timer.current);
    };
  }, [reset]);

  useEffect(() => {
    const unsub = usePlayerStore.subscribe((s, prev) => {
      if (s.playing !== prev.playing || s.hasMedia !== prev.hasMedia) reset();
    });
    return unsub;
  }, [reset]);
}