import type {
  AspectMode,
  EngineHost,
  EngineTrack,
  EqState,
  OpenOptions,
  PlayerEngine,
  SubtitleCue,
} from './types';
import { extOf } from '../utils/format';
import { clamp } from '../utils/format';

declare global {
  interface Window {
    __ankyloSetSharpness?: (v: number) => void;
  }
}

interface AudioTrackLike {
  enabled: boolean;
  label: string;
  language: string;
}

interface TextTrackLike {
  mode: string;
  label: string;
  language: string;
}

type VideoWithTracks = HTMLVideoElement & {
  audioTracks: { length: number; [index: number]: AudioTrackLike };
};

interface DashLike {
  reset: () => void;
}

interface HlsLike {
  loadSource: (url: string) => void;
  attachMedia: (el: HTMLMediaElement) => void;
  destroy: () => void;
  on: (event: unknown, cb: (event: unknown, data: { fatal?: boolean }) => void) => void;
}

function parseTimestamp(s: string): number {
  let m = s.match(/(\d+):(\d+):(\d+)[.,](\d+)/);
  if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
  m = s.match(/(\d+):(\d+)[.,](\d+)/);
  if (m) return +m[1] * 60 + +m[2] + +m[3] / 1000;
  return 0;
}

function parseCues(raw: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const clean = raw.replace(/\r/g, '');
  const blocks = clean.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    let i = 0;
    if (/^WEBVTT/i.test(lines[0])) i = 1;
    if (i < lines.length && /^\d+$/.test(lines[i])) i++;
    if (i >= lines.length) continue;
    const mm = lines[i].match(
      /(\d+:\d+:\d+[.,]\d+|\d+:\d+[.,]\d+)\s*-->\s*(\d+:\d+:\d+[.,]\d+|\d+:\d+[.,]\d+)/,
    );
    if (!mm) continue;
    const start = parseTimestamp(mm[1]);
    const end = parseTimestamp(mm[2]);
    let text = lines.slice(i + 1).join('\n');
    text = text.replace(/\{[^}]*\}/g, '').replace(/\\N/g, '\n').replace(/\\n/g, '\n');
    if (text) cues.push({ start, end, text });
  }
  return cues;
}

export class MseEngine implements PlayerEngine {
  readonly kind = 'browser' as const;

  private host: EngineHost | null = null;
  private video: HTMLVideoElement | null = null;
  private hls: HlsLike | null = null;
  private dash: DashLike | null = null;
  private objectUrl: string | null = null;
  private raf = 0;

  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private panner: StereoPannerNode | null = null;

  private subCues: SubtitleCue[] = [];
  private subLabel = '';
  private fps = 30;
  private boundElements = new WeakSet<HTMLVideoElement>();
  private currentTitle = '';
  private volume = 0.8;
  private muted = false;
  private speed = 1;
  private eq: EqState = { brightness: 0, contrast: 0, saturation: 0, gamma: 0, hue: 0, sharpness: 0 };
  private aspect: AspectMode = 'auto';
  private zoomScale = 1.0;
  private panX = 0;
  private panY = 0;
  private rotation = 0;
  private mirrored = false;
  private repeat = false;
  private pending: { url: string; isHls: boolean; isDash: boolean } | null = null;

  bind(host: EngineHost): void {
    this.host = host;
  }

  attach(el: HTMLVideoElement | null): void {
    this.video = el;
    if (!el) return;

    if (!this.boundElements.has(el)) {
      this.boundElements.add(el);
      el.addEventListener('loadedmetadata', () => this.onMeta());
      el.addEventListener('play', () => this.host?.onState(true, false));
      el.addEventListener('pause', () => this.host?.onState(false, false));
      el.addEventListener('playing', () => this.host?.onState(true, false));
      el.addEventListener('waiting', () => {
        if (!el.paused) this.host?.onState(true, true);
      });
      el.addEventListener('ended', () => this.host?.onEnded());
      el.addEventListener('error', () => {
        const code = el.error?.code;
        if (code && code !== 0) this.host?.onError('Playback error (unsupported codec or source)');
      });
      this.measureFps(el);
    }

    el.loop = this.repeat;
    el.playbackRate = this.speed;
    el.volume = this.muted ? 0 : this.volume;
    el.muted = this.muted;
    this.setEq(this.eq);
    this.setAspect(this.aspect);
    this.setRotation(this.rotation);
    this.setMirrored(this.mirrored);

    if (this.pending) {
      const { url, isHls, isDash } = this.pending;
      this.startPlayback(el, url, isHls, isDash);
    }
  }

  private measureFps(el: HTMLVideoElement): void {
    const anyEl = el as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    if (!anyEl.requestVideoFrameCallback) return;
    let count = 0;
    const t0 = performance.now();
    const tick = () => {
      count++;
      const dt = performance.now() - t0;
      if (dt >= 1000) {
        const f = Math.round((count * 1000) / dt);
        if (f > 0 && f <= 120) this.fps = f;
        return;
      }
      anyEl.requestVideoFrameCallback!(tick);
    };
    anyEl.requestVideoFrameCallback(tick);
  }

  private onMeta(): void {
    const v = this.video;
    if (!v) return;
    this.host?.onMediaInfo({
      path: this.currentTitle,
      title: this.currentTitle,
      container: extOf(this.currentTitle) || '—',
      duration: v.duration || 0,
      width: v.videoWidth,
      height: v.videoHeight,
      fps: this.fps,
      videoCodec: '—',
      audioCodec: '—',
      audioChannels: '—',
      bitrate: 0,
      subtitleCount: this.subCues.length,
      hdr: '',
    });
    this.reportTracks();
  }

  private reportTracks(): void {
    const v = this.video;
    if (!v) return;
    const withTracks = v as VideoWithTracks;
    const audio: EngineTrack[] = [];
    for (let i = 0; i < withTracks.audioTracks.length; i++) {
      const t = withTracks.audioTracks[i];
      audio.push({
        id: i,
        kind: 'audio',
        title: t.label || `Audio ${i + 1}`,
        lang: t.language || undefined,
        selected: t.enabled,
      });
    }
    const subs: EngineTrack[] = [];
    const textTracks = v.textTracks as unknown as TextTrackLike[] & { length: number };
    for (let i = 0; i < textTracks.length; i++) {
      const t = textTracks[i];
      subs.push({
        id: i,
        kind: 'sub',
        title: t.label || `Subtitle ${i + 1}`,
        lang: t.language || undefined,
        selected: t.mode === 'showing',
      });
    }
    if (this.subCues.length > 0) {
      subs.push({
        id: 9000,
        kind: 'sub',
        title: this.subLabel || 'External subtitle',
        external: true,
        selected: true,
      });
    }
    const videos: EngineTrack[] = v.videoWidth
      ? [{ id: 0, kind: 'video', title: `Video (${v.videoWidth}×${v.videoHeight})`, selected: true }]
      : [];
    this.host?.onTracks(
      { audio, subs, videos },
      audio.find((t) => t.selected)?.id ?? audio[0]?.id ?? null,
      subs.find((t) => t.selected)?.id ?? null,
    );
  }

  open(pathOrUrl: string, opts?: OpenOptions): void {
    this.cleanupSource();
    this.currentTitle = opts?.title ?? pathOrUrl;
    const ext = extOf(pathOrUrl);
    let url = pathOrUrl;
    if (opts?.file) {
      this.objectUrl = URL.createObjectURL(opts.file);
      url = this.objectUrl;
    } else if (!/^https?:\/\//i.test(pathOrUrl) && !pathOrUrl.startsWith('blob:')) {
      this.host?.onError('Browser mode: local files must be re-selected (drag the file onto the window)');
      return;
    }
    const isHls = ext === 'm3u8' || /\.m3u8(\?|$)/i.test(pathOrUrl);
    const isDash = ext === 'mpd' || /\.mpd(\?|$)/i.test(pathOrUrl);

    const v = this.video;
    if (!v) {
      this.pending = { url, isHls, isDash };
      return;
    }
    this.startPlayback(v, url, isHls, isDash);
  }

  private startPlayback(v: HTMLVideoElement, url: string, isHls: boolean, isDash: boolean): void {
    this.pending = null;
    v.playbackRate = this.speed;
    v.muted = this.muted;
    v.volume = this.muted ? 0 : this.volume;
    if (isHls) {
      void import('hls.js').then(({ default: HlsCtor }) => {
        if (!HlsCtor.isSupported()) {
          v.src = url;
          return;
        }
        const instance = new HlsCtor({ enableWorker: true, lowLatencyMode: true });
        this.hls = instance as unknown as HlsLike;
        instance.loadSource(url);
        instance.attachMedia(v);
        (instance.on as unknown as HlsLike['on'])('hlsError', (_e, data: { fatal?: boolean }) => {
          if (data?.fatal) this.host?.onError('HLS stream error');
        });
      });
    } else if (isDash) {
      void import('dashjs')
        .then((mod) => {
          const dashjs = mod.default ?? mod;
          const player = dashjs.MediaPlayer().create();
          this.dash = player as unknown as DashLike;
          player.initialize(v, url, true);
        })
        .catch(() => {
          v.src = url;
        });
    } else {
      v.src = url;
    }
    v.play().catch(() => undefined);
    this.startLoop();
  }

  close(): void {
    this.cleanupSource();
    this.subCues = [];
    this.host?.onSubtitleCues(null);
    this.host?.onTracks({ audio: [], subs: [], videos: [] }, null, null);
    this.host?.onChapters([]);
    this.host?.onMediaInfo(null);
    this.host?.onTime(0, 0, 0);
    this.host?.onState(false, false);
  }

  private cleanupSource(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.pending = null;
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.dash) {
      try {
        this.dash.reset();
      } catch {
        /* noop */
      }
      this.dash = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    if (this.video) {
      this.video.removeAttribute('src');
      this.video.load();
    }
  }

  private startLoop(): void {
    cancelAnimationFrame(this.raf);
    const tick = () => {
      const v = this.video;
      if (!v) return;
      const t = v.currentTime;
      const d = v.duration || 0;
      let bufferedEnd = 0;
      const buf = v.buffered;
      for (let i = 0; i < buf.length; i++) bufferedEnd = Math.max(bufferedEnd, buf.end(i));
      this.host?.onTime(t, d, Math.max(bufferedEnd, t));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private ensureAudioGraph(): void {
    if (!this.video || this.audioCtx) return;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.audioCtx = new AC();
      this.gainNode = this.audioCtx.createGain();
      this.panner = this.audioCtx.createStereoPanner();
      const src = this.audioCtx.createMediaElementSource(this.video);
      src.connect(this.gainNode);
      this.gainNode.connect(this.panner);
      this.panner.connect(this.audioCtx.destination);
      this.gainNode.gain.value = this.muted ? 0 : this.volume;
    } catch {
      this.audioCtx = null;
    }
  }

  play(): void {
    this.ensureAudioGraph();
    this.audioCtx?.resume().catch(() => undefined);
    this.video?.play().catch(() => undefined);
  }

  pause(): void {
    this.video?.pause();
  }

  togglePlay(): void {
    const v = this.video;
    if (!v) return;
    if (v.paused) this.play();
    else this.pause();
  }

  stop(): void {
    this.video?.pause();
    if (this.video) this.video.currentTime = 0;
  }

  seekBy(delta: number): void {
    const v = this.video;
    if (!v || !isFinite(v.duration)) return;
    v.currentTime = clamp(v.currentTime + delta, 0, v.duration);
  }

  seekTo(t: number): void {
    const v = this.video;
    if (!v) return;
    v.currentTime = clamp(t, 0, v.duration || t);
  }

  frameStep(dir: 1 | -1): void {
    const v = this.video;
    if (!v) return;
    if (!v.paused) v.pause();
    const step = 1 / this.fps;
    v.currentTime = clamp(v.currentTime + dir * step, 0, v.duration || Infinity);
  }

  setSpeed(v: number): void {
    this.speed = clamp(v, 0.1, 8);
    if (this.video) this.video.playbackRate = this.speed;
  }

  setVolume(v: number): void {
    this.volume = clamp(v, 0, 1);
    if (this.gainNode) this.gainNode.gain.value = this.muted ? 0 : this.volume;
    if (this.video) this.video.volume = this.muted ? 0 : this.volume;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.gainNode) this.gainNode.gain.value = m ? 0 : this.volume;
    if (this.video) this.video.volume = m ? 0 : this.volume;
  }

  setBalance(v: number): void {
    this.ensureAudioGraph();
    if (this.panner) this.panner.pan.value = clamp(v, -1, 1);
  }

  // Browsers give no control over audio offset; a WebAudio DelayNode could,
  // but there is no gain from wiring one up for the web build.
  setAudioDelay(_ms: number): void {}

  setSubDelay(_ms: number): void {
    this.host?.onSubtitleCues(this.subCues.length ? this.subCues : null);
  }

  setEq(eq: EqState): void {
    this.eq = { ...this.eq, ...eq };
    if (!this.video) return;
    const b = 1 + this.eq.brightness / 100 + this.eq.gamma / 200;
    const c = 1 + this.eq.contrast / 100;
    const s = 1 + this.eq.saturation / 100;
    let filter = `brightness(${b.toFixed(3)}) contrast(${c.toFixed(3)}) saturate(${s.toFixed(3)})`;
    if (this.eq.hue !== 0) filter += ` hue-rotate(${(this.eq.hue * 1.8).toFixed(1)}deg)`;
    if (this.eq.sharpness > 0) filter += ' url(#ankylo-sharpness)';
    this.video.style.filter = filter;
    window.__ankyloSetSharpness?.(this.eq.sharpness);
  }

  setAspect(mode: AspectMode): void {
    this.aspect = mode;
    if (!this.video) return;
    if (mode === 'fit') {
      this.video.style.aspectRatio = '';
      this.video.style.objectFit = 'fill';
    } else if (mode === 'fill') {
      this.video.style.aspectRatio = '';
      this.video.style.objectFit = 'cover';
    } else if (mode === 'auto') {
      this.video.style.aspectRatio = '';
      this.video.style.objectFit = 'contain';
    } else {
      this.video.style.aspectRatio = mode.replace(':', ' / ');
      this.video.style.objectFit = 'contain';
    }
  }

  setZoom(scale: number): void {
    this.zoomScale = scale;
    this.applyTransform();
  }

  setPan(x: number, y: number): void {
    this.panX = x;
    this.panY = y;
    this.applyTransform();
  }

  resetZoom(): void {
    this.zoomScale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
  }

  setRotation(deg: number): void {
    this.rotation = deg;
    this.applyTransform();
  }

  setMirrored(b: boolean): void {
    this.mirrored = b;
    this.applyTransform();
  }

  private applyTransform(): void {
    if (!this.video) return;
    const parts: string[] = [];
    if (this.rotation !== 0) parts.push(`rotate(${this.rotation}deg)`);
    if (this.mirrored) parts.push('scaleX(-1)');
    if (this.zoomScale !== 1.0) parts.push(`scale(${this.zoomScale})`);
    if (this.panX !== 0 || this.panY !== 0) parts.push(`translate(${this.panX * 100}%, ${this.panY * 100}%)`);
    this.video.style.transform = parts.join(' ');
  }

  setDeinterlace(b: boolean): void {
    if (b) this.host?.onError('Deinterlacing is only available with the libmpv engine');
  }

  setHwdec(_mode: string): void {
    /* browser decodes natively */
  }

  setToneMap(_mode: string): void {
    /* browser handles HDR natively */
  }

  cycleTrack(kind: 'audio' | 'sub'): void {
    const v = this.video;
    if (!v) return;
    if (kind === 'audio') {
      const list = (v as VideoWithTracks).audioTracks;
      if (list.length === 0) return;
      let idx = -1;
      for (let i = 0; i < list.length; i++) if (list[i].enabled) idx = i;
      const next = (idx + 1) % list.length;
      for (let i = 0; i < list.length; i++) list[i].enabled = i === next;
    } else {
      const list = v.textTracks;
      const showing: number[] = [];
      for (let i = 0; i < list.length; i++) if (list[i].mode === 'showing') showing.push(i);
      if (list.length === 0) return;
      // Cycle showing -> next -> ... -> last -> off. `-1` means no track shows.
      let next: number;
      if (showing.length === 0) {
        next = 0;
      } else if (showing[0] === list.length - 1) {
        next = -1;
      } else {
        next = showing[0] + 1;
      }
      for (let i = 0; i < list.length; i++) {
        list[i].mode = i === next ? 'showing' : 'disabled';
      }
    }
    this.reportTracks();
  }

  setTrack(kind: 'audio' | 'sub', id: number): void {
    const v = this.video;
    if (!v) return;
    if (kind === 'audio') {
      const list = (v as VideoWithTracks).audioTracks;
      for (let i = 0; i < list.length; i++) list[i].enabled = i === id;
    } else if (id === 9000) {
      for (let i = 0; i < v.textTracks.length; i++) v.textTracks[i].mode = 'disabled';
    } else {
      for (let i = 0; i < v.textTracks.length; i++) {
        v.textTracks[i].mode = i === id ? 'showing' : 'disabled';
      }
    }
    this.reportTracks();
  }

  addExternalSub(_path: string): void {
    this.host?.onError('Use "Load subtitle" from the Subtitle menu in browser mode');
  }

  loadSubText(text: string, name: string): void {
    this.subCues = parseCues(text);
    this.subLabel = name;
this.host?.onSubtitleCues(this.subCues);
    this.reportTracks();
  }

  screenshot(): void {
    const v = this.video;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    const base = this.currentTitle.replace(/[^\w\- ]/g, '').slice(-60) || 'ankylo';
    a.download = `${base}-${Math.floor(v.currentTime)}.png`;
    a.click();
  }

  enterPip(): void {
    const v = this.video as HTMLVideoElement & { requestPictureInPicture?: () => Promise<void> };
    v?.requestPictureInPicture?.().catch(() => undefined);
  }

  exitPip(): void {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => undefined);
    }
  }

  setRepeat(repeat: boolean): void {
    this.repeat = repeat;
    if (this.video) {
      this.video.loop = repeat;
    }
  }
}
