import { NamedIcon } from '../icons';
import { formatDelay, formatTime } from '../utils/format';
import { usePlayerStore } from '../state/playerStore';
import type { AspectMode, EngineTrack } from '../engine/types';
import { SeekBar } from './SeekBar';
import { LabeledSlider, Slider } from './Slider';
import { browseSubtitleAndLoad } from '../state/openFile';

export function ControlsBar() {
  const hasMedia = usePlayerStore((s) => s.hasMedia);
  const playing = usePlayerStore((s) => s.playing);
  const fullscreen = usePlayerStore((s) => s.fullscreen);
  const visible = usePlayerStore((s) => s.controlsVisible);
  const repeat = usePlayerStore((s) => s.repeat);
  // Subscribed (not read via getState) so the toggle buttons actually re-render
  // when a panel opens or closes.
  const adjustmentsOpen = usePlayerStore((s) => s.adjustmentsOpen);
  const infoOpen = usePlayerStore((s) => s.infoOpen);
  const playlistOpen = usePlayerStore((s) => s.playlistOpen);

  return (
    <div
      id="ankylo-controls"
      className={`absolute inset-x-0 bottom-0 z-30 select-none bg-gradient-to-t from-black/90 via-black/45 to-transparent px-3 pb-2.5 pt-10 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      } ${hasMedia ? '' : 'hidden'}`}
    >
      {hasMedia ? (
        <div className="on-media mx-auto max-w-[1500px]">
          <SeekBar />
          <div className="mt-1 flex items-center gap-0.5">
            <Btn
              icon={playing ? 'pause' : 'play'}
              label={playing ? 'Pause (Space)' : 'Play (Space)'}
              size={22}
              onClick={() => usePlayerStore.getState().togglePlay()}
              prominent
            />
            <Btn
              icon="back10"
              label="Back 10s (Left)"
              size={19}
              onClick={() => usePlayerStore.getState().seekBy(-10)}
            />
            <Btn
              icon="forward10"
              label="Forward 10s (Right)"
              size={19}
              onClick={() => usePlayerStore.getState().seekBy(10)}
            />
            <VolumeControl />
            <TimeDisplay />
            <div className="flex-1" />
            <SpeedButton />
            <SubButton />
            <AudioButton />
<AspectButton />
            <Btn
              icon="loop"
              label={repeat ? 'Repeat on - click to stop' : 'Repeat video (R)'}
              size={19}
              onClick={() => usePlayerStore.getState().toggleRepeat()}
              active={repeat}
            />
            <Btn
              icon="screenshot"
              label="Snapshot (Ctrl+S)"
              size={19}
              onClick={() => usePlayerStore.getState().screenshot()}
            />
            <Btn
              icon="pip"
              label="Picture-in-Picture (Ctrl+P)"
              size={19}
              onClick={() => usePlayerStore.getState().togglePip()}
            />
            <Btn
              icon="adjust"
              label="Adjustments (Ctrl+E)"
              size={19}
              onClick={() => usePlayerStore.getState().setAdjustmentsOpen(!adjustmentsOpen)}
              active={adjustmentsOpen}
            />
            <Btn
              icon="info"
              label="Media info (I)"
              size={19}
              onClick={() => usePlayerStore.getState().setInfoOpen(!infoOpen)}
              active={infoOpen}
            />
            <Btn
              icon="playlist"
              label="Playlist (L)"
              size={19}
              onClick={() => usePlayerStore.getState().setPlaylistOpen(!playlistOpen)}
              active={playlistOpen}
            />
            <Btn
              icon={fullscreen ? 'fullscreenExit' : 'fullscreen'}
              label="Fullscreen (F)"
              size={19}
              onClick={() => usePlayerStore.getState().toggleFullscreen()}
            />
          </div>
        </div>
      ) : null}
      <ActiveMenu />
    </div>
  );
}

function ActiveMenu() {
  const menu = usePlayerStore((s) => s.menu);
  if (!menu) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-30"
        onPointerDown={() => usePlayerStore.getState().setMenu(null)}
      />
      <div className="on-media-popover anim-pop-in absolute bottom-full right-3 z-40 mb-1 w-64 rounded-md2 border border-line bg-elevated p-2 shadow-2xl">
        {menu === 'speed' ? <SpeedMenu /> : null}
        {menu === 'audio' ? <AudioMenu /> : null}
        {menu === 'sub' ? <SubMenu /> : null}
        {menu === 'aspect' ? <AspectMenu /> : null}
      </div>
    </>
  );
}

function Btn({
  icon,
  label,
  onClick,
  size = 20,
  active,
  prominent,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  size?: number;
  active?: boolean;
  prominent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-sm2 transition-all duration-fast active:scale-90 ${
        active || prominent
          ? 'text-accent hover:bg-accent-dim'
          : 'text-ink hover:bg-white/14'
      }`}
    >
      <NamedIcon name={icon} size={size} />
    </button>
  );
}

function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const icon = muted || volume === 0 ? 'volumeMute' : volume < 0.4 ? 'volumeLow' : 'volumeHigh';
  return (
    <div className="group/vol flex items-center">
      <Btn icon={icon} label="Mute (M)" size={19} onClick={toggleMute} />
      <div className="w-0 overflow-hidden transition-all duration-200 group-hover/vol:w-20 group-focus-within/vol:w-20">
        <Slider
          value={muted ? 0 : Math.round(volume * 100)}
          min={0}
          max={100}
          onChange={(v) => setVolume(v)}
          className="px-2"
          label="Volume"
        />
      </div>
    </div>
  );
}

function TimeDisplay() {
  const time = usePlayerStore((s) => s.time);
  const duration = usePlayerStore((s) => s.duration);
  return (
    <div className="ml-2 hidden items-center gap-1.5 sm:flex">
      <span className="mono-time text-xs text-ink">{formatTime(time)}</span>
      <span className="text-faint">/</span>
      <span className="mono-time text-xs text-muted">{formatTime(duration)}</span>
    </div>
  );
}

function SpeedButton() {
  const speed = usePlayerStore((s) => s.speed);
  const menu = usePlayerStore((s) => s.menu);
  const active = menu === 'speed';
  return (
    <button
      onClick={() => usePlayerStore.getState().setMenu(active ? null : 'speed')}
      title="Playback speed (Ctrl+Up/Down)"
      className={`mono-time flex h-8 items-center rounded-sm2 px-2 text-xs transition-colors duration-fast ${
        active || speed !== 1 ? 'text-accent hover:bg-accent-dim' : 'text-ink hover:bg-white/14'
      }`}
    >
      {Number.isInteger(speed) ? speed.toFixed(1) : speed.toFixed(2)}×
    </button>
  );
}

function SubButton() {
  const menu = usePlayerStore((s) => s.menu);
  const subs = usePlayerStore((s) => s.tracks.subs);
  const subId = usePlayerStore((s) => s.subId);
  const active = menu === 'sub';
  return (
    <button
      onClick={() => usePlayerStore.getState().setMenu(active ? null : 'sub')}
      title="Subtitles (J)"
      className={`flex h-8 w-8 items-center justify-center rounded-sm2 transition-colors duration-fast ${
        active || (subId !== null && subs.length > 0) ? 'text-accent hover:bg-accent-dim' : 'text-ink hover:bg-white/14'
      }`}
    >
      <NamedIcon name="subtitle" size={19} />
    </button>
  );
}

function AudioButton() {
  const menu = usePlayerStore((s) => s.menu);
  const audio = usePlayerStore((s) => s.tracks.audio);
  const active = menu === 'audio';
  return (
    <button
      onClick={() => usePlayerStore.getState().setMenu(active ? null : 'audio')}
      title="Audio track (A)"
      className={`flex h-8 w-8 items-center justify-center rounded-sm2 transition-colors duration-fast ${
        active || audio.length > 0 ? 'text-accent hover:bg-accent-dim' : 'text-ink hover:bg-white/14'
      }`}
    >
      <NamedIcon name="audioTrack" size={19} />
    </button>
  );
}

function AspectButton() {
  const menu = usePlayerStore((s) => s.menu);
  const aspect = usePlayerStore((s) => s.aspect);
  const active = menu === 'aspect';
  return (
    <button
      onClick={() => usePlayerStore.getState().setMenu(active ? null : 'aspect')}
      title="Aspect ratio (T)"
      className={`flex h-8 w-8 items-center justify-center rounded-sm2 transition-colors duration-fast ${
        active || aspect !== 'auto' ? 'text-accent hover:bg-accent-dim' : 'text-ink hover:bg-white/14'
      }`}
    >
      <NamedIcon name="aspect" size={19} />
    </button>
  );
}

function MenuRow({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon?: string;
  label: string;
  hint?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-sm2 px-2 py-1.5 text-left text-xs transition-colors duration-fast hover:bg-white/14 ${
        active ? 'text-accent' : 'text-muted hover:text-ink'
      }`}
    >
      {icon ? <NamedIcon name={icon} size={14} /> : null}
      <span className="flex-1 truncate">{label}</span>
      {hint ? <span className="mono-time text-[10px] text-faint">{hint}</span> : null}
      {active ? <NamedIcon name="check" size={13} /> : null}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="px-2 pb-1 pt-2 text-[10px] uppercase tracking-widest text-faint">{children}</div>
  );
}

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4];

export function SpeedMenu() {
  const speed = usePlayerStore((s) => s.speed);
  const setSpeed = usePlayerStore((s) => s.setSpeed);
  return (
    <div>
      <SectionLabel>Speed</SectionLabel>
      <div className="grid grid-cols-5 gap-1 px-1 pb-2">
        {SPEED_PRESETS.map((sp) => (
          <button
            key={sp}
            onClick={() => setSpeed(sp)}
            className={`mono-time rounded-sm2 py-1 text-center text-[11px] transition-colors duration-fast ${
              Math.abs(speed - sp) < 0.001 ? 'bg-accent text-base' : 'text-muted hover:bg-white/14 hover:text-ink'
            }`}
          >
            {sp}×
          </button>
        ))}
      </div>
      <SectionLabel>Fine</SectionLabel>
      <div className="flex items-center gap-2 px-2 pb-1">
        <button
          onClick={() => setSpeed(Math.max(0.1, speed - 0.1))}
          className="flex h-6 w-6 items-center justify-center rounded-sm2 border border-line text-muted hover:bg-white/14 hover:text-ink"
        >
          <NamedIcon name="chevronLeft" size={13} />
        </button>
        <Slider value={speed} min={0.1} max={8} step={0.1} onChange={(v) => setSpeed(v)} label="Speed fine" />
        <button
          onClick={() => setSpeed(Math.min(8, speed + 0.1))}
          className="flex h-6 w-6 items-center justify-center rounded-sm2 border border-line text-muted hover:bg-white/14 hover:text-ink"
        >
          <NamedIcon name="chevronRight" size={13} />
        </button>
        <input
          type="number"
          value={speed.toFixed(1)}
          step={0.1}
          onChange={(e) => setSpeed(parseFloat(e.target.value) || 1)}
          className="mono-time w-14 rounded-sm2 border border-line bg-base px-1 py-0.5 text-center text-[11px] text-ink outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}

export function AudioMenu() {
  const audio = usePlayerStore((s) => s.tracks.audio);
  const audioId = usePlayerStore((s) => s.audioId);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const balance = usePlayerStore((s) => s.balance);
  const setBalance = usePlayerStore((s) => s.setBalance);
  const audioDelay = usePlayerStore((s) => s.audioDelay);
  const setAudioDelay = usePlayerStore((s) => s.setAudioDelay);
  return (
    <div>
      <SectionLabel>Audio tracks</SectionLabel>
      {audio.length === 0 ? (
        <div className="px-2 pb-2 text-[11px] text-faint">No alternate audio tracks</div>
      ) : (
        audio.map((t: EngineTrack) => (
          <MenuRow
            key={t.id}
            icon="audioTrack"
            label={`${t.title}${t.lang ? ` (${t.lang})` : ''}`}
            active={t.id === audioId}
            onClick={() => setTrack('audio', t.id)}
          />
        ))
      )}
      <SectionLabel>Balance</SectionLabel>
      <div className="px-2 pb-1">
        <Slider
          value={balance * 100}
          min={-100}
          max={100}
          onChange={(v) => setBalance(v)}
          label="Balance"
        />
      </div>
      <div className="px-2 pb-2">
        <LabeledSlider
          icon="clock"
          label="Audio delay"
          value={audioDelay}
          min={-5000}
          max={5000}
          step={50}
          onChange={setAudioDelay}
          format={formatDelay}
        />
      </div>
    </div>
  );
}

export function SubMenu() {
  const subs = usePlayerStore((s) => s.tracks.subs);
  const subId = usePlayerStore((s) => s.subId);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const subDelay = usePlayerStore((s) => s.subDelay);
  const setSubDelay = usePlayerStore((s) => s.setSubDelay);
  return (
    <div>
      <SectionLabel>Subtitle tracks</SectionLabel>
      {subs.length === 0 ? (
        <div className="px-2 pb-1 text-[11px] text-faint">No subtitle tracks</div>
      ) : (
        subs.map((t: EngineTrack) => (
          <MenuRow
            key={t.id}
            icon="subtitle"
            label={`${t.title}${t.lang ? ` (${t.lang})` : ''}`}
            active={t.id === subId}
            onClick={() => setTrack('sub', t.id)}
          />
        ))
      )}
<MenuRow icon="plus" label="Load subtitle file…" onClick={() => void browseSubtitleAndLoad()} />
      <div className="px-2 pb-2">
        <LabeledSlider
          icon="clock"
          label="Subtitle delay"
          value={subDelay}
          min={-5000}
          max={5000}
          step={50}
          onChange={setSubDelay}
          format={formatDelay}
        />
      </div>
    </div>
  );
}

export function AspectMenu() {
  const aspect = usePlayerStore((s) => s.aspect);
  const setAspect = usePlayerStore((s) => s.setAspect);
  const zoom = usePlayerStore((s) => s.zoom);
  const setZoom = usePlayerStore((s) => s.setZoom);
  const resetZoom = usePlayerStore((s) => s.resetZoom);
  const rotation = usePlayerStore((s) => s.rotation);
  const rotateBy = usePlayerStore((s) => s.rotateBy);
  const mirrored = usePlayerStore((s) => s.mirrored);
  const toggleMirror = usePlayerStore((s) => s.toggleMirror);
  const deinterlace = usePlayerStore((s) => s.deinterlace);
  const toggleDeinterlace = usePlayerStore((s) => s.toggleDeinterlace);
  const options: { label: string; value: AspectMode }[] = [
    { label: 'Auto (native)', value: 'auto' },
    { label: 'Fill window (crop bars)', value: 'fill' },
    { label: 'Fit window (stretch)', value: 'fit' },
    { label: '16:9', value: '16:9' },
    { label: '4:3', value: '4:3' },
    { label: '2.35:1 (cinema)', value: '2.35:1' },
    { label: '1:1 (square)', value: '1:1' },
  ];
  return (
    <div>
      <SectionLabel>Aspect ratio</SectionLabel>
      {options.map((o) => (
        <MenuRow key={o.value} label={o.label} active={aspect === o.value} onClick={() => setAspect(o.value)} />
      ))}
      <SectionLabel>Zoom & Crop</SectionLabel>
      <div className="flex items-center gap-1.5 px-2 py-1">
        {[
          { label: '100%', val: 1.0 },
          { label: '125%', val: 1.25 },
          { label: '150%', val: 1.5 },
          { label: '200%', val: 2.0 },
        ].map((p) => (
          <button
            key={p.val}
            onClick={() => p.val === 1.0 ? resetZoom() : setZoom(p.val)}
            className={`flex-1 rounded-sm2 py-1 text-center text-[11px] font-medium transition-colors ${
              zoom === p.val
                ? 'bg-accent font-semibold text-base'
                : 'bg-white/8 text-muted hover:bg-white/14 hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="px-2 pb-1.5 text-[10px] text-faint">
        💡 Pinch trackpad or Ctrl+Scroll to zoom smoothly
      </div>
      <SectionLabel>Video transform</SectionLabel>
      <MenuRow
        icon="rotate"
        label={`Rotate (${rotation}°)`}
        hint="Ctrl+Shift+R"
        onClick={() => rotateBy(90)}
      />
      <MenuRow icon="mirror" label="Mirror" active={mirrored} onClick={toggleMirror} />
      <MenuRow
        icon="deinterlace"
        label="Deinterlace"
        hint="D"
        active={deinterlace}
        onClick={toggleDeinterlace}
      />
    </div>
  );
}