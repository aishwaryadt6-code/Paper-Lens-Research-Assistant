import { describe, it, expect, beforeEach } from 'vitest';
import { useUploadStore } from '../../stores/uploadStore';

const makeFile = (name = 'paper.pdf') =>
  new File(['content'], name, { type: 'application/pdf' });

describe('uploadStore', () => {
  beforeEach(() => {
    useUploadStore.setState({ queue: [] });
  });

  it('adds files to queue', () => {
    const files = [makeFile('a.pdf'), makeFile('b.pdf')];
    useUploadStore.getState().addFiles(files);
    expect(useUploadStore.getState().queue).toHaveLength(2);
  });

  it('returns generated ids for added files', () => {
    const ids = useUploadStore.getState().addFiles([makeFile()]);
    expect(ids).toHaveLength(1);
    expect(typeof ids[0]).toBe('string');
  });

  it('sets progress for a file', () => {
    const [id] = useUploadStore.getState().addFiles([makeFile()]);
    useUploadStore.getState().setProgress(id, 60);
    const file = useUploadStore.getState().queue.find((f) => f.id === id);
    expect(file?.progress).toBe(60);
    expect(file?.status).toBe('uploading');
  });

  it('sets status to done', () => {
    const [id] = useUploadStore.getState().addFiles([makeFile()]);
    useUploadStore.getState().setStatus(id, 'done', undefined, 'paper-123');
    const file = useUploadStore.getState().queue.find((f) => f.id === id);
    expect(file?.status).toBe('done');
    expect(file?.paperId).toBe('paper-123');
  });

  it('sets status to error with message', () => {
    const [id] = useUploadStore.getState().addFiles([makeFile()]);
    useUploadStore.getState().setStatus(id, 'error', 'Duplicate paper');
    const file = useUploadStore.getState().queue.find((f) => f.id === id);
    expect(file?.status).toBe('error');
    expect(file?.error).toBe('Duplicate paper');
  });

  it('removes a file from queue', () => {
    const [id] = useUploadStore.getState().addFiles([makeFile()]);
    useUploadStore.getState().removeFile(id);
    expect(useUploadStore.getState().queue).toHaveLength(0);
  });

  it('clears only completed files', () => {
    const [id1, id2] = useUploadStore.getState().addFiles([makeFile('a.pdf'), makeFile('b.pdf')]);
    useUploadStore.getState().setStatus(id1, 'done');
    useUploadStore.getState().setStatus(id2, 'uploading');
    useUploadStore.getState().clearCompleted();
    const queue = useUploadStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(id2);
  });
});
