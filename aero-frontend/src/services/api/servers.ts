import apiClient from './client';
import type { Server } from '../../types/server';

export const serversApi = {
  list: async () => {
    const { data } = await apiClient.get<Server[]>('/api/servers');
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<Server>(`/api/servers/${id}`);
    return data;
  },
};
