import { usePlayerStore } from '../state/playerStore';
import { engine } from '../engine';
import { isDesktop } from '../engine';
import { formatBitrate, formatTime } from '../utils/format';
import { NamedIcon } from '../icons';
import { Panel } from './Panel';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line/60 py-1.5">
      <span className="text-[11px] text-faint">{label}</span>
      <span className="mono-time text-[11px] text-ink">{value}</span>
    </div>
  );
}

function TrackList({ title, icon, tracks, activeId, onSelect }: { title: string; icon: string; tracks: { id: number; title: string; lang?: string }[]; activeId: number | null; onSelect?: (id: number) => void }) {
  if (tracks.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
        <NamedIcon name={icon} size={12} />
        {title}
      </div>
      <div className="overflow-hidden rounded-sm2 border border-line">
        {tracks.map((t) => {
          const inner = (
            <>
              <span className="flex-1 truncate">{t.title}</span>
              {t.lang ? <span className="mono-time text-[10px] text-faint">{t.lang}</span> : null}
              {t.id === activeId ? <NamedIcon name="check" size={12} /> : null}
            </>
          );
          const cls = `flex w-full items-center gap-2 border-b border-line px-2.5 py-1.5 text-left text-[11px] transition-colors duration-fast last:border-0 ${
            t.id === activeId ? 'bg-accent-dim text-accent' : 'text-muted'
          }`;
          // Without a handler there is nothing to click, so do not render a
          // focusable button that would do nothing when pressed.
          return onSelect ? (
            <button key={t.id} onClick={() => onSelect(t.id)} className={`${cls} hover:bg-white/12`}>
              {inner}
            </button>
          ) : (
            <div key={t.id} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InfoPanel() {
  const open = usePlayerStore((s) => s.infoOpen);
  const info = usePlayerStore((s) => s.mediaInfo);
  const fileName = usePlayerStore((s) => s.fileName);
  const filePath = usePlayerStore((s) => s.filePath);
  const chapters = usePlayerStore((s) => s.chapters);
  const tracks = usePlayerStore((s) => s.tracks);
  const audioId = usePlayerStore((s) => s.audioId);
  const subId = usePlayerStore((s) => s.subId);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const duration = usePlayerStore((s) => s.duration);

  if (!open) return null;

  const res = info && info.width > 0 ? `${info.width}×${info.height}` : '—';
  const resLabel =
    info && info.height > 0 ? (info.height >= 2160 ? '4K' : info.height >= 1440 ? 'QHD' : info.height >= 1080 ? 'FHD' : 'SD') : '';

  return (
    <Panel title="Media info" icon="info" name="info" width={320} onClose={() => usePlayerStore.getState().setInfoOpen(false)}>
      <div className="mb-4">
        <div className="truncate text-xs font-medium text-ink">{fileName || '—'}</div>
        {filePath && filePath !== fileName ? (
          <div className="mt-0.5 break-all text-[10px] text-faint">{filePath}</div>
        ) : null}
      </div>

      <div className="mb-5">
        <Row label="Container" value={info?.container ?? '—'} />
        <Row label="Duration" value={duration > 0 ? formatTime(duration) : info?.duration ? formatTime(info.duration) : '—'} />
        <Row label="Resolution" value={res !== '—' ? `${res}${resLabel ? `  (${resLabel})` : ''}` : '—'} />
        <Row label="FPS" value={info?.fps ? info.fps.toFixed(3) : '—'} />
        <Row label="Video" value={info?.videoCodec ?? '—'} />
        <Row label="Audio" value={info?.audioCodec ?? '—'} />
        <Row label="Channels" value={info?.audioChannels ?? '—'} />
        <Row label="Bitrate" value={info ? formatBitrate(info.bitrate) : '—'} />
        <Row label="Subtitles" value={info ? String(info.subtitleCount) : '—'} />
        <Row label="HDR" value={info?.hdr && info.hdr !== '' ? info.hdr : '—'} />
        <Row label="Engine" value={isDesktop ? 'libmpv (FFmpeg)' : 'Browser (MSE)'} />
      </div>


      <TrackList title="Video" icon="aspect" tracks={tracks.videos} activeId={null} />
      <TrackList title="Audio tracks" icon="audioTrack" tracks={tracks.audio} activeId={audioId} onSelect={(id) => usePlayerStore.getState().setTrack('audio', id)} />
      <TrackList title="Subtitles" icon="subtitle" tracks={tracks.subs} activeId={subId} onSelect={(id) => usePlayerStore.getState().setTrack('sub', id)} />

      {chapters.length > 0 ? (
        <div className="mb-5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
            <NamedIcon name="chapter" size={12} />
            Chapters
          </div>
          <div className="overflow-hidden rounded-sm2 border border-line">
            {chapters.map((c, i) => (
              <button
                key={i}
                onClick={() => seekTo(c.time)}
                className="flex w-full items-center gap-2 border-b border-line px-2.5 py-1.5 text-left text-[11px] text-muted transition-colors duration-fast last:border-0 hover:bg-white/12 hover:text-ink"
              >
                <span className="mono-time shrink-0 text-[10px] text-faint">{formatTime(c.time)}</span>
                <span className="flex-1 truncate">{c.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        onClick={() => engine.screenshot()}
        className="flex w-full items-center justify-center gap-2 rounded-sm2 border border-line py-2 text-[11px] text-muted transition-colors duration-fast hover:bg-white/12 hover:text-ink"
      >
        <NamedIcon name="screenshot" size={13} />
        Save snapshot
      </button>
    </Panel>
  );
}