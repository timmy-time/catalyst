import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../services/api/tasks';

export function useTasks(serverId?: string) {
  return useQuery({
    queryKey: ['tasks', serverId],
    queryFn: () => {
      if (!serverId) throw new Error('missing server id');
      return tasksApi.list(serverId);
    },
    enabled: Boolean(serverId),
  });
}
