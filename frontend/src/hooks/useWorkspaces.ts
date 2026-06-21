import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '../services/workspaceService';
import { useUIStore } from '../stores/uiStore';

export const WORKSPACE_KEYS = {
  all: ['workspaces'] as const,
  detail: (id: string) => ['workspaces', id] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: WORKSPACE_KEYS.all,
    queryFn: workspaceService.list,
    staleTime: 30_000,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: WORKSPACE_KEYS.detail(id),
    queryFn: () => workspaceService.get(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workspaceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.all });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      workspaceService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.detail(id) });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const { activeWorkspaceId, setActiveWorkspace } = useUIStore();
  return useMutation({
    mutationFn: workspaceService.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.all });
      if (activeWorkspaceId === id) setActiveWorkspace(null);
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string; email: string; role: 'editor' | 'viewer' }) =>
      workspaceService.inviteMember(workspaceId, { email, role }),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.detail(workspaceId) });
    },
  });
}
