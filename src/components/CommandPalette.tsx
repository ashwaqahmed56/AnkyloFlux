import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayerStore } from '../state/playerStore';
import { getActions } from '../state/actions';
import { fuzzyMatch } from '../utils/format';
import { NamedIcon } from '../icons';

export function CommandPalette() {
  const open = usePlayerStore((s) => s.paletteOpen);
  const setOpen = usePlayerStore((s) => s.setPaletteOpen);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions = useMemo(() => (open ? getActions() : []), [open]);

  const filtered = useMemo(
    () => actions.filter((a) => fuzzyMatch(query, `${a.category} ${a.title}`)),
    [actions, query],
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected, open]);

  if (!open) return null;

  const run = (idx: number) => {
    const action = filtered[idx];
    if (!action) return;
    setOpen(false);
    action.run();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-overlay pt-[16vh]" onPointerDown={() => setOpen(false)}>
      <div
        className="anim-pop-in w-[min(620px,92vw)] overflow-hidden rounded-md2 border border-line bg-surface shadow-2xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <NamedIcon name="search" size={17} className="text-accent" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(selected);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder="Search commands…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <kbd className="mono-time rounded-sm2 border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-faint">Esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-faint">No commands match “{query}”.</div>
          ) : (
            filtered.map((a, i) => (
              <button
                key={a.id}
                data-selected={i === selected}
                onPointerEnter={() => setSelected(i)}
                onClick={() => run(i)}
                className={`flex w-full items-center gap-3 rounded-sm2 px-3 py-2 text-left transition-colors duration-fast ${
                  i === selected ? 'bg-accent-dim text-accent' : 'text-muted hover:bg-white/12'
                }`}
              >
                <NamedIcon name={a.icon} size={16} className="shrink-0" />
                <span className="flex-1 truncate text-xs">{a.title}</span>
                <span className="text-[10px] uppercase tracking-wide text-faint">{a.category}</span>
                {a.keys.length > 0 ? (
                  <span className="mono-time rounded-sm2 border border-line bg-base px-1.5 py-0.5 text-[10px] text-muted">
                    {a.keys.join(', ')}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[10px] text-faint">
          <span>↑↓ navigate</span>
          <span>⏎ run</span>
          <span className="flex-1" />
          <span>{filtered.length} commands</span>
        </div>
      </div>
    </div>
  );
}