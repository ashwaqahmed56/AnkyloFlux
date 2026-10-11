import { create } from 'zustand';

export interface Toast {
  id: number;
  text: string;
  icon: string;
}

interface ToastState {
  toasts: Toast[];
  push: (text: string, icon?: string) => void;
}

let toastSeq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (text, icon = 'check') => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, icon }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 2200);
  },
}));
