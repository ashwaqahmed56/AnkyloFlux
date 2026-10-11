import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { engine, isDesktop, mpvEngine } from '../engine';
import { DEFAULT_EQ } from '../engine/types';
import type {
  AspectMode,
  Chapter,
  EqState,
  EngineTrack,
  MediaInfo,
  SubtitleCue,
} from '../engine/types';
import { usePlaylistStore } from './playlistStore';
import { useSettingsStore } from './settingsStore';
import { useToastStore } from './toastStore';
import { clamp, fileNameOf, formatDelay, formatSpeed } from '../utils/format';

export interface CenterNotice {
  icon: string;
  value: string;
  ts: number;
}

export type MenuKind = 'speed' | 'audio' | 'sub' | 'aspect' | null;

export interface DownloadState {
  active: boolean;
  name: string;
  percent: number;
  received: number;
  total: number;
  speedBps: number;
  error: string | null;
  path: string | null;
}

interface PlayerState {
  hasMedia: boolean;
  fileName: string;
  filePath: string;
  playing: boolean;
  buffering: boolean;
  time: number;
  duration: number;
  bufferedEnd: number;
  chapters: Chapter[];
  speed: number;
  volume: number;
  muted: boolean;
  balance: number;
  audioDelay: number;
  subDelay: number;
  repeat: boolean;
  tracks: { audio: EngineTrack[]; subs: EngineTrack[]; videos: EngineTrack[] };
  audioId: number | null;
  subId: number | null;
  subCues: SubtitleCue[] | null;
  aspect: AspectMode;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  mirrored: boolean;
  deinterlace: boolean;
  eq: EqState;
  mediaInfo: MediaInfo | null;
  isPip: boolean;
  fullscreen: boolean;
  controlsVisible: boolean;
  menu: MenuKind;
  contextMenu: { x: number; y: number } | null;
  paletteOpen: boolean;
  settingsOpen: boolean;
  aboutOpen: boolean;
  urlOpen: boolean;
  adjustmentsOpen: boolean;
  infoOpen: boolean;
  playlistOpen: boolean;
  mini: boolean;
  center: CenterNotice | null;
  dragOver: boolean;
  download: DownloadState;

  setAboutOpen: (b: boolean) => void;
  openPath: (path: string, opts?: { title?: string }) => void;
  closeMedia: () => void;
  togglePlay: () => void;
  stop: () => void;
  seekBy: (d: number) => void;
  seekTo: (t: number) => void;
  frameStep: (dir: 1 | -1) => void;
  setSpeed: (v: number, silent?: boolean) => void;
  cycleSpeed: (dir: 1 | -1) => void;
  setVolume: (v: number, silent?: boolean) => void;
  toggleMute: () => void;
  setBalance: (v: number) => void;
  setAudioDelay: (ms: number) => void;
  stepAudioDelay: (dir: 1 | -1) => void;
  setSubDelay: (ms: number) => void;
  stepSubDelay: (dir: 1 | -1) => void;
  setEq: (eq: Partial<EqState>) => void;
  resetEq: () => void;
  setAspect: (m: AspectMode) => void;
  cycleAspect: () => void;
  setZoom: (z: number) => void;
  adjustZoom: (delta: number) => void;
  setPan: (x: number, y: number) => void;
  resetZoom: () => void;
  setRotation: (deg: number) => void;
  rotateBy: (deg: number) => void;
  toggleMirror: () => void;
  toggleDeinterlace: () => void;
  applyHwdec: () => void;
  applyToneMap: () => void;
  cycleTrack: (kind: 'audio' | 'sub') => void;
  setTrack: (kind: 'audio' | 'sub', id: number) => void;
  addExternalSub: (path: string) => void;
  loadSubText: (text: string, name: string) => void;
  toggleRepeat: () => void;
  screenshot: () => void;
  togglePip: () => void;
  toggleMini: () => void;
  toggleFullscreen: () => void;
  showCenter: (icon: string, value: string) => void;
  setMenu: (m: MenuKind) => void;
  setContextMenu: (x: number, y: number) => void;
  closeContextMenu: () => void;
  setPaletteOpen: (b: boolean) => void;
  setSettingsOpen: (b: boolean) => void;
  setUrlOpen: (b: boolean) => void;
  setAdjustmentsOpen: (b: boolean) => void;
  setInfoOpen: (b: boolean) => void;
  setPlaylistOpen: (b: boolean) => void;
  setControlsVisible: (b: boolean) => void;
  setDragOver: (b: boolean) => void;
  setFullscreen: (b: boolean) => void;
  setIsPip: (b: boolean) => void;
  isStream: () => boolean;
  setPreparing: (b: boolean, title?: string) => void;
  startDownload: () => void;
  cancelDownload: () => void;
  onDownloadProgress: (p: Partial<DownloadState> & { done?: boolean }) => void;
}

const SPEED_STEPS = [0.25, 0.33, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 5, 6, 8];
const ASPECTS: AspectMode[] = ['auto', 'fill', 'fit', '16:9', '4:3', '2.35:1', '1:1'];

interface ResolvedStream {
  video: string;
  audio: string | null;
  title: string;
}

/**
 * Website links (YouTube and friends) are pages, not media files. Ask the
 * bundled resolver for direct stream URLs first; if it cannot handle the page,
 * hand the original URL to mpv, which still works for HLS/DASH/direct files.
 */
async function resolveAndPlay(url: string, fallbackTitle: string): Promise<void> {
  const store = usePlayerStore.getState();

  store.setPreparing(true, fallbackTitle);
  usePlaylistStore.getState().addRecent(url, fallbackTitle);

  try {
    const resolved = await invoke<ResolvedStream>('resolve_stream', { url });

    usePlayerStore.setState({
      hasMedia: true,
      fileName: resolved.title || fallbackTitle,
      filePath: url,
      mediaInfo: null,
      time: 0,
      duration: 0,
      chapters: [],
      tracks: { audio: [], subs: [], videos: [] },
      audioId: null,
      subId: null,
    });

    const mpv = mpvEngine();
    if (mpv) {
      mpv.openStream(resolved.video, resolved.audio ?? undefined);
    } else {
      engine.open(resolved.video, { title: resolved.title });
    }

    const st = usePlayerStore.getState();
    engine.setVolume(st.volume);
    engine.setMuted(st.muted);
    engine.setSpeed(useSettingsStore.getState().defaultSpeed);
    usePlayerStore.getState().setPreparing(false);
  } catch {
    // Not a supported page - let mpv try the URL directly.
    usePlayerStore.getState().setPreparing(false);
    engine.open(url, { title: fallbackTitle });
    usePlayerStore.setState({
      hasMedia: true,
      fileName: fallbackTitle,
      filePath: url,
      mediaInfo: null,
      time: 0,
      duration: 0,
    });
    const st = usePlayerStore.getState();
    engine.setVolume(st.volume);
    engine.setMuted(st.muted);
    engine.setSpeed(useSettingsStore.getState().defaultSpeed);
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  hasMedia: false,
  fileName: '',
  filePath: '',
  playing: false,
  buffering: false,
  time: 0,
  duration: 0,
  bufferedEnd: 0,
  chapters: [],
  speed: 1,
  volume: useSettingsStore.getState().volume / 100,
  muted: false,
  balance: 0,
  audioDelay: 0,
  subDelay: 0,
  repeat: false,
  tracks: { audio: [], subs: [], videos: [] },
  audioId: null,
  subId: null,
  subCues: null,
  aspect: 'auto',
  zoom: 1.0,
  panX: 0,
  panY: 0,
  rotation: 0,
  mirrored: false,
  deinterlace: false,
  eq: { ...DEFAULT_EQ },
  mediaInfo: null,
  isPip: false,
  fullscreen: false,
  controlsVisible: true,
  menu: null,
  contextMenu: null,
  paletteOpen: false,
  settingsOpen: false,
  aboutOpen: false,
  urlOpen: false,
  adjustmentsOpen: false,
  infoOpen: false,
  playlistOpen: false,
  mini: false,
  center: null,
  dragOver: false,
  download: {
    active: false,
    name: '',
    percent: 0,
    received: 0,
    total: 0,
    speedBps: 0,
    error: null,
    path: null,
  },

  openPath: (path, opts) => {
    const title = opts?.title ?? fileNameOf(path);

    if (isDesktop) {
      void invoke('diag', { msg: `openPath: ${path} (engine=${engine.kind})` })
        .catch(() => undefined);
    }

    if (isDesktop && /^https?:\/\//i.test(path)) {
      void resolveAndPlay(path, title);
      return;
    }

    engine.open(path, { title });
    usePlaylistStore.getState().addItem(path, title);
    usePlaylistStore.getState().addRecent(path, title);
    set({
      hasMedia: true,
      fileName: title,
      filePath: path,
      mediaInfo: null,
      chapters: [],
      tracks: { audio: [], subs: [], videos: [] },
      subCues: null,
      audioId: null,
      subId: null,
      time: 0,
      duration: 0,
      bufferedEnd: 0,
      subDelay: 0,
      audioDelay: 0,
    });
    const st = useSettingsStore.getState();
    engine.setVolume(get().volume);
    engine.setMuted(get().muted);
    engine.setSpeed(st.defaultSpeed);
    set({ speed: st.defaultSpeed });
    engine.setHwdec(st.hwdec);
    engine.setToneMap(st.tonemap);
    engine.setRepeat(get().repeat);
    engine.setAspect(get().aspect);
    engine.resetZoom();
    set({ zoom: 1.0, panX: 0, panY: 0 });
    engine.setEq(get().eq);
  },

  closeMedia: () => {
    engine.close();
    set({
      hasMedia: false,
      fileName: '',
      filePath: '',
      playing: false,
      buffering: false,
      time: 0,
      duration: 0,
      bufferedEnd: 0,
      chapters: [],
      tracks: { audio: [], subs: [], videos: [] },
      subCues: null,
      mediaInfo: null,
      audioDelay: 0,
      subDelay: 0,
      zoom: 1.0,
      panX: 0,
      panY: 0,
    });
    engine.resetZoom();
  },

  togglePlay: () => {
    if (!get().hasMedia) return;
    engine.togglePlay();
  },
  stop: () => engine.stop(),

  seekBy: (d) => {
    if (!get().hasMedia) return;
    engine.seekBy(d);
    get().showCenter(d > 0 ? 'forward10' : 'back10', `${d > 0 ? '+' : ''}${d.toFixed(0)}s`);
  },

  seekTo: (t) => {
    if (!get().hasMedia) return;
    engine.seekTo(t);
  },

  frameStep: (dir) => {
    if (!get().hasMedia) return;
    engine.frameStep(dir);
    get().showCenter(dir > 0 ? 'next' : 'prev', `${dir > 0 ? '+' : '-'}${1} frame`);
  },

  setSpeed: (v, silent) => {
    const s = clamp(v, 0.1, 8);
    engine.setSpeed(s);
    set({ speed: s });
    if (!silent) get().showCenter('speed', formatSpeed(s));
  },

  cycleSpeed: (dir) => {
    const steps = SPEED_STEPS;
    const cur = get().speed;
    let idx = steps.findIndex((s) => s >= cur - 0.001);
    if (idx < 0) idx = 0;
    const next = clamp(idx + dir, 0, steps.length - 1);
    get().setSpeed(steps[next]);
  },

  setVolume: (v, silent) => {
    const vol = clamp(v, 0, 100) / 100;
    engine.setVolume(vol);
    if (vol > 0) engine.setMuted(false);
    if (!silent) useSettingsStore.getState().setVolume(clamp(v, 0, 100));
    set({ volume: vol, muted: vol === 0 });
    if (!silent) {
      get().showCenter(
        vol === 0 ? 'volumeMute' : vol < 0.4 ? 'volumeLow' : 'volumeHigh',
        `${Math.round(vol * 100)}%`,
      );
    }
  },

  toggleMute: () => {
    const m = !get().muted;
    engine.setMuted(m);
    set({ muted: m });
    get().showCenter(m ? 'volumeMute' : 'volumeHigh', m ? 'Muted' : `${Math.round(get().volume * 100)}%`);
  },

  setBalance: (v) => {
    const b = clamp(v, -100, 100) / 100;
    engine.setBalance(b);
    set({ balance: b });
    get().showCenter('audioTrack', b === 0 ? 'Center' : b < 0 ? `L ${Math.abs(Math.round(b * 100))}%` : `R ${Math.round(b * 100)}%`);
  },

  setAudioDelay: (ms) => {
    engine.setAudioDelay(ms);
    set({ audioDelay: ms });
    get().showCenter('audioTrack', formatDelay(ms));
  },

  stepAudioDelay: (dir) => {
    get().setAudioDelay(clamp(get().audioDelay + dir * 50, -5000, 5000));
  },

  setSubDelay: (ms) => {
    engine.setSubDelay(ms);
    set({ subDelay: ms });
    get().showCenter('subtitle', formatDelay(ms));
  },

  stepSubDelay: (dir) => {
    get().setSubDelay(clamp(get().subDelay + dir * 50, -5000, 5000));
  },

  setEq: (eq) => {
    const next = { ...get().eq, ...eq };
    engine.setEq(next);
    set({ eq: next });
  },

  resetEq: () => {
    engine.setEq({ ...DEFAULT_EQ });
    set({ eq: { ...DEFAULT_EQ } });
    useToastStore.getState().push('Video adjustments reset', 'adjust');
  },

  setAspect: (m) => {
    engine.setAspect(m);
    set({ aspect: m });
    const label =
      m === 'auto'
        ? 'Auto (native)'
        : m === 'fill'
        ? 'Fill window (crop bars)'
        : m === 'fit'
        ? 'Fit window (stretch)'
        : m;
    get().showCenter('aspect', label);
  },

  cycleAspect: () => {
    const idx = ASPECTS.indexOf(get().aspect);
    get().setAspect(ASPECTS[(idx + 1) % ASPECTS.length]);
  },

  setZoom: (z) => {
    const clamped = Math.round(clamp(z, 0.5, 4.0) * 100) / 100;
    engine.setZoom(clamped);
    set({ zoom: clamped });
    get().showCenter('search', `Zoom ${Math.round(clamped * 100)}%`);
  },

  adjustZoom: (delta) => {
    get().setZoom(get().zoom + delta);
  },

  setPan: (x, y) => {
    const px = clamp(x, -1.0, 1.0);
    const py = clamp(y, -1.0, 1.0);
    engine.setPan(px, py);
    set({ panX: px, panY: py });
  },

  resetZoom: () => {
    engine.resetZoom();
    set({ zoom: 1.0, panX: 0, panY: 0 });
    get().showCenter('search', 'Zoom 100%');
  },

  setRotation: (deg) => {
    engine.setRotation(deg);
    set({ rotation: deg });
    get().showCenter('rotate', `${deg}°`);
  },

  rotateBy: (deg) => {
    get().setRotation((get().rotation + deg + 360) % 360);
  },

  toggleMirror: () => {
    const m = !get().mirrored;
    engine.setMirrored(m);
    set({ mirrored: m });
    get().showCenter('mirror', m ? 'On' : 'Off');
  },

  toggleDeinterlace: () => {
    const d = !get().deinterlace;
    engine.setDeinterlace(d);
    set({ deinterlace: d });
    get().showCenter('deinterlace', d ? 'On' : 'Off');
  },

  applyHwdec: () => {
    engine.setHwdec(useSettingsStore.getState().hwdec);
  },

  applyToneMap: () => {
    engine.setToneMap(useSettingsStore.getState().tonemap);
  },

  cycleTrack: (kind) => {
    engine.cycleTrack(kind);
    if (kind === 'audio') get().showCenter('audioTrack', 'Next track');
    else get().showCenter('subtitle', 'Next track');
  },

  setTrack: (kind, id) => {
    engine.setTrack(kind, id);
  },

  addExternalSub: (path) => engine.addExternalSub(path),

  loadSubText: (text, name) => {
    engine.loadSubText(text, name);
    useToastStore.getState().push(`Loaded ${name}`, 'subtitle');
  },

  toggleRepeat: () => {
    const next = !get().repeat;
    set({ repeat: next });
    get().showCenter('loop', next ? 'Repeat on' : 'Repeat off');
    engine.setRepeat(next);
    if (next && !get().playing && get().duration > 0 && Math.abs(get().time - get().duration) < 1.0) {
      engine.seekTo(0);
      engine.play();
    }
  },

  screenshot: () => {
    engine.screenshot();
    useToastStore.getState().push('Frame captured', 'screenshot');
  },

  togglePip: () => {
    if (get().isPip) engine.exitPip();
    else engine.enterPip();
  },

  toggleMini: () => set((s) => ({ mini: !s.mini })),

  toggleFullscreen: () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      document.documentElement.requestFullscreen().catch(() => undefined);
    }
  },

  showCenter: (icon, value) => set({ center: { icon, value, ts: Date.now() } }),

  setMenu: (m) => set({ menu: m }),

  setContextMenu: (x, y) => set({ contextMenu: { x, y } }),
  closeContextMenu: () => set({ contextMenu: null }),

  setPaletteOpen: (b) => set({ paletteOpen: b }),
  setSettingsOpen: (b) => set({ settingsOpen: b }),
  setAboutOpen: (b) => set({ aboutOpen: b }),
  setUrlOpen: (b) => set({ urlOpen: b }),
  setAdjustmentsOpen: (b) => set({ adjustmentsOpen: b }),
  setInfoOpen: (b) => set({ infoOpen: b }),
  setPlaylistOpen: (b) => set({ playlistOpen: b }),
  setControlsVisible: (b) => set({ controlsVisible: b }),
  setDragOver: (b) => set({ dragOver: b }),
setFullscreen: (b) => set({ fullscreen: b }),
setIsPip: (b) => set({ isPip: b }),

setPreparing: (b, title) => {
  if (b) {
    // The surface shows neither the spinner (needs playing) nor the play
    // button (needs !buffering) while this holds, so the toast is the only
    // feedback until the engine reports a real state.
    set({ fileName: title ?? '', hasMedia: true, playing: false, buffering: true });
    useToastStore.getState().push('Resolving stream...', 'globe');
  } else {
    set({ buffering: false });
  }
},

isStream: () => /^https?:\/\//i.test(get().filePath),

startDownload: () => {
  if (!get().isStream()) {
    useToastStore.getState().push('Only stream URLs can be downloaded', 'close');
    return;
  }
  if (get().download.active) return;
  set({
    download: {
      active: true,
      name: get().fileName || 'download',
      percent: 0,
      received: 0,
      total: 0,
      speedBps: 0,
      error: null,
      path: null,
    },
  });
  useToastStore.getState().push('Download started', 'download');

  const url = get().filePath;
  void invoke<string>('download_media', { url })
    .then((path) => {
      get().onDownloadProgress({ done: true, path, error: null });
    })
    .catch((e) => {
      get().onDownloadProgress({
        done: true,
        error: typeof e === 'string' ? e : String(e),
      });
    });
},

cancelDownload: () => {
  void invoke('download_cancel').catch(() => undefined);
  set((s) => ({ download: { ...s.download, active: false } }));
},

onDownloadProgress: (p) => {
  const cur = get().download;
  const next: DownloadState = {
    ...cur,
    name: p.name ?? cur.name,
    percent: p.percent ?? cur.percent,
    received: p.received ?? cur.received,
    total: p.total ?? cur.total,
    speedBps: p.speedBps ?? cur.speedBps,
    error: p.error ?? null,
    path: p.path ?? null,
  };

  if (p.done) {
    next.active = false;
    if (next.error) {
      useToastStore.getState().push(next.error === 'cancelled' ? 'Download cancelled' : next.error, 'close');
    } else if (next.path) {
      useToastStore.getState().push(`Saved to ${next.path}`, 'check');
    }
  }
  set({ download: next });
},
}));


