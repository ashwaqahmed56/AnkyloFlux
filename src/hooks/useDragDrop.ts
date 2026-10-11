import { useEffect } from 'react';
import { usePlayerStore } from '../state/playerStore';
import { openFileObjects } from '../state/openFile';

export { openPaths } from '../state/paths';

export function useDragDrop(): void {
  useEffect(() => {
    let depth = 0;

    const hasFiles = (e: DragEvent): boolean =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files');

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      usePlayerStore.getState().setDragOver(true);
    };

    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };

    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) usePlayerStore.getState().setDragOver(false);
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      usePlayerStore.getState().setDragOver(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) void openFileObjects(files);
    };

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);
}