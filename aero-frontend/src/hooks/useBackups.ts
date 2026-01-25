export function useBackups(serverId: string) {
  return { serverId, data: [], isLoading: false } as const;
}
