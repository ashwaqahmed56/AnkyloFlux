import { useCallback, useEffect, useRef, useState } from 'react';
import { engine, isDesktop } from '../engine';
import { usePlayerStore } from '../state/playerStore';
import { usePlaylistStore } from '../state/playlistStore';
import { useSettingsStore } from '../state/settingsStore';
import { clamp } from '../utils/format';
import { NamedIcon } from '../icons';
import { browseAndOpen, browseFolderAndOpen, openRecent } from '../state/openFile';

interface DoubleTapNotice {
  side: 'left' | 'right';
  seconds: number;
  key: number;
}

export function PlayerSurface() {
  const hasMedia = usePlayerStore((s) => s.hasMedia);
  const mini = usePlayerStore((s) => s.mini);
  const buffering = usePlayerStore((s) => s.buffering);
  const playing = usePlayerStore((s) => s.playing);

  const zoom = usePlayerStore((s) => s.zoom);

  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    engine.attach(el);
  }, []);

  const clickTimer = useRef<number | null>(null);
  const lastTap = useRef(0);
  const feedbackTimer = useRef<number | null>(null);
  const accumulatedSeconds = useRef<{ side: 'left' | 'right'; seconds: number } | null>(null);

  const touchDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1.0);

  const panDrag = useRef<{ startX: number; startY: number; initPanX: number; initPanY: number } | null>(null);
  const wasPanning = useRef(false);

  const [seekFeedback, setSeekFeedback] = useState<DoubleTapNotice | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const s = usePlayerStore.getState();
      if (!s.hasMedia) return;
      e.preventDefault();
      s.setControlsVisible(true);
      if (e.ctrlKey) {
        // Trackpad pinch gesture or Ctrl+MouseWheel zoom!
        const delta = -e.deltaY * 0.005;
        s.adjustZoom(delta);
      } else if (e.shiftKey) {
        s.seekBy(e.deltaY > 0 ? -5 : 5);
      } else {
        const delta = e.deltaY < 0 ? 3 : -3;
        s.setVolume(s.volume * 100 + delta);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  const triggerDoubleTapSeek = (side: 'left' | 'right') => {
    const step = useSettingsStore.getState().doubleTapSeekSeconds || 10;
    const delta = side === 'right' ? step : -step;
    usePlayerStore.getState().seekBy(delta);

    let currentSec = step;
    if (accumulatedSeconds.current && accumulatedSeconds.current.side === side) {
      currentSec = accumulatedSeconds.current.seconds + step;
    }
    accumulatedSeconds.current = { side, seconds: currentSec };

    setSeekFeedback({
      side,
      seconds: currentSec,
      key: Date.now(),
    });

    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => {
      setSeekFeedback(null);
      accumulatedSeconds.current = null;
      feedbackTimer.current = null;
    }, 700);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      touchDist.current = d;
      touchStartZoom.current = usePlayerStore.getState().zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchDist.current !== null && touchDist.current > 0) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const factor = d / touchDist.current;
      usePlayerStore.getState().setZoom(touchStartZoom.current * factor);
    }
  };

  const handleTouchEnd = () => {
    touchDist.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const s = usePlayerStore.getState();
    if (s.zoom > 1.05) {
      panDrag.current = {
        startX: e.clientX,
        startY: e.clientY,
        initPanX: s.panX,
        initPanY: s.panY,
      };
      wasPanning.current = false;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (panDrag.current) {
      const dx = (e.clientX - panDrag.current.startX) / (window.innerWidth * 0.5);
      const dy = (e.clientY - panDrag.current.startY) / (window.innerHeight * 0.5);
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        wasPanning.current = true;
      }
      if (wasPanning.current) {
        usePlayerStore.getState().setPan(panDrag.current.initPanX - dx, panDrag.current.initPanY - dy);
      }
    }
  };

  const handlePointerUp = () => {
    panDrag.current = null;
  };

  const handleActivate = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (wasPanning.current) {
      wasPanning.current = false;
      return;
    }
    const s = usePlayerStore.getState();
    if (!s.hasMedia) return;

    // If zoomed in, double clicking resets zoom
    const now = Date.now();
    const settings = useSettingsStore.getState();

    if (now - lastTap.current < 300) {
      // Double tap detected!
      lastTap.current = now;
      if (clickTimer.current) {
        window.clearTimeout(clickTimer.current);
        clickTimer.current = null;
      }

      if (s.zoom !== 1.0) {
        s.resetZoom();
        return;
      }

      if (settings.doubleTapSeek) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isRight = x >= rect.width / 2;
        const side: 'left' | 'right' = isRight ? 'right' : 'left';
        triggerDoubleTapSeek(side);
      } else {
        s.toggleFullscreen();
      }
    } else {
      lastTap.current = now;
      if (clickTimer.current) {
        window.clearTimeout(clickTimer.current);
      }

      clickTimer.current = window.setTimeout(() => {
        clickTimer.current = null;
        if (settings.clickToPlayPause) {
          usePlayerStore.getState().togglePlay();
        }
      }, 240);
    }
  };

  return (
    <div
      className="on-media absolute inset-0 select-none overflow-hidden bg-black"
      onClick={handleActivate}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        usePlayerStore.getState().setContextMenu(e.clientX, e.clientY);
      }}
    >
      <div id="ankylo-video" className="absolute inset-0 flex items-center justify-center">
        {hasMedia && !mini ? (
          isDesktop ? (
            <div className="h-full w-full" />
          ) : (
            <video ref={videoRef} className="max-h-full max-w-full" playsInline />
          )
        ) : null}
      </div>

      {hasMedia && zoom !== 1.0 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            usePlayerStore.getState().resetZoom();
          }}
          title="Click to reset zoom (100%)"
          className="anim-pop-in absolute right-6 top-16 z-20 flex items-center gap-1.5 rounded-full border border-line bg-elevated/90 px-3.5 py-1 text-xs font-semibold text-accent shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
        >
          <NamedIcon name="search" size={13} />
          <span>{Math.round(zoom * 100)}%</span>
          <span className="text-[10px] text-muted">✕</span>
        </button>
      ) : null}

      <SubtitleOverlay />
      <CenterOverlay />

      {hasMedia && buffering && playing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-accent/60 anim-pulse-ring" />
            <span className="h-8 w-8 rounded-full border-2 border-line border-t-accent anim-spin" />
          </div>
        </div>
      ) : null}

      {hasMedia && !playing && !buffering ? (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            usePlayerStore.getState().togglePlay();
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-elevated/90 p-4 text-ink shadow-2xl transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <NamedIcon name="play" size={26} />
        </button>
      ) : null}

      <DoubleTapOverlay notice={seekFeedback} />
      {!hasMedia ? <EmptyState /> : null}
      <DropOverlay />
    </div>
  );
}

function DoubleTapOverlay({ notice }: { notice: DoubleTapNotice | null }) {
  if (!notice) return null;
  const isRight = notice.side === 'right';

  return (
    <div
      key={notice.key}
      className={`pointer-events-none absolute inset-y-0 z-20 flex w-1/2 items-center justify-center ${
        isRight ? 'right-0' : 'left-0'
      }`}
    >
      <div
        className={`anim-doubletap flex flex-col items-center justify-center gap-1.5 px-12 py-10 ${
          isRight
            ? 'rounded-l-full bg-gradient-to-l from-white/10 via-accent/15 to-transparent'
            : 'rounded-r-full bg-gradient-to-r from-white/10 via-accent/15 to-transparent'
        }`}
      >
        <div className="flex items-center text-accent">
          {isRight ? (
            <>
              <NamedIcon name="chevronRight" size={30} />
              <NamedIcon name="chevronRight" size={30} className="-ml-4 text-accent/80" />
            </>
          ) : (
            <>
              <NamedIcon name="chevronLeft" size={30} className="-mr-4 text-accent/80" />
              <NamedIcon name="chevronLeft" size={30} />
            </>
          )}
        </div>
        <span className="mono-time text-base font-bold tracking-wide text-ink drop-shadow-md">
          {isRight ? `+${notice.seconds}s` : `-${notice.seconds}s`}
        </span>
      </div>
    </div>
  );
}

function SubtitleOverlay() {
  const cues = usePlayerStore((s) => s.subCues);
  const time = usePlayerStore((s) => s.time);
  const subDelay = usePlayerStore((s) => s.subDelay);
  const subs = useSettingsStore((s) => s.subs);
  const mini = usePlayerStore((s) => s.mini);

  if (mini || !cues || cues.length === 0) return null;
  const t = time + subDelay / 1000;
  const active = cues.filter((c) => t >= c.start && t <= c.end);
  if (active.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 flex justify-center px-10"
      style={{ bottom: `${clamp(subs.position, 0, 80)}%` }}
    >
      <div className="flex flex-col items-center gap-1">
        {active.map((c, i) => (
          <p
            key={i}
            className="whitespace-pre-line rounded-sm2 px-2 py-1 text-center font-medium leading-snug"
            style={{
              fontSize: `${Math.round(subs.size * 0.42)}px`,
              color: subs.color,
              background: subs.outline ? 'rgba(0,0,0,0.45)' : 'transparent',
              textShadow: subs.outline ? '0 2px 4px rgba(0,0,0,0.85)' : 'none',
            }}
          >
            {c.text}
          </p>
        ))}
      </div>
    </div>
  );
}

function CenterOverlay() {
  const center = usePlayerStore((s) => s.center);

  useEffect(() => {
    if (!center) return;
    const t = window.setTimeout(() => {
      usePlayerStore.setState({ center: null });
    }, 900);
    return () => window.clearTimeout(t);
  }, [center]);

  if (!center) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="anim-pop-in flex flex-col items-center gap-2 rounded-md2 border border-line bg-elevated px-6 py-4 shadow-2xl">
        <NamedIcon name={center.icon} size={26} className="text-accent" />
        <span className="mono-time text-sm text-ink">{center.value}</span>
      </div>
    </div>
  );
}

function DropOverlay() {
  const dragOver = usePlayerStore((s) => s.dragOver);
  if (!dragOver) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center gap-3 rounded-md2 border-2 border-dashed border-accent px-14 py-10">
        <NamedIcon name="download" size={30} className="text-accent" />
        <span className="text-sm tracking-wide text-ink">Drop to open</span>
      </div>
    </div>
  );
}

function EmptyState() {
  const recent = usePlaylistStore((s) => s.recent);
  const setUrlOpen = usePlayerStore((s) => s.setUrlOpen);
  const recentList = recent.slice(0, 6);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
      <div className="flex w-full max-w-lg flex-col items-center">
        <NamedIcon name="brand" size={44} className="mb-4 text-accent" />
        <h1 className="mb-1 text-xl font-semibold tracking-[0.28em] text-ink">ANKYLO</h1>
        <p className="mb-8 text-center text-xs leading-relaxed text-muted">
          Every format mpv can decode. Drop a file anywhere, or open one below.
        </p>

        <div className="mb-8 flex items-center gap-2">
          <button
            onClick={() => void browseAndOpen(false)}
            className="flex items-center gap-2 rounded-md2 border border-accent bg-accent px-4 py-2 text-xs font-semibold text-base transition-all duration-fast hover:brightness-110 active:scale-95"
          >
            <NamedIcon name="open" size={15} />
            Open file
          </button>
          <button
            onClick={() => void browseFolderAndOpen()}
            className="flex items-center gap-2 rounded-md2 border border-line bg-elevated px-4 py-2 text-xs font-medium text-ink transition-all duration-fast hover:border-accent hover:bg-white/12 active:scale-95"
          >
            <NamedIcon name="folder" size={15} />
            Folder
          </button>
          <button
            onClick={() => setUrlOpen(true)}
            className="flex items-center gap-2 rounded-md2 border border-line bg-elevated px-4 py-2 text-xs font-medium text-ink transition-all duration-fast hover:border-accent hover:bg-white/12 active:scale-95"
          >
            <NamedIcon name="globe" size={15} />
            URL
          </button>
        </div>

        {recentList.length > 0 ? (
          <div className="w-full">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-faint">
              <NamedIcon name="history" size={12} />
              Recent
            </div>
            <div className="overflow-hidden rounded-md2 border border-line">
              {recentList.map((r) => (
                <button
                  key={r.path}
                  onClick={() => void openRecent(r.path, r.title)}
                  className="flex w-full items-center gap-2.5 border-b border-line bg-surface px-3 py-2 text-left text-xs text-muted transition-colors duration-fast last:border-0 hover:bg-elevated hover:text-ink"
                >
                  <NamedIcon name="fileVideo" size={14} className="shrink-0 text-faint" />
                  <span className="truncate">{r.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-faint">
          {[
            ['Space', 'play'],
            ['← →', 'seek'],
            ['Ctrl+K', 'commands'],
            ['F', 'fullscreen'],
            [', .', 'frame step'],
            ['R', 'repeat'],
          ].map(([k, label]) => (
            <span key={k} className="flex items-center gap-1.5">
              <kbd className="mono-time rounded-sm2 border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-muted">
                {k}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}