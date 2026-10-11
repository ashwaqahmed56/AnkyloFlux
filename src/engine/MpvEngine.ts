import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  AspectMode,
  Chapter,
  EngineHost,
  EngineTrack,
  EqState,
  MediaInfo,
  OpenOptions,
  PlayerEngine,
} from './types';
import { clamp } from '../utils/format';

interface MpvEventPayload {
  type: string;
  playing?: boolean;
  buffering?: boolean;
  time?: number;
  duration?: number;
  buffered?: number;
  tracks?: { audio: EngineTrack[]; subs: EngineTrack[]; videos: EngineTrack[] };
  audioId?: number | null;
  subId?: number | null;
  chapters?: Chapter[];
  info?: MediaInfo | null;
  message?: string;
  level?: string;
  path?: string;
}

export class MpvEngine implements PlayerEngine {
  readonly kind = 'mpv' as const;

  private host: EngineHost | null = null;
  private bound = false;
  private lastPlaying = false;
  private lastBuffering = false;
  private lastLog = '';

  async bind(host: EngineHost): Promise<void> {
    this.host = host;
    if (this.bound) return;
    this.bound = true;
    // The engine is a singleton for the lifetime of the window, so the
    // listener is intentionally never torn down.
    await listen<MpvEventPayload>('mpv-event', (e) => {
      this.handleEvent(e.payload);
    });
  }

  private handleEvent(p: MpvEventPayload): void {
    switch (p.type) {
      case 'state': {
        if (typeof p.playing === 'boolean') this.lastPlaying = p.playing;
        if (typeof p.buffering === 'boolean') this.lastBuffering = p.buffering;
        if (typeof p.playing === 'boolean' || typeof p.buffering === 'boolean') {
          this.host?.onState(this.lastPlaying, this.lastBuffering);
        }
        break;
      }
      case 'log': {
        const text = String(p.message ?? '').trim();
        if (!text || text === this.lastLog) break;
        this.lastLog = text;
        const level = String(p.level ?? '').toLowerCase();
        if (level === 'error' || level === 'fatal') {
          this.host?.onError(text);
        } else {
          console.warn(`[mpv ${level || 'warn'}]`, text);
        }
        break;
      }
      case 'time':
        this.host?.onTime(p.time ?? 0, p.duration ?? 0, p.buffered ?? 0);
        break;
      case 'ended':
        this.host?.onEnded();
        break;
      case 'tracks':
        this.host?.onTracks(
          p.tracks ?? { audio: [], subs: [], videos: [] },
          p.audioId ?? null,
          p.subId ?? null,
        );
        break;
      case 'chapters':
        this.host?.onChapters(p.chapters ?? []);
        break;
      case 'info':
        this.host?.onMediaInfo(p.info ?? null);
        break;
      case 'screenshot':
        this.host?.onError(`Saved: ${p.path ?? ''}`);
        break;
      case 'error':
        this.host?.onError(p.message ?? 'Playback error');
        break;
    }
  }

  // mpv renders into its own native child window, not a <video> element, so
  // there is nothing to attach. The UI calls this for both engines; the player
  // surface renders a placeholder div on desktop.
  attach(_el: HTMLVideoElement | null): void { }

  open(pathOrUrl: string, _opts?: OpenOptions): void {
    invoke('mpv_open', { path: pathOrUrl }).catch((e) => {
      void invoke('diag', { msg: `mpv_open rejected: ${e}` }).catch(() => undefined);
      this.host?.onError(String(e));
    });
  }

  openStream(video: string, audio?: string): void {
    invoke('mpv_open_stream', { video, audio: audio ?? null }).catch((e) =>
      this.host?.onError(String(e)),
    );
  }

  close(): void {
    invoke('mpv_close').catch(() => undefined);
    this.host?.onTime(0, 0, 0);
    this.host?.onState(false, false);
  }

  play(): void {
    invoke('mpv_play').catch(() => undefined);
  }

  pause(): void {
    invoke('mpv_pause').catch(() => undefined);
  }

  togglePlay(): void {
    invoke('mpv_toggle').catch(() => undefined);
  }

  stop(): void {
    invoke('mpv_stop').catch(() => undefined);
  }

  seekBy(delta: number): void {
    invoke('mpv_seek', { delta }).catch(() => undefined);
  }

  seekTo(t: number): void {
    invoke('mpv_seek_to', { t }).catch(() => undefined);
  }

  frameStep(dir: 1 | -1): void {
    invoke('mpv_frame_step', { dir }).catch(() => undefined);
  }

  setSpeed(v: number): void {
    invoke('mpv_set_speed', { v: clamp(v, 0.1, 8) }).catch(() => undefined);
  }

  /** `v` is a 0..1 gain; the Rust side converts it to mpv's percentage. */
  setVolume(v: number): void {
    invoke('mpv_set_volume', { v: clamp(v, 0, 1) }).catch(() => undefined);
  }

  setMuted(m: boolean): void {
    invoke('mpv_set_muted', { m }).catch(() => undefined);
  }

  setBalance(v: number): void {
    invoke('mpv_set_balance', { v: clamp(v, -1, 1) }).catch(() => undefined);
  }

  setAudioDelay(ms: number): void {
    invoke('mpv_set_audio_delay', { ms }).catch(() => undefined);
  }

  setSubDelay(ms: number): void {
    invoke('mpv_set_sub_delay', { ms }).catch(() => undefined);
  }

  setEq(eq: EqState): void {
    invoke('mpv_set_eq', { eq }).catch(() => undefined);
  }

  setAspect(mode: AspectMode): void {
    void invoke('diag', { msg: `ui: setAspect mode=${mode}` }).catch(() => undefined);
    invoke('mpv_set_aspect', { mode }).catch((e) => {
      void invoke('diag', { msg: `mpv_set_aspect rejected: ${e}` }).catch(() => undefined);
    });
  }

  setZoom(scale: number): void {
    const zoom = Math.log2(Math.max(0.1, scale));
    invoke('mpv_set_zoom', { zoom }).catch(() => undefined);
  }

  setPan(x: number, y: number): void {
    invoke('mpv_set_pan', { x, y }).catch(() => undefined);
  }

  resetZoom(): void {
    invoke('mpv_reset_zoom').catch(() => undefined);
  }

  setRotation(deg: number): void {
    invoke('mpv_set_rotation', { deg }).catch(() => undefined);
  }

  setMirrored(b: boolean): void {
    invoke('mpv_set_mirrored', { b }).catch(() => undefined);
  }

  setDeinterlace(b: boolean): void {
    invoke('mpv_set_deinterlace', { b }).catch(() => undefined);
  }

  setHwdec(mode: string): void {
    invoke('mpv_set_hwdec', { mode }).catch(() => undefined);
  }

  setToneMap(mode: string): void {
    invoke('mpv_set_tonemap', { mode }).catch(() => undefined);
  }

  cycleTrack(kind: 'audio' | 'sub'): void {
    invoke('mpv_cycle_track', { kind }).catch(() => undefined);
  }

  setTrack(kind: 'audio' | 'sub', id: number): void {
    invoke('mpv_set_track', { kind, id }).catch(() => undefined);
  }

  addExternalSub(path: string): void {
    invoke('mpv_add_sub', { path }).catch(() => undefined);
  }

  loadSubText(text: string, name: string): void {
    invoke('mpv_load_sub_text', { text, name }).catch(() => undefined);
  }

  screenshot(): void {
    invoke('mpv_screenshot').catch(() => undefined);
  }

  enterPip(): void {
    invoke('mpv_enter_pip').catch(() => undefined);
  }

  exitPip(): void {
    invoke('mpv_exit_pip').catch(() => undefined);
  }

  setRepeat(repeat: boolean): void {
    invoke('mpv_set_repeat', { repeat }).catch(() => undefined);
  }

  syncVideoRect(x: number, y: number, w: number, h: number): void {
    invoke('mpv_video_rect', { x, y, w, h }).catch((e) =>
      // Surface this instead of dropping it: a rejected rect means the native
      // surface silently stays wherever it was, which looks like "no video".
      void invoke('diag', { msg: `mpv_video_rect rejected (${x},${y},${w},${h}): ${e}` }).catch(
        () => undefined,
      ),
    );
  }

  hideVideoRect(): void {
    invoke('mpv_video_hide').catch(() => undefined);
  }
}
