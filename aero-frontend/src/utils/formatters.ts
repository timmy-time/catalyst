export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(1)} ${units[index]}`;
};

export const formatPercent = (value: number) => `${value.toFixed(0)}%`;
