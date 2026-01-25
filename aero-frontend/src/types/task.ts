export interface Task {
  id: string;
  name: string;
  schedule: string;
  type: 'backup' | 'restart' | 'command' | 'stop' | 'start';
  serverId: string;
}
