export function useFileManager(serverId: string) {
  return {
    serverId,
    path: '/',
    files: [],
    isLoading: false,
  } as const;
}
