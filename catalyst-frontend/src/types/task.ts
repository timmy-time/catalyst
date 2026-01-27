export interface Task {
  id: string;
  name: string;
  action: 'backup' | 'restart' | 'command' | 'stop' | 'start';
  description?: string | null;
  payload?: Record<string, unknown> | null;
  schedule: string;
  serverId: string;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
