import { usePlayerStore } from '../state/playerStore';
import { useSettingsStore } from '../state/settingsStore';
import { DEFAULT_EQ } from '../engine/types';
import { Panel } from './Panel';
import { LabeledSlider } from './Slider';
import { formatDelay, formatSpeed } from '../utils/format';
import { NamedIcon } from '../icons';

function Section({ icon, title, children, onReset }: { icon: string; title: string; children: React.ReactNode; onReset?: () => void }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
          <NamedIcon name={icon} size={13} />
          {title}
        </div>
        {onReset ? (
          <button
            onClick={onReset}
            className="text-[10px] uppercase tracking-wide text-faint transition-colors duration-fast hover:text-accent"
          >
            reset
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-sm2 border px-2 py-1 text-[11px] transition-colors duration-fast ${
            value === o.value
              ? 'border-accent bg-accent-dim text-accent'
              : 'border-line text-muted hover:bg-white/12 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AdjustmentsPanel() {
  const open = usePlayerStore((s) => s.adjustmentsOpen);
  const eq = usePlayerStore((s) => s.eq);
  const setEq = usePlayerStore((s) => s.setEq);
  const resetEq = usePlayerStore((s) => s.resetEq);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const balance = usePlayerStore((s) => s.balance);
  const setBalance = usePlayerStore((s) => s.setBalance);
  const audioDelay = usePlayerStore((s) => s.audioDelay);
  const setAudioDelay = usePlayerStore((s) => s.setAudioDelay);
  const subDelay = usePlayerStore((s) => s.subDelay);
  const setSubDelay = usePlayerStore((s) => s.setSubDelay);
  const speed = usePlayerStore((s) => s.speed);
  const setSpeed = usePlayerStore((s) => s.setSpeed);
  const hwdec = useSettingsStore((s) => s.hwdec);
  const setHwdec = useSettingsStore((s) => s.setHwdec);
  const applyHwdec = usePlayerStore((s) => s.applyHwdec);
  const tonemap = useSettingsStore((s) => s.tonemap);
  const setToneMap = useSettingsStore((s) => s.setToneMap);
  const applyToneMap = usePlayerStore((s) => s.applyToneMap);
  const subs = useSettingsStore((s) => s.subs);
  const setSubs = useSettingsStore((s) => s.setSubs);
  const rotation = usePlayerStore((s) => s.rotation);
  const rotateBy = usePlayerStore((s) => s.rotateBy);
  const mirrored = usePlayerStore((s) => s.mirrored);
  const toggleMirror = usePlayerStore((s) => s.toggleMirror);
  const deinterlace = usePlayerStore((s) => s.deinterlace);
  const toggleDeinterlace = usePlayerStore((s) => s.toggleDeinterlace);

  if (!open) return null;

  return (
    <Panel title="Adjustments" icon="adjust" name="adjustments" width={308} onClose={() => usePlayerStore.getState().setAdjustmentsOpen(false)}>
      <Section icon="brightness" title="Video" onReset={resetEq}>
        <LabeledSlider icon="brightness" label="Brightness" value={eq.brightness} min={-100} max={100} onChange={(v) => setEq({ brightness: v })} defaultValue={DEFAULT_EQ.brightness} onReset={() => setEq({ brightness: DEFAULT_EQ.brightness })} format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`} />
        <LabeledSlider icon="contrast" label="Contrast" value={eq.contrast} min={-100} max={100} onChange={(v) => setEq({ contrast: v })} defaultValue={DEFAULT_EQ.contrast} onReset={() => setEq({ contrast: DEFAULT_EQ.contrast })} format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`} />
        <LabeledSlider icon="saturation" label="Saturation" value={eq.saturation} min={-100} max={100} onChange={(v) => setEq({ saturation: v })} defaultValue={DEFAULT_EQ.saturation} onReset={() => setEq({ saturation: DEFAULT_EQ.saturation })} format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`} />
        <LabeledSlider icon="gamma" label="Gamma" value={eq.gamma} min={-100} max={100} onChange={(v) => setEq({ gamma: v })} defaultValue={DEFAULT_EQ.gamma} onReset={() => setEq({ gamma: DEFAULT_EQ.gamma })} format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`} />
        <LabeledSlider icon="hue" label="Hue" value={eq.hue} min={-100} max={100} onChange={(v) => setEq({ hue: v })} defaultValue={DEFAULT_EQ.hue} onReset={() => setEq({ hue: DEFAULT_EQ.hue })} format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`} />
        <LabeledSlider icon="sharpness" label="Sharpness" value={eq.sharpness} min={0} max={100} onChange={(v) => setEq({ sharpness: v })} defaultValue={DEFAULT_EQ.sharpness} onReset={() => setEq({ sharpness: DEFAULT_EQ.sharpness })} />
      </Section>

      <Section icon="equalizer" title="Audio">
        <LabeledSlider icon="volumeHigh" label="Volume" value={Math.round(volume * 100)} min={0} max={100} onChange={(v) => setVolume(v)} format={(v) => `${Math.round(v)}%`} />
        <LabeledSlider icon="audioTrack" label="Balance" value={balance * 100} min={-100} max={100} onChange={(v) => setBalance(v)} format={(v) => (v === 0 ? 'C' : v < 0 ? `L${Math.round(-v)}` : `R${Math.round(v)}`)} />
        <LabeledSlider icon="clock" label="Audio delay" value={audioDelay} min={-5000} max={5000} step={50} onChange={setAudioDelay} format={formatDelay} />
      </Section>

      <Section icon="subtitle" title="Subtitles">
        <LabeledSlider icon="clock" label="Delay" value={subDelay} min={-5000} max={5000} step={50} onChange={setSubDelay} format={formatDelay} />
        <LabeledSlider icon="subtitle" label="Font size" value={subs.size} min={20} max={80} onChange={(v) => setSubs({ size: v })} format={(v) => `${Math.round(v)}%`} />
        <LabeledSlider icon="arrowDown" label="Position" value={subs.position} min={0} max={60} onChange={(v) => setSubs({ position: v })} format={(v) => `${Math.round(v)}%`} />
        <div className="mb-2 flex items-center gap-1.5">
          {['#ffffff', '#ffe082', '#81d4fa', '#aed581', '#f48fb1', '#b0bec5'].map((c) => (
            <button
              key={c}
              onClick={() => setSubs({ color: c })}
              aria-label={`Subtitle color ${c}`}
              className={`h-5 w-5 rounded-sm2 border transition-transform duration-fast hover:scale-110 ${
                subs.color === c ? 'border-accent' : 'border-line'
              }`}
              style={{ background: c }}
            />
          ))}
          <button
            onClick={() => setSubs({ outline: !subs.outline })}
            className={`ml-auto flex h-6 items-center rounded-sm2 border px-2 text-[10px] uppercase transition-colors duration-fast ${
              subs.outline ? 'border-accent bg-accent-dim text-accent' : 'border-line text-faint hover:text-ink'
            }`}
          >
            outline
          </button>
        </div>
      </Section>

      <Section icon="speed" title="Playback">
        <LabeledSlider icon="speed" label="Speed" value={speed} min={0.1} max={8} step={0.05} onChange={(v) => setSpeed(v)} format={formatSpeed} defaultValue={1} />
        <div className="mb-2 mt-1 text-[10px] uppercase tracking-wide text-faint">Hardware decode</div>
        <Segmented
          value={hwdec}
          onChange={(v) => {
            setHwdec(v);
            applyHwdec();
          }}
          options={[
            { label: 'Auto', value: 'auto' },
            { label: 'On', value: 'auto-safe' },
            { label: 'Off', value: 'no' },
          ]}
        />
        <div className="mb-2 mt-3 text-[10px] uppercase tracking-wide text-faint">HDR → SDR tone map</div>
        <Segmented
          value={tonemap}
          onChange={(v) => {
            setToneMap(v);
            applyToneMap();
          }}
          options={[
            { label: 'Auto', value: 'auto' },
            { label: 'Off', value: 'no' },
            { label: 'Reinhard', value: 'reinhard' },
            { label: 'Hable', value: 'hable' },
            { label: 'Mobile', value: 'mobile' },
          ]}
        />
      </Section>

      <Section icon="aspect" title="Display">
        <div className="mb-2 flex items-center gap-1.5">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => usePlayerStore.getState().setRotation(deg)}
              className={`mono-time flex-1 rounded-sm2 border py-1 text-[11px] transition-colors duration-fast ${
                rotation === deg ? 'border-accent bg-accent-dim text-accent' : 'border-line text-muted hover:bg-white/12 hover:text-ink'
              }`}
            >
              {deg}°
            </button>
          ))}
          <button onClick={() => rotateBy(90)} className="flex h-7 w-7 items-center justify-center rounded-sm2 border border-line text-muted hover:bg-white/12 hover:text-ink" title="Rotate 90°">
            <NamedIcon name="rotate" size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleMirror} className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm2 border py-1.5 text-[11px] transition-colors duration-fast ${mirrored ? 'border-accent bg-accent-dim text-accent' : 'border-line text-muted hover:bg-white/12 hover:text-ink'}`}>
            <NamedIcon name="mirror" size={13} /> Mirror
          </button>
          <button onClick={toggleDeinterlace} className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm2 border py-1.5 text-[11px] transition-colors duration-fast ${deinterlace ? 'border-accent bg-accent-dim text-accent' : 'border-line text-muted hover:bg-white/12 hover:text-ink'}`}>
            <NamedIcon name="deinterlace" size={13} /> Deinterlace
          </button>
        </div>
      </Section>
    </Panel>
  );
}