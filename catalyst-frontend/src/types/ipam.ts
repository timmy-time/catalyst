export interface IpPool {
  id: string;
  nodeId: string;
  nodeName: string;
  networkName: string;
  cidr: string;
  gateway?: string | null;
  startIp?: string | null;
  endIp?: string | null;
  reserved?: string[];
  rangeStart: string;
  rangeEnd: string;
  total: number;
  reservedCount: number;
  usedCount: number;
  availableCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIpPoolPayload {
  nodeId: string;
  networkName: string;
  cidr: string;
  gateway?: string;
  startIp?: string;
  endIp?: string;
  reserved?: string[];
}
