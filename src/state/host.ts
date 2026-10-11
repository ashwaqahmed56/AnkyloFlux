import { engine } from '../engine';
import { isDesktop } from '../engine';
import type { EngineHost } from '../engine/types';
import { usePlayerStore } from './playerStore';
import { usePlaylistStore } from './playlistStore';
import { useToastStore } from './toastStore';

export function createHost(): EngineHost {
  return {
    onTime(time, duration, bufferedEnd) {
      usePlayerStore.setState({ time, duration, bufferedEnd });
    },
    onState(playing, buffering) {
      usePlayerStore.setState({ playing, buffering });
    },
    onEnded() {
      const s = usePlayerStore.getState();
      if (s.repeat) {
        engine.seekTo(0);
        engine.play();
        return;
      }
      const next = usePlaylistStore.getState().next();
      if (next) {
        s.openPath(next.path, { title: next.title });
      } else {
        usePlayerStore.setState({ playing: false });
      }
    },
    onTracks(tracks, audioId, subId) {
      usePlayerStore.setState({ tracks, audioId, subId });
    },
    onChapters(chapters) {
      usePlayerStore.setState({ chapters });
    },
    onMediaInfo(info) {
      usePlayerStore.setState({ mediaInfo: info });
    },
    onSubtitleCues(cues) {
      usePlayerStore.setState({ subCues: cues });
    },
    onError(message) {
      useToastStore.getState().push(message, 'close');
    },
  };
}

let bound = false;

export async function bindEngine(): Promise<void> {
  if (bound) return;
  bound = true;
  void Promise.resolve(engine.bind(createHost())).catch(() => undefined);

  if (isDesktop) {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      await listen<{
        kind: string;
        name: string;
        received: number;
        total: number;
        percent: number;
        speed_bps: number;
        done: boolean;
        error: string | null;
        path: string | null;
      }>('download-progress', (e) => {
        const p = e.payload;
        usePlayerStore.getState().onDownloadProgress({
          name: p.name,
          received: p.received,
          total: p.total,
          percent: p.percent,
          speedBps: p.speed_bps,
          error: p.error ?? undefined,
          path: p.path ?? undefined,
          done: p.done,
        });
      });
    } catch {
      /* desktop only */
    }
  }
}
