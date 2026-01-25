import apiClient from './client';
import type { CreateIpPoolPayload, IpPool } from '../../types/ipam';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export const adminApi = {
  listIpPools: async () => {
    const { data } = await apiClient.get<ApiResponse<IpPool[]>>('/api/admin/ip-pools');
    return data.data || [];
  },
  createIpPool: async (payload: CreateIpPoolPayload) => {
    const { data } = await apiClient.post<ApiResponse<IpPool>>('/api/admin/ip-pools', payload);
    return data.data;
  },
  updateIpPool: async (poolId: string, payload: Partial<CreateIpPoolPayload>) => {
    const { data } = await apiClient.put<ApiResponse<IpPool>>(
      `/api/admin/ip-pools/${poolId}`,
      payload,
    );
    return data.data;
  },
  deleteIpPool: async (poolId: string) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/api/admin/ip-pools/${poolId}`);
    return data;
  },
};
