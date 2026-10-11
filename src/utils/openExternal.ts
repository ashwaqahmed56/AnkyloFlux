import { isDesktop } from '../engine';

export async function openExternal(url: string): Promise<void> {
  if (isDesktop) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_url', { url });
      return;
    } catch (e) {
      console.warn('Failed to open url via tauri command, falling back to window.open', e);
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
