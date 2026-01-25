export type WebSocketMessage =
  | {
      type: 'console_output';
      serverId: string;
      stream?: string;
      data: string;
      timestamp?: number | string;
    }
  | {
      type: 'server_log';
      serverId: string;
      line: string;
      timestamp?: number | string;
    }
  | {
      type: 'server_state_update' | 'server_state';
      serverId: string;
      state: string;
      reason?: string;
      timestamp?: number | string;
    }
  | {
      type: 'resource_stats';
      serverId: string;
      cpuPercent?: number;
      memoryUsageMb?: number;
      networkRxBytes?: number;
      networkTxBytes?: number;
      diskUsageMb?: number;
      cpu?: number;
      memory?: number;
    };
