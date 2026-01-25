import apiClient from './client';
import type { LoginSchema, RegisterSchema } from '../../validators/auth';
import type { User } from '../../types/user';

export const authApi = {
  async login(values: LoginSchema): Promise<{ token: string; user: User }> {
    if (import.meta.env.DEV) {
      return {
        token: 'dev-token',
        user: { id: 'demo', email: values.email, role: 'admin' },
      };
    }

    const { data } = await apiClient.post('/api/auth/login', values);
    return data;
  },

  async register(values: RegisterSchema): Promise<{ token: string; user: User }> {
    if (import.meta.env.DEV) {
      return {
        token: 'dev-token',
        user: { id: 'demo', email: values.email, role: 'admin' },
      };
    }

    const { data } = await apiClient.post('/api/auth/register', values);
    return data;
  },

  async refresh(): Promise<{ token: string; user: User }> {
    if (import.meta.env.DEV) {
      return {
        token: 'dev-token',
        user: { id: 'demo', email: 'admin@example.com', role: 'admin' },
      };
    }

    const { data } = await apiClient.post('/api/auth/refresh');
    return data;
  },
};
