import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../stores/authStore';

const mockUser = {
  _id: 'user-123',
  name: 'Test User',
  email: 'test@paperlens.dev',
  role: 'researcher' as const,
  isEmailVerified: true,
  isActive: true,
  settings: {
    theme: 'system' as const,
    language: 'en',
    notifications: { email: true, inApp: true },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('sets auth state on setAuth', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-abc');
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('token-abc');
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears auth state on clearAuth', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-abc');
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updates user with setUser', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-abc');
    const updated = { ...mockUser, name: 'Updated Name' };
    useAuthStore.getState().setUser(updated);
    expect(useAuthStore.getState().user?.name).toBe('Updated Name');
  });

  it('setLoading updates isLoading', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
