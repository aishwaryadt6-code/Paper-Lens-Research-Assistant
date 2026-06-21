import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paperService } from '../services/paperService';
import { useUploadStore } from '../stores/uploadStore';

export const PAPER_KEYS = {
  all: ['papers'] as const,
  recent: ['papers', 'recent'] as const,
  workspace: (id: string) => ['papers', 'workspace', id] as const,
};

export function usePapers(workspaceId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...PAPER_KEYS.workspace(workspaceId), page, limit],
    queryFn: () => paperService.list(workspaceId, page, limit),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useRecentPapers() {
  return useQuery({
    queryKey: PAPER_KEYS.recent,
    queryFn: paperService.getRecent,
    staleTime: 60_000,
  });
}

export function useUploadPaper(workspaceId: string) {
  const queryClient = useQueryClient();
  const { setProgress, setStatus } = useUploadStore();

  return useMutation({
    mutationFn: async ({ uploadId, file }: { uploadId: string; file: File }) => {
      return paperService.upload(workspaceId, file, (pct) => setProgress(uploadId, pct));
    },
    onSuccess: (paper, { uploadId }) => {
      setStatus(uploadId, 'done', undefined, paper._id);
      queryClient.invalidateQueries({ queryKey: PAPER_KEYS.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: PAPER_KEYS.recent });
    },
    onError: (err: Error, { uploadId }) => {
      setStatus(uploadId, 'error', err.message);
    },
  });
}

export function useDeletePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paperService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAPER_KEYS.all });
    },
  });
}
