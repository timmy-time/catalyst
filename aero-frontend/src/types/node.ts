export interface NodeInfo {
  id: string;
  name: string;
  status: 'online' | 'offline';
  region?: string;
  cpuUsage?: number;
  memoryUsage?: number;
}
