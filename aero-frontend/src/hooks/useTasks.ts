import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../services/api/tasks';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.list,
  });
}
