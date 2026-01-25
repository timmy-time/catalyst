import apiClient from './client';
import type { NodeInfo } from '../../types/node';

export const nodesApi = {
  list: async () => {
    const { data } = await apiClient.get<NodeInfo[]>('/api/nodes');
    return data;
  },
};
