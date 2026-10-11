import { useLayoutEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../state/playerStore';
import { NamedIcon } from '../icons';
import { browseAndOpen, browseFolderAndOpen } from '../state/openFile';

function Item({
  icon,
  label,
  hint,
  active,
  onClick,
  danger,
}: {
  icon?: string;
  label: string;
  hint?: string;
  active?: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-sm2 px-2.5 py-1.5 text-left text-xs transition-colors duration-fast hover:bg-white/14 ${
        danger ? 'text-red-300 hover:bg-red-400/10' : active ? 'text-accent' : 'text-muted hover:text-ink'
      }`}
    >
      {icon ? <NamedIcon name={icon} size={15} className="shrink-0" /> : null}
      <span className="flex-1 truncate">{label}</span>
      {hint ? <span className="mono-time text-[10px] text-faint">{hint}</span> : null}
      {active ? <NamedIcon name="check" size={13} /> : null}
    </button>
  );
}

function Label({ children }: { children: string }) {
  return <div className="px-2.5 pb-1 pt-2.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-faint">{children}</div>;
}

export function ContextMenu() {
  const pos = usePlayerStore((s) => s.contextMenu);
  const close = usePlayerStore.getState().closeContextMenu;
  const s = usePlayerStore.getState();
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!pos || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setAt({
      x: Math.min(pos.x, window.innerWidth - r.width - 8),
      y: Math.min(pos.y, window.innerHeight - r.height - 8),
    });
  }, [pos]);

  useLayoutEffect(() => {
    if (!pos) return;
    const onDown = () => usePlayerStore.getState().closeContextMenu();
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onDown);
    window.addEventListener('wheel', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onDown);
      window.removeEventListener('wheel', onDown);
    };
  }, [pos]);

  if (!pos) return null;

  const run = (fn: () => void) => {
    close();
    fn();
  };

  return (
    <div
      ref={ref}
      className="anim-fade-up fixed z-50 w-[248px] rounded-md2 border border-line bg-elevated p-1.5 shadow-2xl on-media-popover"
      style={{ left: at.x || pos.x, top: at.y || pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Label>Playback</Label>
      <Item icon={s.playing ? 'pause' : 'play'} label={s.playing ? 'Pause' : 'Play'} hint="Space" onClick={() => run(() => s.togglePlay())} />
      <Item icon="forward10" label="Forward 10s" hint="→" onClick={() => run(() => s.seekBy(10))} />
      <Item icon="back10" label="Back 10s" hint="←" onClick={() => run(() => s.seekBy(-10))} />
      <Item icon="next" label="Next frame" hint="." onClick={() => run(() => s.frameStep(1))} />
      <Item icon="prev" label="Previous frame" hint="," onClick={() => run(() => s.frameStep(-1))} />
      <Item icon="loop" label={s.repeat ? 'Repeat: on' : 'Repeat: off'} hint="R" active={s.repeat} onClick={() => run(() => s.toggleRepeat())} />

      <Label>Speed</Label>
      <Item icon="speed" label="Cycle speed" hint="Ctrl+↑/↓" onClick={() => run(() => s.cycleSpeed(1))} />
      <Item icon="speed" label="Reset speed" onClick={() => run(() => s.setSpeed(1))} />

      <Label>Video</Label>
      <Item icon="aspect" label="Cycle aspect ratio" hint="T" onClick={() => run(() => s.cycleAspect())} />
      {s.zoom !== 1.0 ? (
        <Item icon="search" label={`Reset zoom (${Math.round(s.zoom * 100)}%)`} hint="Ctrl+0" onClick={() => run(() => s.resetZoom())} />
      ) : null}
      <Item icon="rotate" label="Rotate 90°" hint="Ctrl+⇧+R" onClick={() => run(() => s.rotateBy(90))} />
      <Item icon="mirror" label="Mirror" active={s.mirrored} hint="Ctrl+R" onClick={() => run(() => s.toggleMirror())} />
      <Item icon="deinterlace" label="Deinterlace" active={s.deinterlace} hint="D" onClick={() => run(() => s.toggleDeinterlace())} />

      <Label>Audio</Label>
      <Item icon="audioTrack" label="Next audio track" hint="A" onClick={() => run(() => s.cycleTrack('audio'))} />
      <Item icon="volumeMute" label={s.muted ? 'Unmute' : 'Mute'} hint="M" onClick={() => run(() => s.toggleMute())} />

      <Label>Subtitles</Label>
      <Item icon="subtitle" label="Next subtitle track" hint="J" onClick={() => run(() => s.cycleTrack('sub'))} />
      <Item icon="clock" label="Subtitle delay +50ms" hint="Ctrl+J" onClick={() => run(() => s.stepSubDelay(1))} />
      <Item icon="clock" label="Subtitle delay -50ms" onClick={() => run(() => s.stepSubDelay(-1))} />

      <Label>View</Label>
      <Item icon="pip" label="Picture-in-Picture" hint="Ctrl+P" onClick={() => run(() => s.togglePip())} />
      <Item icon="mini" label="Mini player" hint="Ctrl+⇧+M" onClick={() => run(() => s.toggleMini())} />
      <Item icon="screenshot" label="Save snapshot" hint="Ctrl+S" onClick={() => run(() => s.screenshot())} />
      <Item icon="adjust" label="Adjustments" hint="Ctrl+E" onClick={() => run(() => s.setAdjustmentsOpen(!s.adjustmentsOpen))} />
      <Item icon="info" label="Media info" hint="I" onClick={() => run(() => s.setInfoOpen(!s.infoOpen))} />
      <Item icon="playlist" label="Playlist" hint="L" onClick={() => run(() => s.setPlaylistOpen(!s.playlistOpen))} />

      <Label>File</Label>
      {s.isStream() ? (
        <Item
          icon="download"
          label="Download this stream"
          hint="Ctrl+Shift+S"
          onClick={() => run(() => s.startDownload())}
        />
      ) : null}
      <Item icon="open" label="Open file…" hint="Ctrl+O" onClick={() => run(() => void browseAndOpen(false))} />
      <Item icon="folder" label="Open folder…" onClick={() => run(() => void browseFolderAndOpen())} />
      <Item icon="globe" label="Open stream URL…" onClick={() => run(() => s.setUrlOpen(true))} />
      <Item icon="brand" label="About Ankylo" onClick={() => run(() => s.setAboutOpen(true))} />
      <Item
        icon="close"
        label="Close media"
        hint="Esc"
        danger
        onClick={() => run(() => s.closeMedia())}
      />
    </div>
  );
}