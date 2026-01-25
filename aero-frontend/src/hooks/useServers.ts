import { useQuery } from '@tanstack/react-query';
import { serversApi } from '../services/api/servers';

export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: serversApi.list,
  });
}
