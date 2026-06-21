import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { useAuthStore } from '../stores/authStore';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileService.get,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: profileService.update,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['profile'], user);
    },
  });
}
