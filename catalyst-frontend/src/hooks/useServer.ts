import { useQuery } from '@tanstack/react-query';
import { serversApi } from '../services/api/servers';
import type { Server } from '../types/server';

const transitionalStatuses = new Set(['installing', 'starting', 'stopping', 'transferring']);

export function useServer(id?: string) {
  return useQuery({
    queryKey: ['server', id],
    queryFn: () => (id ? serversApi.get(id) : Promise.reject(new Error('missing id'))),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const data = query.state.data as Server | undefined;
      return data && transitionalStatuses.has(data.status) ? 2000 : false;
    },
  });
}
