import { usePlayerStore } from '../state/playerStore';
import { isDesktop } from '../engine';
import { NamedIcon } from '../icons';
import { browseAndOpen } from '../state/openFile';

export function TopBar() {
  const hasMedia = usePlayerStore((s) => s.hasMedia);
  const fileName = usePlayerStore((s) => s.fileName);
  const filePath = usePlayerStore((s) => s.filePath);
  const visible = usePlayerStore((s) => s.controlsVisible);
  const mini = usePlayerStore((s) => s.mini);
  const downloading = usePlayerStore((s) => s.download.active);
  const isStream = /^https?:\/\//i.test(filePath);

  if (mini) return null;

  return (
    <header
      id="ankylo-topbar"
      className={`absolute inset-x-0 top-0 z-30 flex items-center gap-3 px-4 py-3 transition-opacity duration-200 ${
        hasMedia ? 'on-media bg-gradient-to-b from-black/75 to-transparent' : ''
      } ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <button
        onClick={() => usePlayerStore.getState().setAboutOpen(true)}
        title="About Ankylo"
        className="group flex items-center gap-2 rounded-sm2 px-1.5 py-1 transition-colors duration-fast hover:bg-white/10"
      >
        <NamedIcon name="brand" size={15} className="text-accent transition-transform duration-fast group-hover:scale-110" />
        <span className="mono-time text-[10px] tracking-[0.3em] text-muted group-hover:text-ink">ANKYLO</span>
      </button>

      {hasMedia ? (
        <>
          <span className="text-line">/</span>
          <span className="truncate text-[11px] text-muted">{fileName}</span>
        </>
      ) : null}

      <div className="flex-1" />

      <span className="mono-time hidden text-[9px] uppercase tracking-[0.18em] text-faint md:block">
        {isDesktop ? 'libmpv · ffmpeg' : 'browser engine'}
      </span>

      {isStream && isDesktop ? (
        <button
          onClick={() => usePlayerStore.getState().startDownload()}
          title={downloading ? 'Download in progress' : 'Download this stream (Ctrl+Shift+S)'}
          disabled={downloading}
          className={`flex h-7 items-center gap-1.5 rounded-sm2 px-2 text-[10px] transition-colors duration-fast ${
            downloading
              ? 'text-faint'
              : 'text-accent hover:bg-accent-dim'
          }`}
        >
          <NamedIcon name="download" size={14} />
          Download
        </button>
      ) : null}

      <button
        onClick={() => void browseAndOpen(true)}
        title="Open files"
        className="flex h-7 w-7 items-center justify-center rounded-sm2 text-muted transition-colors duration-fast hover:bg-white/14 hover:text-ink"
      >
        <NamedIcon name="open" size={15} />
      </button>
      <button
        onClick={() => usePlayerStore.getState().setPaletteOpen(true)}
        title="Command palette (Ctrl+K)"
        className="flex h-7 w-7 items-center justify-center rounded-sm2 text-muted transition-colors duration-fast hover:bg-white/14 hover:text-ink"
      >
        <NamedIcon name="search" size={15} />
      </button>
      <button
        onClick={() => usePlayerStore.getState().setSettingsOpen(true)}
        title="Settings (Ctrl+,)"
        className="flex h-7 w-7 items-center justify-center rounded-sm2 text-muted transition-colors duration-fast hover:bg-white/14 hover:text-ink"
      >
        <NamedIcon name="gear" size={15} />
      </button>
      <button
        onClick={() => usePlayerStore.getState().setAboutOpen(true)}
        title="About Ankylo"
        className="flex h-7 w-7 items-center justify-center rounded-sm2 text-muted transition-colors duration-fast hover:bg-white/14 hover:text-ink"
      >
        <NamedIcon name="info" size={15} />
      </button>
    </header>
  );
}