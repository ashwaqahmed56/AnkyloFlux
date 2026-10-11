import { extOf } from './format';

export const VIDEO_EXTS = new Set([
  'mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'ts', 'm2ts', 'mts', 'm4ts',
  'mpg', 'mpeg', 'm2v', 'vob', 'evo', 'wmv', 'asf', 'rm', 'rmvb', '3gp',
  '3g2', 'ogv', 'ogg', 'divx', 'xvid', 'f4v', 'mxf', 'iso',
]);

export const AUDIO_EXTS = new Set([
  'mp3', 'aac', 'flac', 'opus', 'ogg', 'oga', 'wav', 'wma', 'm4a', 'alac',
  'ape', 'wv', 'wavpack', 'ac3', 'dts', 'eac3', 'thd', 'mpc', 'aiff', 'mid',
]);

export const SUB_EXTS = new Set(['srt', 'ass', 'ssa', 'vtt', 'sub', 'idx', 'sup']);

export const STREAM_EXTS = new Set(['m3u8', 'mpd', 'm3u', 'ism', 'isml']);

export function isVideoFile(path: string): boolean {
  const ext = extOf(path);
  return VIDEO_EXTS.has(ext) || STREAM_EXTS.has(ext);
}

export function isAudioFile(path: string): boolean {
  return AUDIO_EXTS.has(extOf(path));
}

export function isMediaFile(path: string): boolean {
  return isVideoFile(path) || isAudioFile(path);
}

export function isSubtitleFile(path: string): boolean {
  return SUB_EXTS.has(extOf(path));
}

export const BROWSER_DECODABLE = new Set([
  'mp4', 'm4v', 'webm', 'ogv', 'ogg', 'mov', 'mp3', 'm4a', 'aac', 'wav', 'flac', 'opus',
]);

export function browserCanPlay(path: string): boolean {
  return BROWSER_DECODABLE.has(extOf(path));
}
