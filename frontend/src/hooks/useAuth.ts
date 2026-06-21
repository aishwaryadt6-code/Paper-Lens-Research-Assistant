import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { setAccessToken } from '../services/apiClient';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      authService.register(name, email, password),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      navigate('/dashboard');
    },
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      navigate('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });

  const googleAuthMutation = useMutation({
    mutationFn: (idToken: string) => authService.googleAuth(idToken),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      navigate('/dashboard');
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    register: registerMutation,
    login: loginMutation,
    logout: logoutMutation,
    googleAuth: googleAuthMutation,
  };
}

export function useInitAuth() {
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();

  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const token = await authService.refresh();
        setAccessToken(token);
        const user = await authService.getMe();
        setAuth(user, token);
        return user;
      } catch {
        clearAuth();
        return null;
      }
    },
    enabled: !isAuthenticated,
    retry: false,
    staleTime: Infinity,
  });
}
