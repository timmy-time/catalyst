import { useQuery } from '@tanstack/react-query';
import { templatesApi } from '../services/api/templates';

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: templatesApi.list,
  });
}
