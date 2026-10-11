import { useRef, useState } from 'react';
import { usePlayerStore } from '../state/playerStore';
import { clamp, formatTime } from '../utils/format';

export function SeekBar() {
  const time = usePlayerStore((s) => s.time);
  const duration = usePlayerStore((s) => s.duration);
  const bufferedEnd = usePlayerStore((s) => s.bufferedEnd);
  const chapters = usePlayerStore((s) => s.chapters);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const ref = useRef<HTMLDivElement>(null);
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [hoverPct, setHoverPct] = useState(50);
  const [dragging, setDragging] = useState(false);

  const dur = duration > 0 ? duration : 0;
  const timeFromClientX = (clientX: number): number => {
    const el = ref.current;
    if (!el || dur <= 0) return 0;
    const r = el.getBoundingClientRect();
    const pos = clamp((clientX - r.left) / (r.width || 1), 0, 1);
    return pos * dur;
  };

  const pct = dur > 0 ? clamp(time / dur, 0, 1) : 0;
  const bufPct = dur > 0 ? clamp(bufferedEnd / dur, 0, 1) : 0;

  return (
    <div
      ref={ref}
      className="group/seek relative h-6 cursor-pointer select-none touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        seekTo(timeFromClientX(e.clientX));
      }}
      onPointerMove={(e) => {
        const t = timeFromClientX(e.clientX);
        setHoverT(t);
        const r = e.currentTarget.getBoundingClientRect();
        setHoverPct(clamp(((e.clientX - r.left) / (r.width || 1)) * 100, 0, 100));
        if (dragging) seekTo(t);
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDragging(false);
      }}
      onPointerLeave={() => setHoverT(null)}
    >
      {hoverT !== null && dur > 0 ? (
        <div
          className="pointer-events-none absolute bottom-full z-30 mb-1 -translate-x-1/2 rounded-sm2 border border-line bg-elevated px-1.5 py-0.5 shadow-lg"
          style={{ left: `${hoverPct}%` }}
        >
          <span className="mono-time text-[10px] text-ink">{formatTime(hoverT)}</span>
        </div>
      ) : null}

      <div className="relative flex h-full items-center">
        <div
          className={`relative w-full overflow-hidden rounded-full bg-white/25 shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-150 ${
            dragging ? 'h-[6px]' : 'group-hover/seek:h-[6px] h-1'
          }`}
        >
          <div className="absolute inset-y-0 left-0 bg-white/40" style={{ width: `${bufPct * 100}%` }} />

          <div
            className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-75"
            style={{ width: `${pct * 100}%` }}
          />
        </div>

        {chapters.map((c, i) =>
          dur > 0 ? (
            <span
              key={i}
              className="pointer-events-none absolute h-[9px] w-px bg-white/60"
              style={{ left: `${clamp(c.time / dur, 0, 1) * 100}%` }}
            />
          ) : null,
        )}

        <div
          className={`pointer-events-none absolute h-4 w-4 -translate-x-1/2 rounded-full bg-accent shadow-md transition-transform duration-150 ${
            dragging ? 'scale-100' : 'scale-0 group-hover/seek:scale-100'
          }`}
          style={{ left: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}