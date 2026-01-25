import apiClient from './client';
import type { Task } from '../../types/task';

export const tasksApi = {
  list: async () => {
    const { data } = await apiClient.get<Task[]>('/api/tasks');
    return data;
  },
};
