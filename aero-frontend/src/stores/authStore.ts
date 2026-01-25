import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api/auth';
import type { User } from '../types/user';
import type { LoginSchema, RegisterSchema } from '../validators/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isReady: boolean;
  isRefreshing: boolean;
  login: (values: LoginSchema) => Promise<void>;
  register: (values: RegisterSchema) => Promise<void>;
  refresh: () => Promise<void>;
  init: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isReady: false,
      isLoading: false,
      isRefreshing: false,
      login: async (values) => {
        set({ isLoading: true });
        const { token, user } = await authApi.login(values);
        set({ user, token, isAuthenticated: true, isLoading: false, isReady: true });
      },
      register: async (values) => {
        set({ isLoading: true });
        const { token, user } = await authApi.register(values);
        set({ user, token, isAuthenticated: true, isLoading: false, isReady: true });
      },
      refresh: async () => {
        const currentToken = get().token;
        if (!currentToken) {
          set({ isRefreshing: false, isReady: true, isAuthenticated: false, user: null });
          return;
        }
        set({ isRefreshing: true });
        try {
          const { token, user } = await authApi.refresh();
          set({ token, user, isAuthenticated: true, isRefreshing: false, isReady: true });
        } catch (error) {
          set({ token: null, user: null, isAuthenticated: false, isRefreshing: false, isReady: true });
          throw error;
        }
      },
      init: async () => {
        if (!get().token) {
          set({ isReady: true });
          return;
        }
        await get().refresh();
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isReady: true });
      },
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
    }),
    {
      name: 'aero-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
