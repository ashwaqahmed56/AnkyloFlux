import { useEffect } from 'react';
import { usePlayerStore } from '../state/playerStore';
import { getActions, keyEventToString } from '../state/actions';

export function useKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target !== null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const s = usePlayerStore.getState();

      if (typing) {
        if (e.key === 'Escape') target?.blur();
        return;
      }

      if (e.key === 'Escape') {
        if (s.paletteOpen) { s.setPaletteOpen(false); e.preventDefault(); return; }
        if (s.settingsOpen) { s.setSettingsOpen(false); e.preventDefault(); return; }
        if (s.aboutOpen) { s.setAboutOpen(false); e.preventDefault(); return; }
        if (s.urlOpen) { s.setUrlOpen(false); e.preventDefault(); return; }
        if (s.contextMenu) { s.closeContextMenu(); e.preventDefault(); return; }
        if (s.menu) { s.setMenu(null); e.preventDefault(); return; }
        if (s.mini) { s.toggleMini(); e.preventDefault(); return; }
      }

      const combo = keyEventToString(e);
      const actions = getActions();
      const match = actions.find((a) => a.keys.includes(combo));
      if (match) {
        e.preventDefault();
        s.setControlsVisible(true);
        match.run();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}