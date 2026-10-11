import { useRef, useState } from 'react';
import { clamp } from '../utils/format';
import { NamedIcon, RotateIcon } from '../icons';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
  label?: string;
}

export function Slider({ value, min, max, step = 1, onChange, className = '', label }: SliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);

  const pct = clamp((value - min) / (max - min || 1), 0, 1);

  const posFromEvent = (clientX: number): number => {
    const el = ref.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const pos = clamp((clientX - r.left) / (r.width || 1), 0, 1);
    const raw = min + pos * (max - min);
    return clamp(Math.round(raw / step) * step, min, max);
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label ?? 'slider'}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`group relative flex h-5 cursor-pointer select-none items-center touch-none ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        onChange(posFromEvent(e.clientX));
      }}
      onPointerMove={(e) => {
        if (dragging) onChange(posFromEvent(e.clientX));
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDragging(false);
      }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onChange(clamp(value - step, min, max));
        else if (e.key === 'ArrowRight') onChange(clamp(value + step, min, max));
        else if (e.key === 'Home') onChange(min);
        else if (e.key === 'End') onChange(max);
      }}
    >
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/12 transition-all duration-150 group-hover:h-[4px]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-75"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div
        className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-md transition-transform duration-150 ${
          dragging || hover ? 'scale-110' : 'scale-90'
        }`}
        style={{ left: `${pct * 100}%` }}
      />
    </div>
  );
}

interface LabeledSliderProps {
  icon?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  defaultValue?: number;
  onReset?: () => void;
}

export function LabeledSlider({
  icon,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  defaultValue,
  onReset,
}: LabeledSliderProps) {
  const dirty = defaultValue !== undefined && Math.abs(value - defaultValue) > 0.001;
  return (
    <div className="mb-3.5">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          {icon ? <NamedIcon name={icon} size={13} /> : null}
          <span className="uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mono-time text-[11px] text-ink">
            {format ? format(value) : value.toFixed(0)}
          </span>
          {dirty && onReset ? (
            <button
              title="Reset"
              onClick={onReset}
              className="text-faint transition-colors duration-fast hover:text-accent"
            >
              <RotateIcon size={12} />
            </button>
          ) : null}
        </div>
      </div>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} label={label} />
    </div>
  );
}