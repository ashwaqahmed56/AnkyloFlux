import { useEffect } from 'react';
import { bindEngine } from './state/host';
import { usePlayerStore } from './state/playerStore';
import { useSettingsStore } from './state/settingsStore';
import { engine, isDesktop } from './engine';
import { useKeyboard } from './hooks/useKeyboard';
import { useIdleHide } from './hooks/useIdleHide';
import { useDragDrop } from './hooks/useDragDrop';
import { useVideoRect } from './hooks/useVideoRect';
import { openPaths } from './hooks/useDragDrop';
import { PlayerSurface } from './components/PlayerSurface';
import { ControlsBar } from './components/ControlsBar';
import { TopBar } from './components/TopBar';
import { ContextMenu } from './components/ContextMenu';
import { CommandPalette } from './components/CommandPalette';
import { AdjustmentsPanel } from './components/AdjustmentsPanel';
import { InfoPanel } from './components/InfoPanel';
import { PlaylistPanel } from './components/PlaylistPanel';
import { SettingsDialog, UrlDialog } from './components/SettingsDialog';
import { AboutDialog } from './components/AboutDialog';
import { MiniPlayer } from './components/MiniPlayer';
import { Toasts } from './components/Toasts';
import { DownloadBar } from './components/DownloadBar';

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);
  const mini = usePlayerStore((s) => s.mini);
  const hasMedia = usePlayerStore((s) => s.hasMedia);

  useKeyboard();
  useIdleHide();
  useDragDrop();
  useVideoRect(isDesktop && hasMedia);

  useEffect(() => {
    bindEngine();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.accent = accent;
  }, [theme, accent]);

  useEffect(() => {
    const onFs = () => usePlayerStore.getState().setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    const onPip = () => usePlayerStore.getState().setIsPip(Boolean(document.pictureInPictureElement));
    document.addEventListener('enterpictureinpicture', onPip);
    document.addEventListener('leavepictureinpicture', onPip);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('enterpictureinpicture', onPip);
      document.removeEventListener('leavepictureinpicture', onPip);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const report = (msg: string) => {
      void import('@tauri-apps/api/core')
        .then((m) => m.invoke('diag', { msg }))
        .catch(() => undefined);
    };
    window.addEventListener('error', (e) => report(`JS error: ${e.message} @${e.filename}:${e.lineno}`));
    window.addEventListener('unhandledrejection', (e) =>
      report(`JS rejection: ${String(e.reason)}`),
    );
    void report('handlers installed');
  }, []);

  useEffect(() => {
    void (async () => {
      if (!isDesktop) return;
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        await invoke('diag', { msg: `mounted (engine=${isDesktop})` });
        const target = await invoke<string | null>('take_startup_target').catch(() => null);
        await invoke('diag', { msg: `startup target = ${target ?? 'none'}` });
        if (target) usePlayerStore.getState().openPath(target);
      } catch (e) {
        await invoke('diag', { msg: `diag failed: ${e}` }).catch(() => undefined);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    let unlistenDrop: (() => void) | undefined;

    void (async () => {
      const { getCurrentWebview } = await import('@tauri-apps/api/webview');
      const stop = await getCurrentWebview().onDragDropEvent((event) => {
        if (event.payload.type === 'over') {
          usePlayerStore.getState().setDragOver(true);
        } else if (event.payload.type === 'drop') {
          usePlayerStore.getState().setDragOver(false);
          openPaths(event.payload.paths);
        } else {
          usePlayerStore.getState().setDragOver(false);
        }
      });
      unlistenDrop = stop;
    })();

    return () => unlistenDrop?.();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => undefined);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const s = usePlayerStore.getState();
    engine.setVolume(s.volume);
    engine.setMuted(s.muted);
    const st = useSettingsStore.getState();
    engine.setSpeed(st.defaultSpeed);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-base text-ink">
      <SharpnessFilter />

      {!mini ? (
        <>
          <PlayerSurface />
          <TopBar />
          <ControlsBar />
          <AdjustmentsPanel />
          <InfoPanel />
          <PlaylistPanel />
        </>
      ) : (
        <MiniPlayer />
      )}

      <ContextMenu />
      <DownloadBar />
      <CommandPalette />
      <SettingsDialog />
      <AboutDialog />
      <UrlDialog />
      <Toasts />
    </div>
  );
}

function SharpnessFilter() {
  useEffect(() => {
    window.__ankyloSetSharpness = (v: number) => {
      const el = document.getElementById('ankylo-sharpness-matrix');
      if (!el) return;
      const k = (v / 100) * 0.9;
      const matrix = [0, -k, 0, -k, 1 + 4 * k, -k, 0, -k, 0].join(' ');
      el.setAttribute('kernelMatrix', matrix);
      el.setAttribute('divisor', String(1));
      el.setAttribute('bias', '0');
      el.setAttribute('preserveAlpha', 'true');
      el.setAttribute('edgeMode', 'duplicate');
    };
    return () => {
      delete window.__ankyloSetSharpness;
    };
  }, []);

  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <filter id="ankylo-sharpness" colorInterpolationFilters="sRGB">
          <feConvolveMatrix id="ankylo-sharpness-matrix" order="3" kernelMatrix="0 0 0 0 1 0 0 0 0" />
        </filter>
      </defs>
    </svg>
  );
}