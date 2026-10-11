import type { ReactNode } from 'react';
import { NamedIcon } from '../icons';

export function Panel({
  title,
  icon,
  onClose,
  children,
  width = 300,
  name = 'panel',
}: {
  title: string;
  icon: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  name?: string;
}) {
  return (
    <aside
      data-side-panel={name}
      className="anim-slide-left absolute right-0 top-0 z-30 flex h-full flex-col border-l border-line bg-surface"
      style={{ width }}
    >
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          <NamedIcon name={icon} size={14} className="text-accent" />
          {title}
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="flex h-6 w-6 items-center justify-center rounded-sm2 text-faint transition-colors duration-fast hover:bg-white/14 hover:text-ink"
        >
          <NamedIcon name="close" size={14} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">{children}</div>
    </aside>
  );
}