import { engine, isDesktop } from '../engine';
import { usePlayerStore } from './playerStore';
import { usePlaylistStore } from './playlistStore';
import { useToastStore } from './toastStore';
import { cacheFile, getCachedFile, isCacheable } from './blobStore';
import { pickFilesAsync, pickFolderAsync, pickSubsAsync } from './picker';
import { openPaths } from './paths';
import { browserCanPlay, isMediaFile, isSubtitleFile } from '../utils/media';
import { extOf, fileNameOf } from '../utils/format';

export async function openFileObjects(files: File[]): Promise<void> {
  let media = files.filter((f) => isMediaFile(f.name));
  const subs = files.filter((f) => isSubtitleFile(f.name));

  if (media.length === 0 && files.length > 0) {
    const byType = files.filter((f) => /^video\/|^audio\//.test(f.type));
    if (byType.length > 0) media = byType;
  }

  if (media.length === 0) {
    if (files.length > 0) useToastStore.getState().push(`Unsupported: ${files[0].name}`, 'close');
    return;
  }

  const first = media[0];
  if (!browserCanPlay(first.name)) {
    useToastStore
      .getState()
      .push(`Browser can't decode .${extOf(first.name) || '?'} - use the desktop build`, 'close');
  }

  usePlaylistStore.getState().addItem(first.name, first.name);
  usePlaylistStore.getState().addRecent(first.name, first.name);

  usePlayerStore.setState({
    hasMedia: true,
    fileName: first.name,
    filePath: first.name,
    mediaInfo: null,
    time: 0,
    duration: 0,
    bufferedEnd: 0,
    chapters: [],
    tracks: { audio: [], subs: [], videos: [] },
    audioId: null,
    subId: null,
    subCues: null,
  });

  const st = usePlayerStore.getState();
  engine.open(first.name, { file: first, title: first.name });
  engine.setVolume(st.volume);
  engine.setMuted(st.muted);
  engine.setSpeed(st.speed);

  if (media.length > 1) {
    usePlaylistStore.getState().addMany(media.slice(1).map((f) => f.name));
  }

  for (const sub of subs) {
    const text = await sub.text();
    usePlayerStore.getState().loadSubText(text, fileNameOf(sub.name));
    break;
  }

  if (isCacheable(first)) {
    void cacheFile(first.name, first).then((ok) => {
      if (ok) useToastStore.getState().push(`${first.name} cached for quick reopen`, 'bookmark');
    });
  }
}

export async function openRecent(path: string, title: string): Promise<void> {
  if (isDesktop) {
    usePlayerStore.getState().openPath(path, { title });
    return;
  }

  const cached = await getCachedFile(path);
  if (cached) {
    await openFileObjects([cached]);
    return;
  }

  useToastStore.getState().push(`Re-select ${title} to reopen`, 'open');
  const picked = await pickFilesAsync(false);
  if (picked && picked.kind === 'files') {
    await openFileObjects(picked.files);
  } else if (picked && picked.kind === 'paths') {
    openPaths(picked.paths);
  }
}

export async function browseAndOpen(multiple = true): Promise<void> {
  const picked = await pickFilesAsync(multiple);
  if (!picked) return;
  if (picked.kind === 'paths') openPaths(picked.paths);
  else await openFileObjects(picked.files);
}

export async function browseFolderAndOpen(): Promise<void> {
  const picked = await pickFolderAsync();
  if (!picked) return;
  if (picked.kind === 'paths') openPaths(picked.paths);
  else await openFileObjects(picked.files);
}

export async function browseSubtitleAndLoad(): Promise<void> {
  const picked = await pickSubsAsync();
  if (!picked) return;
  if (picked.kind === 'paths') {
    usePlayerStore.getState().addExternalSub(picked.paths[0]);
    useToastStore.getState().push(`Loaded ${picked.paths[0].split(/[\\/]/).pop()}`, 'subtitle');
  } else if (picked.files.length > 0) {
    const text = await picked.files[0].text();
    usePlayerStore.getState().loadSubText(text, picked.files[0].name);
    useToastStore.getState().push(`Loaded ${picked.files[0].name}`, 'subtitle');
  }
}