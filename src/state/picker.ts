import { isDesktop } from '../engine';

export type PickResult = { kind: 'files'; files: File[] } | { kind: 'paths'; paths: string[] };

function ensureInput(accept: string, multiple: boolean, directory = false): HTMLInputElement {
  const existing = document.getElementById('ankylo-picker') as HTMLInputElement | null;
  if (existing) {
    existing.accept = accept;
    existing.multiple = multiple;
    // The cached element keeps whatever mode the first caller set, so the mode
    // has to be re-applied on every reuse - otherwise one folder pick leaves
    // every later file dialog stuck in "choose a folder".
    if (directory) {
      existing.setAttribute('webkitdirectory', '');
      existing.setAttribute('directory', '');
    } else {
      existing.removeAttribute('webkitdirectory');
      existing.removeAttribute('directory');
    }
    return existing;
  }
  const input = document.createElement('input');
  input.id = 'ankylo-picker';
  input.type = 'file';
  input.accept = accept;
  input.multiple = multiple;
  input.style.display = 'none';
  if (directory) {
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
  }
  document.body.appendChild(input);
  return input;
}

const MEDIA_ACCEPT =
  'video/*,audio/*,.mkv,.avi,.ts,.m2ts,.mts,.flv,.vob,.evo,.wmv,.asf,.rm,.rmvb,.3gp,.divx,.xvid,.f4v,.mxf,.m3u8,.mpd';

function pickViaInput(accept: string, multiple: boolean, directory = false): Promise<File[] | null> {
  return new Promise((resolve) => {
    const input = ensureInput(accept, multiple, directory);
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('focus', onFocus);
      input.removeEventListener('change', onChange);
    };

    const onChange = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const files = Array.from(input.files ?? []);
      input.value = '';
      resolve(files.length > 0 ? files : null);
    };

    const onFocus = () => {
      window.setTimeout(() => {
        if (settled) return;
        if (input.files && input.files.length > 0) return;
        settled = true;
        cleanup();
        resolve(null);
      }, 700);
    };

    input.addEventListener('change', onChange);
    window.addEventListener('focus', onFocus);
    input.click();
  });
}

async function pickViaTauri(mode: 'files' | 'folder' | 'subs'): Promise<string[] | null> {
  const { invoke } = await import('@tauri-apps/api/core');
  const command = mode === 'subs' ? 'mpv_open_sub_dialog' : 'mpv_open_dialog';
  const paths = await invoke<string[] | null>(command, { mode });
  return Array.isArray(paths) && paths.length > 0 ? paths : null;
}

export async function pickFilesAsync(multiple = true): Promise<PickResult | null> {
  if (isDesktop) {
    const paths = await pickViaTauri('files');
    return paths ? { kind: 'paths', paths } : null;
  }
  const files = await pickViaInput(MEDIA_ACCEPT, multiple);
  return files ? { kind: 'files', files } : null;
}

export async function pickFolderAsync(): Promise<PickResult | null> {
  if (isDesktop) {
    const paths = await pickViaTauri('folder');
    return paths ? { kind: 'paths', paths } : null;
  }
  const files = await pickViaInput(MEDIA_ACCEPT, true, true);
  return files ? { kind: 'files', files } : null;
}

export async function pickSubsAsync(): Promise<PickResult | null> {
  if (isDesktop) {
    const paths = await pickViaTauri('subs');
    return paths ? { kind: 'paths', paths } : null;
  }
  const files = await pickViaInput('.srt,.ass,.ssa,.vtt,.sub,.idx,.sup', false);
  return files ? { kind: 'files', files } : null;
}