import apiClient from './client';
import type { NodeInfo } from '../../types/node';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export const nodesApi = {
  list: async () => {
    const { data } = await apiClient.get<ApiResponse<NodeInfo[]>>('/api/nodes');
    return data.data || [];
  },
  availableIps: async (nodeId: string, networkName: string, limit = 200) => {
    const { data } = await apiClient.get<ApiResponse<string[]>>(
      `/api/nodes/${nodeId}/ip-availability`,
      { params: { networkName, limit } },
    );
    return data.data || [];
  },
};
