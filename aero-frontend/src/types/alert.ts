export interface Alert {
  id: string;
  serverId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  createdAt: string;
  resolvedAt?: string;
}
