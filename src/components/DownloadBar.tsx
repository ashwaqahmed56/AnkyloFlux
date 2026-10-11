import { usePlayerStore } from '../state/playerStore';
import { NamedIcon } from '../icons';
import { formatBitrate, formatSize } from '../utils/format';

export function DownloadBar() {
  const download = usePlayerStore((s) => s.download);
  const cancelDownload = usePlayerStore((s) => s.cancelDownload);

  if (!download.active) return null;

  const pct = download.percent;
  const width = pct > 0 ? `${Math.min(100, pct)}%` : '100%';

  return (
    <div className="on-media pointer-events-none absolute left-1/2 top-3 z-40 w-[min(420px,80vw)] -translate-x-1/2">
      <div className="anim-fade-up rounded-md2 border border-line bg-elevated px-3 py-2.5 shadow-2xl">
        <div className="mb-1.5 flex items-center gap-2">
          <NamedIcon name="download" size={14} className="shrink-0 text-accent" />
          <span className="flex-1 truncate text-[11px] text-ink">{download.name}</span>
          <span className="mono-time text-[10px] text-muted">
            {pct > 0 ? `${pct.toFixed(0)}%` : formatSize(download.received)}
          </span>
          <button
            onClick={() => cancelDownload()}
            className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-sm2 text-faint transition-colors duration-fast hover:bg-white/12 hover:text-ink"
            title="Cancel download"
          >
            <NamedIcon name="close" size={11} />
          </button>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-faint">
          <span className="mono-time">
            {formatSize(download.received)}
            {download.total > 0 ? ` / ${formatSize(download.total)}` : ''}
          </span>
          <span className="mono-time">{formatBitrate(download.speedBps)}</span>
        </div>
      </div>
    </div>
  );
}