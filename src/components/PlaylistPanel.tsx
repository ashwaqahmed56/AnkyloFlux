import { useState } from 'react';
import { usePlaylistStore } from '../state/playlistStore';
import { usePlayerStore } from '../state/playerStore';
import { openPaths } from '../state/paths';
import { browseAndOpen, browseFolderAndOpen, openRecent } from '../state/openFile';
import { NamedIcon } from '../icons';
import { Panel } from './Panel';

export function PlaylistPanel() {
  const open = usePlayerStore((s) => s.playlistOpen);
  const items = usePlaylistStore((s) => s.items);
  const index = usePlaylistStore((s) => s.index);
  const recent = usePlaylistStore((s) => s.recent);
  const move = usePlaylistStore((s) => s.move);
  const remove = usePlaylistStore((s) => s.remove);
  const clear = usePlaylistStore((s) => s.clear);
  const removeRecent = usePlaylistStore((s) => s.removeRecent);
  const clearRecent = usePlaylistStore((s) => s.clearRecent);
  const openPath = usePlayerStore((s) => s.openPath);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  if (!open) return null;

  return (
    <Panel title="Playlist" icon="playlist" name="playlist" width={320} onClose={() => usePlayerStore.getState().setPlaylistOpen(false)}>
      <div className="mb-3 flex items-center gap-1.5">
        <button
          onClick={() => void browseAndOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-sm2 border border-line py-1.5 text-[11px] text-muted transition-colors duration-fast hover:bg-white/12 hover:text-ink"
        >
          <NamedIcon name="plus" size={13} /> Add
        </button>
        <button
          onClick={() => void browseFolderAndOpen()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-sm2 border border-line py-1.5 text-[11px] text-muted transition-colors duration-fast hover:bg-white/12 hover:text-ink"
        >
          <NamedIcon name="folder" size={13} /> Folder
        </button>
        {items.length > 0 ? (
          <button
            onClick={clear}
            className="flex items-center justify-center rounded-sm2 border border-line px-2 py-1.5 text-faint transition-colors duration-fast hover:border-red-400/40 hover:text-red-300"
            title="Clear playlist"
          >
            <NamedIcon name="trash" size={13} />
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mb-5 rounded-sm2 border border-line px-3 py-4 text-center text-[11px] text-faint">
          Playlist is empty — drop files or add them above.
        </div>
      ) : (
        <div className="mb-5 overflow-hidden rounded-sm2 border border-line">
          {items.map((it, i) => (
            <div
              key={it.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIdx(i);
              }}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null && overIdx !== null) move(dragIdx, overIdx);
                setDragIdx(null);
                setOverIdx(null);
              }}
              onClick={() => openPath(it.path, { title: it.title })}
              className={`group flex cursor-pointer items-center gap-2 border-b border-line px-2 py-1.5 text-left transition-colors duration-fast last:border-0 ${
                i === index ? 'bg-accent-dim' : overIdx === i && dragIdx !== null ? 'bg-white/8' : 'hover:bg-white/12'
              }`}
            >
              <NamedIcon name="grip" size={13} className="shrink-0 cursor-grab text-faint opacity-0 transition-opacity duration-fast group-hover:opacity-100" />
              <span className="mono-time w-5 shrink-0 text-[10px] text-faint">{i + 1}</span>
              <span className={`flex-1 truncate text-[11px] ${i === index ? 'text-accent' : 'text-muted'}`}>{it.title}</span>
              {i === index ? <NamedIcon name="play" size={11} className="text-accent" /> : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(it.id);
                }}
                className="flex h-5 w-5 items-center justify-center rounded-sm2 text-faint opacity-0 transition-all duration-fast hover:bg-white/14 hover:text-ink group-hover:opacity-100"
                title="Remove"
              >
                <NamedIcon name="close" size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
          <NamedIcon name="history" size={12} />
          Recent
        </div>
        {recent.length > 0 ? (
          <button onClick={clearRecent} className="text-[10px] uppercase tracking-wide text-faint transition-colors duration-fast hover:text-accent">
            clear
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-sm2 border border-line">
        {recent.slice(0, 12).map((r) => (
          <div
            key={r.path}
            onClick={() => void openRecent(r.path, r.title)}
            className="group flex cursor-pointer items-center gap-2 border-b border-line px-2 py-1.5 transition-colors duration-fast last:border-0 hover:bg-white/12"
          >
            <NamedIcon name="clock" size={12} className="shrink-0 text-faint" />
            <span className="flex-1 truncate text-[11px] text-muted group-hover:text-ink">{r.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeRecent(r.path);
              }}
              className="flex h-5 w-5 items-center justify-center rounded-sm2 text-faint opacity-0 transition-all duration-fast hover:bg-white/14 hover:text-ink group-hover:opacity-100"
            >
              <NamedIcon name="close" size={11} />
            </button>
          </div>
        ))}
        {recent.length === 0 ? (
          <div className="px-3 py-3 text-center text-[11px] text-faint">No recent files yet.</div>
        ) : null}
      </div>

      <button
        onClick={() => {
          const url = window.prompt('Open URL (HLS / DASH / HTTP):');
          if (url) openPaths([url.trim()]);
        }}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-sm2 border border-line py-2 text-[11px] text-muted transition-colors duration-fast hover:bg-white/12 hover:text-ink"
      >
        <NamedIcon name="globe" size={13} />
        Open stream URL
      </button>
    </Panel>
  );
}