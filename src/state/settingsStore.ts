import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';
export type AccentName = 'amber' | 'teal' | 'gray' | 'rose';

export interface SubtitleStyle {
  size: number;
  color: string;
  position: number;
  outline: boolean;
}

interface SettingsState {
  theme: ThemeMode;
  accent: AccentName;
  hwdec: string;
  tonemap: string;
  subs: SubtitleStyle;
  shortcuts: Record<string, string[]>;
  defaultSpeed: number;
  volume: number;
  clickToPlayPause: boolean;
  doubleTapSeek: boolean;
  doubleTapSeekSeconds: number;
  setTheme: (t: ThemeMode) => void;
  setAccent: (a: AccentName) => void;
  setHwdec: (m: string) => void;
  setToneMap: (m: string) => void;
  setSubs: (s: Partial<SubtitleStyle>) => void;
  setShortcut: (action: string, keys: string[]) => void;
  resetShortcuts: () => void;
  setDefaultSpeed: (v: number) => void;
  setVolume: (v: number) => void;
  setClickToPlayPause: (b: boolean) => void;
  setDoubleTapSeek: (b: boolean) => void;
  setDoubleTapSeekSeconds: (s: number) => void;
}

export const DEFAULT_SHORTCUTS: Record<string, string[]> = {
  play: ['Space'],
  stop: ['S'],
  seekBack10: ['Left'],
  seekFwd10: ['Right'],
  seekBack60: ['Shift+Left'],
  seekFwd60: ['Shift+Right'],
  frameStepBack: [','],
  frameStepFwd: ['.'],
  speedUp: ['Ctrl+Up'],
  speedDown: ['Ctrl+Down'],
  speedReset: ['Ctrl+Backspace'],
  volumeUp: ['Up'],
  volumeDown: ['Down'],
  mute: ['M'],
  fullscreen: ['F'],
  pip: ['Ctrl+P'],
  mini: ['Ctrl+Shift+M'],
  screenshot: ['Ctrl+S'],
  download: ['Ctrl+Shift+S'],
  playlist: ['L'],
  info: ['I'],
  adjustments: ['Ctrl+E'],
  palette: ['Ctrl+K'],
  settings: ['Ctrl+,'],
  audioCycle: ['A'],
  audioDelayPlus: ['Ctrl+Shift+Left'],
  audioDelayMinus: ['Ctrl+Shift+Right'],
  subCycle: ['J'],
  subDelayPlus: ['Ctrl+J'],
  subDelayMinus: ['Ctrl+Shift+J'],
  aspectCycle: ['T'],
  zoomIn: ['Ctrl+='],
  zoomOut: ['Ctrl+-'],
  zoomReset: ['Ctrl+0'],
  loop: ['R'],
  deinterlace: ['D'],
  mirror: ['Ctrl+R'],
  rotate90: ['Ctrl+Shift+R'],
  next: ['N'],
  prev: ['P'],
  closeMedia: ['Escape'],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accent: 'amber',
      hwdec: 'auto',
      tonemap: 'auto',
      subs: { size: 46, color: '#ffffff', position: 14, outline: true },
      shortcuts: { ...DEFAULT_SHORTCUTS },
      defaultSpeed: 1,
      volume: 80,
      clickToPlayPause: true,
      doubleTapSeek: true,
      doubleTapSeekSeconds: 10,
      setTheme: (t) => set({ theme: t }),
      setAccent: (a) => set({ accent: a }),
      setHwdec: (m) => set({ hwdec: m }),
      setToneMap: (m) => set({ tonemap: m }),
      setSubs: (s) => set((st) => ({ subs: { ...st.subs, ...s } })),
      setShortcut: (action, keys) =>
        set((st) => ({ shortcuts: { ...st.shortcuts, [action]: keys } })),
      resetShortcuts: () => set({ shortcuts: { ...DEFAULT_SHORTCUTS } }),
      setDefaultSpeed: (v) => set({ defaultSpeed: v }),
      setVolume: (v) => set({ volume: v }),
      setClickToPlayPause: (b) => set({ clickToPlayPause: b }),
      setDoubleTapSeek: (b) => set({ doubleTapSeek: b }),
      setDoubleTapSeekSeconds: (s) => set({ doubleTapSeekSeconds: s }),
    }),
    { name: 'ankylo-settings' },
  ),
);
