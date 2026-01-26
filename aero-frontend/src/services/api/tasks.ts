import apiClient from './client';
import type { Task } from '../../types/task';

export type CreateTaskPayload = {
  name: string;
  description?: string;
  action: Task['action'];
  payload?: Record<string, unknown>;
  schedule: string;
};

export const tasksApi = {
  list: async (serverId: string) => {
    const { data } = await apiClient.get<{ tasks: Task[] }>(`/api/servers/${serverId}/tasks`);
    return data.tasks ?? [];
  },
  create: async (serverId: string, payload: CreateTaskPayload) => {
    const { data } = await apiClient.post<{ success: boolean; task: Task }>(
      `/api/servers/${serverId}/tasks`,
      payload,
    );
    return data.task;
  },
};
