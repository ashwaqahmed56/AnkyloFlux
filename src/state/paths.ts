import { usePlayerStore } from './playerStore';
import { usePlaylistStore } from './playlistStore';

export function openPaths(paths: string[]): void {
  const media = paths.filter((p) => isMedia(p));
  const subs = paths.filter((p) => isSub(p));
  const player = usePlayerStore.getState();
  if (media.length > 0) {
    player.openPath(media[0]);
    if (media.length > 1) usePlaylistStore.getState().addMany(media.slice(1));
  }
  if (subs.length > 0) player.addExternalSub(subs[0]);
}

const MEDIA_EXT = new Set([
  'mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'ts', 'm2ts', 'mts', 'm4ts', 'mpg', 'mpeg', 'm2v',
  'vob', 'evo', 'wmv', 'asf', 'rm', 'rmvb', '3gp', '3g2', 'ogv', 'ogg', 'divx', 'xvid', 'f4v',
  'mxf', 'm4a', 'mp3', 'flac', 'wav', 'aac', 'opus', 'wma', 'ape', 'wv', 'alac',
]);

const SUB_EXT = new Set(['srt', 'ass', 'ssa', 'vtt', 'sub', 'idx', 'sup']);

function ext(path: string): string {
  const name = path.split(/[\\/]/).pop() ?? path;
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function isMedia(path: string): boolean {
  const e = ext(path);
  return MEDIA_EXT.has(e) || e === 'm3u8' || e === 'mpd' || e === 'm3u';
}

function isSub(path: string): boolean {
  return SUB_EXT.has(ext(path));
}