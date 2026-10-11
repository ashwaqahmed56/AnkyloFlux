import { useEffect } from 'react';
import { isDesktop, mpvEngine } from '../engine';
import { usePlayerStore } from '../state/playerStore';

const TARGET_ID = 'ankylo-video';
const INSETS = ['ankylo-topbar', 'ankylo-controls'];
const PANELS = ['info', 'playlist', 'adjustments'];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function sizeOf(el: Element | null): { w: number; h: number } {
  if (!el) return { w: 0, h: 0 };
  const r = el.getBoundingClientRect();
  return { w: r.width, h: r.height };
}

/**
 * The area the mpv output should cover: the video target minus the chrome that
 * floats on top of it. The target element differs between the full player and
 * the mini player, so it is resolved by id on every tick instead of being held
 * by ref - that way switching layouts never orphans or double-books the surface.
 *
 * Opacity is deliberately not consulted. The topbar and controls only fade, so
 * they keep reserving their box; treating them as gone would grow the mpv
 * surface underneath them and swallow their clicks.
 */
function compute(): Rect | null {
  const el = document.getElementById(TARGET_ID);
  if (!el) return null;

  const s = usePlayerStore.getState();
  if (s.paletteOpen || s.settingsOpen || s.urlOpen || s.aboutOpen) {
    return null;
  }

  const base = el.getBoundingClientRect();

  let top = 0;
  let bottom = 0;
  for (const id of INSETS) {
    const { h } = sizeOf(document.getElementById(id));
    if (id === 'ankylo-topbar') top = h;
    else bottom = h;
  }

  let leftPanel = 0;
  let rightPanel = 0;
  for (const name of PANELS) {
    const panelEl = document.querySelector(`[data-side-panel="${name}"]`);
    if (panelEl) {
      const rect = panelEl.getBoundingClientRect();
      if (rect.width > 0) {
        if (rect.left < window.innerWidth / 2) {
          leftPanel = Math.max(leftPanel, rect.width);
        } else {
          rightPanel = Math.max(rightPanel, rect.width);
        }
      }
    }
  }

  return {
    x: base.left + leftPanel,
    y: base.top + top,
    w: Math.max(0, base.width - leftPanel - rightPanel),
    h: Math.max(0, base.height - top - bottom),
  };
}

export function useVideoRect(enabled: boolean): void {
  useEffect(() => {
    if (!isDesktop || !enabled) return;

    let frame = 0;
    let last = '';
    let hidden = false;

    const sync = () => {
      const r = compute();
      if (!r || r.w < 4 || r.h < 4) {
        if (!hidden) {
          hidden = true;
          last = '';
          mpvEngine()?.hideVideoRect();
        }
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const x = Math.round(r.x * dpr);
      const y = Math.round(r.y * dpr);
      const w = Math.round(r.w * dpr);
      const h = Math.round(r.h * dpr);

      const key = `${x},${y},${w},${h}`;
      if (key === last) return;

      last = key;
      hidden = false;
      mpvEngine()?.syncVideoRect(x, y, w, h);
    };

    // One owner for the whole app, driven per frame: the mini player is moved
    // with a CSS transform and the chrome animates, neither of which raises a
    // resize event. Nothing reaches Rust unless the rect actually moved.
    const loop = () => {
      sync();
      frame = window.requestAnimationFrame(loop);
    };

    sync();
    frame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frame);
      mpvEngine()?.hideVideoRect();
    };
  }, [enabled]);
}
