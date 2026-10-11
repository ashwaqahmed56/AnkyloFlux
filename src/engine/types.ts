export interface EngineTrack {
  id: number;
  kind: 'audio' | 'video' | 'sub';
  title: string;
  lang?: string;
  codec?: string;
  external?: boolean;
  selected?: boolean;
}

export interface Chapter {
  title: string;
  time: number;
}

export interface MediaInfo {
  path: string;
  title: string;
  container: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  audioChannels: string;
  bitrate: number;
  subtitleCount: number;
  hdr: string;
}

export interface EqState {
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  hue: number;
  sharpness: number;
}

export const DEFAULT_EQ: EqState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  gamma: 0,
  hue: 0,
  sharpness: 0,
};

export type AspectMode = 'auto' | '16:9' | '4:3' | '2.35:1' | '1:1' | 'fit' | 'fill';

export interface EngineHost {
  onTime(time: number, duration: number, bufferedEnd: number): void;
  onState(playing: boolean, buffering: boolean): void;
  onEnded(): void;
  onTracks(
    tracks: { audio: EngineTrack[]; subs: EngineTrack[]; videos: EngineTrack[] },
    audioId: number | null,
    subId: number | null,
  ): void;
  onChapters(chapters: Chapter[]): void;
  onMediaInfo(info: MediaInfo | null): void;
  onSubtitleCues(cues: SubtitleCue[] | null): void;
  onError(message: string): void;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface OpenOptions {
  file?: File;
  title?: string;
}

export interface PlayerEngine {
  readonly kind: 'mpv' | 'browser';
  bind(host: EngineHost): void | Promise<void>;
  attach(el: HTMLVideoElement | null): void;
  open(pathOrUrl: string, opts?: OpenOptions): void;
  close(): void;
  play(): void;
  pause(): void;
  togglePlay(): void;
  stop(): void;
  seekBy(delta: number): void;
  seekTo(t: number): void;
  frameStep(dir: 1 | -1): void;
  setSpeed(v: number): void;
  setVolume(v: number): void;
  setMuted(m: boolean): void;
  setBalance(v: number): void;
  setAudioDelay(ms: number): void;
  setSubDelay(ms: number): void;
  setEq(eq: EqState): void;
  setAspect(mode: AspectMode): void;
  setZoom(scale: number): void;
  setPan(x: number, y: number): void;
  resetZoom(): void;
  setRotation(deg: number): void;
  setMirrored(b: boolean): void;
  setDeinterlace(b: boolean): void;
  setHwdec(mode: string): void;
  setToneMap(mode: string): void;
  cycleTrack(kind: 'audio' | 'sub'): void;
  setTrack(kind: 'audio' | 'sub', id: number): void;
  addExternalSub(path: string): void;
  loadSubText(text: string, name: string): void;
  screenshot(): void;
  enterPip(): void;
  exitPip(): void;
  setRepeat(repeat: boolean): void;
}
