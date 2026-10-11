import { useEffect, useMemo, useState } from 'react';
import { usePlayerStore } from '../state/playerStore';
import { useSettingsStore, DEFAULT_SHORTCUTS } from '../state/settingsStore';
import { getActions, keyEventToString } from '../state/actions';
import { isDesktop } from '../engine';
import { NamedIcon } from '../icons';
import { formatSpeed } from '../utils/format';
import { Slider } from './Slider';
import { openExternal } from '../utils/openExternal';
import { APP_INFO } from './AboutDialog';

function Modal({ children, onClose, width = 600 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-6" onPointerDown={onClose}>
      <div
        className="anim-pop-in max-h-[86vh] w-full overflow-hidden rounded-md2 border border-line bg-surface shadow-2xl"
        style={{ width }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-4 last:border-0">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">{title}</div>
      {children}
    </section>
  );
}

function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Accent ${color}`}
      className={`h-6 w-6 rounded-sm2 border-2 transition-transform duration-fast hover:scale-110 ${active ? 'border-ink' : 'border-transparent'}`}
      style={{ background: color }}
    />
  );
}

function ShortcutRow({ id, title, keys }: { id: string; title: string; keys: string[] }) {
  const setShortcut = useSettingsStore((s) => s.setShortcut);
  const [capturing, setCapturing] = useState(false);
  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setCapturing(false);
        return;
      }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
      setShortcut(id, [keyEventToString(e)]);
      setCapturing(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [capturing, id, setShortcut]);

  const isDefault = (DEFAULT_SHORTCUTS[id] ?? []).join(',') === (keys ?? []).join(',');

  return (
    <div className="flex items-center justify-between border-b border-line/50 py-1.5">
      <span className="text-[11px] text-muted">{title}</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCapturing(true)}
          className={`mono-time min-w-[92px] rounded-sm2 border px-2 py-1 text-[10px] transition-colors duration-fast ${
            capturing
              ? 'border-accent bg-accent-dim text-accent'
              : 'border-line text-ink hover:bg-white/12'
          }`}
        >
          {capturing ? 'Press keys…' : keys.length ? keys.join(', ') : '—'}
        </button>
        {!isDefault ? (
          <button
            onClick={() => setShortcut(id, DEFAULT_SHORTCUTS[id] ?? [])}
            title="Reset shortcut"
            className="flex h-6 w-6 items-center justify-center rounded-sm2 text-faint transition-colors duration-fast hover:bg-white/12 hover:text-accent"
          >
            <NamedIcon name="rotate" size={12} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsDialog() {
  const open = usePlayerStore((s) => s.settingsOpen);
  const close = () => usePlayerStore.getState().setSettingsOpen(false);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const accent = useSettingsStore((s) => s.accent);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const defaultSpeed = useSettingsStore((s) => s.defaultSpeed);
  const setDefaultSpeed = useSettingsStore((s) => s.setDefaultSpeed);
  const hwdec = useSettingsStore((s) => s.hwdec);
  const setHwdec = useSettingsStore((s) => s.setHwdec);
  const tonemap = useSettingsStore((s) => s.tonemap);
  const setToneMap = useSettingsStore((s) => s.setToneMap);
  const resetShortcuts = useSettingsStore((s) => s.resetShortcuts);
  const clickToPlayPause = useSettingsStore((s) => s.clickToPlayPause);
  const setClickToPlayPause = useSettingsStore((s) => s.setClickToPlayPause);
  const doubleTapSeek = useSettingsStore((s) => s.doubleTapSeek);
  const setDoubleTapSeek = useSettingsStore((s) => s.setDoubleTapSeek);
  const doubleTapSeekSeconds = useSettingsStore((s) => s.doubleTapSeekSeconds);
  const setDoubleTapSeekSeconds = useSettingsStore((s) => s.setDoubleTapSeekSeconds);

  const actions = useMemo(() => (open ? getActions() : []), [open]);

  if (!open) return null;

  return (
    <Modal onClose={close} width={620}>
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          <NamedIcon name="gear" size={15} className="text-accent" />
          Settings
        </div>
        <button onClick={close} className="flex h-7 w-7 items-center justify-center rounded-sm2 text-faint hover:bg-white/14 hover:text-ink">
          <NamedIcon name="close" size={14} />
        </button>
      </header>

      <div className="max-h-[70vh] overflow-y-auto">
        <Section title="Appearance">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] text-muted">Theme</span>
            <div className="flex gap-1">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-sm2 border px-3 py-1 text-[11px] capitalize transition-colors duration-fast ${
                    theme === t ? 'border-accent bg-accent-dim text-accent' : 'border-line text-muted hover:bg-white/12 hover:text-ink'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">Accent</span>
            <div className="flex gap-2">
              <Swatch color="#e0a458" active={accent === 'amber'} onClick={() => setAccent('amber')} />
              <Swatch color="#57b8a2" active={accent === 'teal'} onClick={() => setAccent('teal')} />
              <Swatch color="#a39e97" active={accent === 'gray'} onClick={() => setAccent('gray')} />
              <Swatch color="#cf7f8e" active={accent === 'rose'} onClick={() => setAccent('rose')} />
            </div>
          </div>
        </Section>

        <Section title="Playback">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="text-[11px] text-muted">Default speed</span>
            <div className="flex w-56 items-center gap-2">
              <Slider value={defaultSpeed} min={0.1} max={8} step={0.05} onChange={setDefaultSpeed} label="Default speed" />
              <span className="mono-time w-10 text-right text-[11px] text-ink">{formatSpeed(defaultSpeed)}</span>
            </div>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] text-muted">Hardware decoding</span>
            <div className="flex gap-1">
              {[
                { label: 'Auto', value: 'auto' },
                { label: 'Auto safe', value: 'auto-safe' },
                { label: 'Software', value: 'no' },
              ].map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setHwdec(o.value);
                    usePlayerStore.getState().applyHwdec();
                  }}
                  className={`rounded-sm2 border px-2.5 py-1 text-[11px] transition-colors duration-fast ${
                    hwdec === o.value ? 'border-accent bg-accent-dim text-accent' : 'border-line text-muted hover:bg-white/12 hover:text-ink'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">HDR → SDR</span>
            <div className="flex gap-1">
              {[
                { label: 'Auto', value: 'auto' },
                { label: 'Off', value: 'no' },
                { label: 'Hable', value: 'hable' },
              ].map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setToneMap(o.value);
                    usePlayerStore.getState().applyToneMap();
                  }}
                  className={`rounded-sm2 border px-2.5 py-1 text-[11px] transition-colors duration-fast ${
                    tonemap === o.value ? 'border-accent bg-accent-dim text-accent' : 'border-line text-muted hover:bg-white/12 hover:text-ink'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Gestures & Controls">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted">Tap to Play / Pause</span>
              <span className="text-[10px] text-faint">Click or tap video to pause or resume</span>
            </div>
            <div className="flex gap-1">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((o) => (
                <button
                  key={String(o.value)}
                  onClick={() => setClickToPlayPause(o.value)}
                  className={`rounded-sm2 border px-3 py-1 text-[11px] transition-colors duration-fast ${
                    clickToPlayPause === o.value
                      ? 'border-accent bg-accent-dim text-accent'
                      : 'border-line text-muted hover:bg-white/12 hover:text-ink'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted">Double-tap to Seek</span>
              <span className="text-[10px] text-faint">Double-tap left to rewind, right to forward</span>
            </div>
            <div className="flex gap-1">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((o) => (
                <button
                  key={String(o.value)}
                  onClick={() => setDoubleTapSeek(o.value)}
                  className={`rounded-sm2 border px-3 py-1 text-[11px] transition-colors duration-fast ${
                    doubleTapSeek === o.value
                      ? 'border-accent bg-accent-dim text-accent'
                      : 'border-line text-muted hover:bg-white/12 hover:text-ink'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted">Double-tap Seek Step</span>
              <span className="text-[10px] text-faint">Seconds skipped per double-tap</span>
            </div>
            <div className="flex gap-1">
              {[5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  disabled={!doubleTapSeek}
                  onClick={() => setDoubleTapSeekSeconds(sec)}
                  className={`rounded-sm2 border px-2.5 py-1 text-[11px] transition-colors duration-fast ${
                    doubleTapSeekSeconds === sec
                      ? 'border-accent bg-accent-dim text-accent'
                      : 'border-line text-muted hover:bg-white/12 hover:text-ink'
                  } ${!doubleTapSeek ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Keyboard shortcuts">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] text-faint">Click a binding, then press the new key combination.</span>
            <button onClick={resetShortcuts} className="text-[10px] uppercase tracking-wide text-faint transition-colors duration-fast hover:text-accent">
              reset all
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            {actions.map((a) => (
              <ShortcutRow key={a.id} id={a.id} title={a.title} keys={a.keys} />
            ))}
          </div>
        </Section>

        <Section title="About & Developer">
          <div className="rounded-md2 border border-line bg-elevated/40 p-3.5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-dim font-bold text-accent">
                  <span className="mono-time text-xs font-semibold">AA</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">{APP_INFO.developer.name}</span>
                    <span className="rounded border border-accent/30 bg-accent-dim px-1.5 py-0.2 text-[9px] font-medium text-accent">
                      Developer
                    </span>
                  </div>
                  <div className="text-[10px] text-faint">
                    Ankylo · v{APP_INFO.version} ({isDesktop ? 'libmpv' : 'browser'})
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  close();
                  usePlayerStore.getState().setAboutOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-sm2 border border-line bg-white/5 px-2.5 py-1 text-[11px] text-muted transition-colors duration-fast hover:border-accent hover:bg-accent-dim hover:text-accent"
              >
                <span>Full About</span>
                <NamedIcon name="brand" size={13} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void openExternal(APP_INFO.developer.github)}
                className="flex items-center justify-between rounded-sm2 border border-line bg-base px-2.5 py-1.5 text-left text-xs transition-colors duration-fast hover:border-accent hover:bg-accent-dim/30 hover:text-accent"
              >
                <div className="flex items-center gap-2 truncate">
                  <NamedIcon name="github" size={14} className="text-muted" />
                  <span className="truncate text-[11px] font-medium text-muted">GitHub</span>
                </div>
                <NamedIcon name="externalLink" size={12} className="text-faint" />
              </button>

              <button
                onClick={() => void openExternal(APP_INFO.developer.linkedin)}
                className="flex items-center justify-between rounded-sm2 border border-line bg-base px-2.5 py-1.5 text-left text-xs transition-colors duration-fast hover:border-accent hover:bg-accent-dim/30 hover:text-accent"
              >
                <div className="flex items-center gap-2 truncate">
                  <NamedIcon name="linkedin" size={14} className="text-[#0a84e3]" />
                  <span className="truncate text-[11px] font-medium text-muted">LinkedIn</span>
                </div>
                <NamedIcon name="externalLink" size={12} className="text-faint" />
              </button>
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-between px-5 py-3">
          <span className="mono-time text-[10px] text-faint">
            Ankylo 0.1.0 · {isDesktop ? 'libmpv + bundled FFmpeg' : 'browser engine'}
          </span>
          <button
            onClick={close}
            className="rounded-sm2 border border-line px-3 py-1 text-[11px] text-muted transition-colors duration-fast hover:bg-white/12 hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function UrlDialog() {
  const open = usePlayerStore((s) => s.urlOpen);
  const close = () => usePlayerStore.getState().setUrlOpen(false);
  const openPath = usePlayerStore((s) => s.openPath);
  const [url, setUrl] = useState('');

  if (!open) return null;

  return (
    <Modal onClose={close} width={440}>
      <div className="border-b border-line px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          <NamedIcon name="globe" size={15} className="text-accent" />
          Open stream URL
        </div>
      </div>
      <div className="px-5 py-4">
        <input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url.trim()) {
              openPath(url.trim(), { title: url.trim() });
              setUrl('');
              close();
            }
          }}
          placeholder="https://example.com/stream.m3u8"
          className="mono-time w-full rounded-sm2 border border-line bg-base px-3 py-2 text-xs text-ink outline-none transition-colors duration-fast placeholder:text-faint focus:border-accent"
        />
        <p className="mt-2 text-[10px] text-faint">
          HLS (.m3u8), DASH (.mpd), RTSP and HTTP progressive sources are handled by the playback engine.
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
        <button onClick={close} className="rounded-sm2 border border-line px-3 py-1.5 text-[11px] text-muted hover:bg-white/12 hover:text-ink">
          Cancel
        </button>
        <button
          disabled={!url.trim()}
          onClick={() => {
            openPath(url.trim(), { title: url.trim() });
            setUrl('');
            close();
          }}
          className="rounded-sm2 border border-accent bg-accent-dim px-3 py-1.5 text-[11px] text-accent transition-colors duration-fast hover:bg-accent hover:text-base disabled:opacity-40"
        >
          Open
        </button>
      </div>
    </Modal>
  );
}