import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlaylistItem {
  id: string;
  title: string;
  path: string;
}

export interface RecentFile {
  path: string;
  title: string;
  at: number;
}

interface PlaylistState {
  items: PlaylistItem[];
  index: number;
  recent: RecentFile[];
  addItem: (path: string, title?: string) => PlaylistItem;
  addMany: (paths: string[]) => void;
  remove: (id: string) => void;
  move: (from: number, to: number) => void;
  clear: () => void;
  next: () => PlaylistItem | null;
  prev: () => PlaylistItem | null;
  addRecent: (path: string, title?: string) => void;
  removeRecent: (path: string) => void;
  clearRecent: () => void;
}

let itemSeq = 0;

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      items: [],
      index: -1,
      recent: [],
      addItem: (path, title) => {
        const item: PlaylistItem = {
          id: `pl-${++itemSeq}-${Date.now()}`,
          title: title ?? path.split(/[\\/]/).pop() ?? path,
          path,
        };
        set((s) => ({ items: [...s.items, item], index: s.items.length }));
        return item;
      },
      addMany: (paths) => {
        const items = paths.map((p) => ({
          id: `pl-${++itemSeq}-${Date.now()}`,
          title: p.split(/[\\/]/).pop() ?? p,
          path: p,
        }));
        if (items.length === 0) return;
        set((s) => ({
          items: [...s.items, ...items],
          index: s.index < 0 ? 0 : s.index,
        }));
      },
      remove: (id) =>
        set((s) => {
          const idx = s.items.findIndex((i) => i.id === id);
          const items = s.items.filter((i) => i.id !== id);
          let index = s.index;
          if (idx < s.index) index = s.index - 1;
          else if (idx === s.index) index = Math.min(s.index, items.length - 1);
          return { items, index };
        }),
      move: (from, to) =>
        set((s) => {
          if (from === to || from < 0 || to < 0 || from >= s.items.length || to >= s.items.length) {
            return s;
          }
          const items = [...s.items];
          const [moved] = items.splice(from, 1);
          items.splice(to, 0, moved);
          let index = s.index;
          if (index === from) index = to;
          else if (from < index && to >= index) index--;
          else if (from > index && to <= index) index++;
          return { items, index };
        }),
      clear: () => set({ items: [], index: -1 }),
      next: () => {
        const { items, index } = get();
        return index + 1 < items.length ? items[index + 1] : null;
      },
      prev: () => {
        const { items, index } = get();
        if (index - 1 >= 0) return items[index - 1];
        return null;
      },
      addRecent: (path, title) =>
        set((s) => {
          const file: RecentFile = {
            path,
            title: title ?? path.split(/[\\/]/).pop() ?? path,
            at: Date.now(),
          };
          const recent = [file, ...s.recent.filter((r) => r.path !== path)].slice(0, 30);
          return { recent };
        }),
      removeRecent: (path) =>
        set((s) => ({ recent: s.recent.filter((r) => r.path !== path) })),
      clearRecent: () => set({ recent: [] }),
    }),
    { name: 'ankylo-playlist', partialize: (s) => ({ recent: s.recent }) },
  ),
);
