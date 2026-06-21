import { create } from 'zustand';
import { UploadingFile } from '../types';
import { v4 as uuid } from 'uuid';

interface UploadState {
  queue: UploadingFile[];
  addFiles: (files: File[]) => string[];
  setProgress: (id: string, progress: number) => void;
  setStatus: (id: string, status: UploadingFile['status'], error?: string, paperId?: string) => void;
  removeFile: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  queue: [],

  addFiles: (files) => {
    const entries: UploadingFile[] = files.map((file) => ({
      id: uuid(),
      file,
      progress: 0,
      status: 'pending',
    }));
    set((s) => ({ queue: [...s.queue, ...entries] }));
    return entries.map((e) => e.id);
  },

  setProgress: (id, progress) =>
    set((s) => ({
      queue: s.queue.map((f) => (f.id === id ? { ...f, progress, status: 'uploading' } : f)),
    })),

  setStatus: (id, status, error, paperId) =>
    set((s) => ({
      queue: s.queue.map((f) =>
        f.id === id ? { ...f, status, ...(error ? { error } : {}), ...(paperId ? { paperId } : {}) } : f
      ),
    })),

  removeFile: (id) =>
    set((s) => ({ queue: s.queue.filter((f) => f.id !== id) })),

  clearCompleted: () =>
    set((s) => ({ queue: s.queue.filter((f) => f.status !== 'done' && f.status !== 'error') })),
}));
