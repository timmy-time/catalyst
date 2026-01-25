export interface Server {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'installing' | 'starting' | 'stopping' | 'crashed' | 'transferring';
  nodeId: string;
  templateId: string;
}
