import apiClient from './client';
import type { Alert } from '../../types/alert';

export const alertsApi = {
  list: async () => {
    const { data } = await apiClient.get<Alert[]>('/api/alerts');
    return data;
  },
};
