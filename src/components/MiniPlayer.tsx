import { useCallback, useEffect, useRef } from 'react';
import { engine, isDesktop } from '../engine';
import { usePlayerStore } from '../state/playerStore';
import { formatTime } from '../utils/format';
import { NamedIcon } from '../icons';

const W = 360;
const H = 232;

export function MiniPlayer() {
  const mini = usePlayerStore((s) => s.mini);
  const hasMedia = usePlayerStore((s) => s.hasMedia);
  const playing = usePlayerStore((s) => s.playing);
  const time = usePlayerStore((s) => s.time);
  const duration = usePlayerStore((s) => s.duration);
  const fileName = usePlayerStore((s) => s.fileName);

  const posRef = useRef({ x: window.innerWidth - W - 24, y: window.innerHeight - H - 24 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    posRef.current = {
      x: Math.max(8, window.innerWidth - W - 24),
      y: Math.max(8, window.innerHeight - H - 24),
    };
    const el = nodeRef.current;
    if (el) el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
  }, [mini]);

  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    engine.attach(el);
  }, []);

  if (!mini) return null;

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div
      ref={nodeRef}
      className="fixed left-0 top-0 z-[60] flex flex-col overflow-hidden rounded-md2 border border-line bg-surface shadow-2xl"
      style={{ width: W, height: H, willChange: 'transform' }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        usePlayerStore.getState().setContextMenu(e.clientX, e.clientY);
      }}
    >
      <div
        className="flex h-7 cursor-grab items-center gap-2 border-b border-line bg-elevated px-2.5 active:cursor-grabbing"
        onPointerDown={(e) => {
          const rect = nodeRef.current?.getBoundingClientRect();
          if (!rect) return;
          dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          posRef.current = {
            x: Math.min(Math.max(0, e.clientX - d.dx), window.innerWidth - W),
            y: Math.min(Math.max(0, e.clientY - d.dy), window.innerHeight - H),
          };
          if (nodeRef.current) {
            nodeRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
          }
        }}
        onPointerUp={(e) => {
          dragRef.current = null;
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }}
      >
        <span className="mono-time text-[9px] tracking-[0.2em] text-faint">MINI</span>
        <span className="flex-1 truncate text-[10px] text-muted">{fileName}</span>
        <button
          onClick={() => usePlayerStore.getState().toggleMini()}
          title="Restore"
          className="flex h-5 w-5 items-center justify-center rounded-sm2 text-faint hover:bg-white/14 hover:text-ink"
        >
          <NamedIcon name="chevronDown" size={12} />
        </button>
      </div>

      <div
        id="ankylo-video"
        className="flex min-h-0 flex-1 items-center justify-center bg-black"
      >
        {hasMedia ? (
          isDesktop ? (
            <div className="h-full w-full" />
          ) : (
            <video ref={videoRef} className="max-h-full max-w-full" playsInline />
          )
        ) : (
          <span className="text-[11px] text-faint">No media</span>
        )}
      </div>

      <div className="flex h-9 items-center gap-2 border-t border-line px-2.5">
        <button
          onClick={() => usePlayerStore.getState().togglePlay()}
          className="flex h-6 w-6 items-center justify-center rounded-sm2 text-ink transition-colors duration-fast hover:bg-white/14"
        >
          <NamedIcon name={playing ? 'pause' : 'play'} size={15} />
        </button>
        <span className="mono-time text-[10px] text-muted">{formatTime(time)}</span>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/12">
          <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <span className="mono-time text-[10px] text-faint">{formatTime(duration)}</span>
      </div>
    </div>
  );
}