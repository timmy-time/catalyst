import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, token, isAuthenticated, login, register, logout, refresh } = useAuthStore();
  return { user, token, isAuthenticated, login, register, logout, refresh };
}
