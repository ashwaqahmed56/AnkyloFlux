import { useToastStore } from '../state/toastStore';
import { NamedIcon } from '../icons';

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[70] flex flex-col gap-1.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-toast flex items-center gap-2.5 rounded-sm2 border border-line bg-elevated py-1.5 pl-3 pr-3.5 shadow-xl"
        >
          <NamedIcon name={t.icon} size={14} className="text-accent" />
          <span className="text-[11px] text-ink">{t.text}</span>
        </div>
      ))}
    </div>
  );
}