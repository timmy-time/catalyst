import apiClient from './client';
import type { Template } from '../../types/template';

export const templatesApi = {
  list: async () => {
    const { data } = await apiClient.get<Template[]>('/api/templates');
    return data;
  },
};
