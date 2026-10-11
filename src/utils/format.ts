export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function formatTime(t: number): string {
  if (!isFinite(t) || t < 0) t = 0;
  const total = Math.floor(t);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatSpeed(v: number): string {
  const r = Math.round(v * 100) / 100;
  return `${Number.isInteger(r) ? r.toFixed(1) : r}×`;
}

export function formatBitrate(bps: number): string {
  if (!bps || bps <= 0) return '—';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mb/s`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} kb/s`;
  return `${bps} b/s`;
}

export function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatDelay(ms: number): string {
  if (ms === 0) return '0ms';
  return ms > 0 ? `+${ms}ms` : `${ms}ms`;
}

export function fileNameOf(path: string): string {
  const clean = path.split('\\').pop()?.split('/').pop() ?? path;
  return decodeURIComponent(clean);
}

export function extOf(path: string): string {
  const name = fileNameOf(path);
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}
