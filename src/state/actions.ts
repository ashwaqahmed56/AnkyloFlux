import { usePlayerStore } from './playerStore';
import { useSettingsStore, DEFAULT_SHORTCUTS } from './settingsStore';
import { usePlaylistStore } from './playlistStore';

export interface ActionDef {
  id: string;
  title: string;
  category: string;
  icon: string;
  keys: string[];
  run: () => void;
}

export function getActions(): ActionDef[] {
  const s = () => usePlayerStore.getState();
  const list: ActionDef[] = [
    { id: 'play', title: 'Play / Pause', category: 'Playback', icon: 'play', keys: [], run: () => s().togglePlay() },
    { id: 'stop', title: 'Stop', category: 'Playback', icon: 'stop', keys: [], run: () => s().stop() },
    { id: 'seekBack10', title: 'Seek back 10s', category: 'Playback', icon: 'back10', keys: [], run: () => s().seekBy(-10) },
    { id: 'seekFwd10', title: 'Seek forward 10s', category: 'Playback', icon: 'forward10', keys: [], run: () => s().seekBy(10) },
    { id: 'seekBack60', title: 'Seek back 60s', category: 'Playback', icon: 'back10', keys: [], run: () => s().seekBy(-60) },
    { id: 'seekFwd60', title: 'Seek forward 60s', category: 'Playback', icon: 'forward10', keys: [], run: () => s().seekBy(60) },
    { id: 'frameStepBack', title: 'Previous frame', category: 'Playback', icon: 'prev', keys: [], run: () => s().frameStep(-1) },
    { id: 'frameStepFwd', title: 'Next frame', category: 'Playback', icon: 'next', keys: [], run: () => s().frameStep(1) },
    { id: 'speedUp', title: 'Speed up', category: 'Playback', icon: 'speed', keys: [], run: () => s().cycleSpeed(1) },
    { id: 'speedDown', title: 'Speed down', category: 'Playback', icon: 'speed', keys: [], run: () => s().cycleSpeed(-1) },
    { id: 'speedReset', title: 'Reset speed', category: 'Playback', icon: 'speed', keys: [], run: () => s().setSpeed(1) },
    { id: 'volumeUp', title: 'Volume up', category: 'Audio', icon: 'volumeHigh', keys: [], run: () => s().setVolume(s().volume * 100 + 5) },
    { id: 'volumeDown', title: 'Volume down', category: 'Audio', icon: 'volumeLow', keys: [], run: () => s().setVolume(s().volume * 100 - 5) },
    { id: 'mute', title: 'Toggle mute', category: 'Audio', icon: 'volumeMute', keys: [], run: () => s().toggleMute() },
    { id: 'audioCycle', title: 'Next audio track', category: 'Audio', icon: 'audioTrack', keys: [], run: () => s().cycleTrack('audio') },
    { id: 'audioDelayPlus', title: 'Audio delay +50ms', category: 'Audio', icon: 'clock', keys: [], run: () => s().stepAudioDelay(1) },
    { id: 'audioDelayMinus', title: 'Audio delay -50ms', category: 'Audio', icon: 'clock', keys: [], run: () => s().stepAudioDelay(-1) },
    { id: 'subCycle', title: 'Next subtitle track', category: 'Subtitles', icon: 'subtitle', keys: [], run: () => s().cycleTrack('sub') },
    { id: 'subDelayPlus', title: 'Subtitle delay +50ms', category: 'Subtitles', icon: 'subtitle', keys: [], run: () => s().stepSubDelay(1) },
    { id: 'subDelayMinus', title: 'Subtitle delay -50ms', category: 'Subtitles', icon: 'subtitle', keys: [], run: () => s().stepSubDelay(-1) },
    { id: 'fullscreen', title: 'Toggle fullscreen', category: 'View', icon: 'fullscreen', keys: [], run: () => s().toggleFullscreen() },
    { id: 'pip', title: 'Picture-in-Picture', category: 'View', icon: 'pip', keys: [], run: () => s().togglePip() },
    { id: 'mini', title: 'Mini player', category: 'View', icon: 'mini', keys: [], run: () => s().toggleMini() },
    { id: 'screenshot', title: 'Save snapshot', category: 'View', icon: 'screenshot', keys: [], run: () => s().screenshot() },
    { id: 'download', title: 'Download this stream', category: 'File', icon: 'download', keys: [], run: () => s().startDownload() },
    { id: 'aspectCycle', title: 'Cycle aspect ratio', category: 'Video', icon: 'aspect', keys: [], run: () => s().cycleAspect() },
    { id: 'zoomIn', title: 'Zoom in', category: 'Video', icon: 'search', keys: [], run: () => s().adjustZoom(0.1) },
    { id: 'zoomOut', title: 'Zoom out', category: 'Video', icon: 'search', keys: [], run: () => s().adjustZoom(-0.1) },
    { id: 'zoomReset', title: 'Reset zoom (100%)', category: 'Video', icon: 'search', keys: [], run: () => s().resetZoom() },
    { id: 'rotate90', title: 'Rotate 90°', category: 'Video', icon: 'rotate', keys: [], run: () => s().rotateBy(90) },
    { id: 'mirror', title: 'Toggle mirror', category: 'Video', icon: 'mirror', keys: [], run: () => s().toggleMirror() },
    { id: 'deinterlace', title: 'Toggle deinterlace', category: 'Video', icon: 'deinterlace', keys: [], run: () => s().toggleDeinterlace() },
    { id: 'loop', title: 'Repeat video', category: 'Playback', icon: 'loop', keys: [], run: () => s().toggleRepeat() },
    { id: 'playlist', title: 'Toggle playlist', category: 'Panels', icon: 'playlist', keys: [], run: () => s().setPlaylistOpen(!s().playlistOpen) },
    { id: 'info', title: 'Media info', category: 'Panels', icon: 'info', keys: [], run: () => s().setInfoOpen(!s().infoOpen) },
    { id: 'adjustments', title: 'Adjustments panel', category: 'Panels', icon: 'adjust', keys: [], run: () => s().setAdjustmentsOpen(!s().adjustmentsOpen) },
    { id: 'palette', title: 'Command palette', category: 'General', icon: 'search', keys: [], run: () => s().setPaletteOpen(true) },
    { id: 'settings', title: 'Settings', category: 'General', icon: 'gear', keys: [], run: () => s().setSettingsOpen(true) },
    { id: 'about', title: 'About Ankylo', category: 'General', icon: 'brand', keys: [], run: () => s().setAboutOpen(true) },
    { id: 'next', title: 'Next in playlist', category: 'Playlist', icon: 'next', keys: [], run: () => {
      const item = usePlaylistStore.getState().next();
      if (item) s().openPath(item.path, { title: item.title });
    } },
    { id: 'prev', title: 'Previous in playlist', category: 'Playlist', icon: 'prev', keys: [], run: () => {
      const item = usePlaylistStore.getState().prev();
      if (item) s().openPath(item.path, { title: item.title });
    } },
    { id: 'closeMedia', title: 'Close media', category: 'General', icon: 'close', keys: [], run: () => s().closeMedia() },
  ];
  const shortcuts = useSettingsStore.getState().shortcuts;
  return list.map((a) => ({ ...a, keys: shortcuts[a.id] ?? DEFAULT_SHORTCUTS[a.id] ?? [] }));
}

export function keyEventToString(e: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Super');
  let key = e.key;
  if (key === ' ') key = 'Space';
  else if (key.startsWith('Arrow')) key = key.slice(5);
  else if (key.length === 1) key = key.toUpperCase();
  parts.push(key);
  return parts.join('+');
}
