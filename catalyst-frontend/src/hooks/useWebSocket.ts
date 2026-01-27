import { useEffect } from 'react';
import { useWebSocketStore } from '../stores/websocketStore';

export function useWebSocket() {
  const { connect, isConnected } = useWebSocketStore();

  useEffect(() => {
    connect();
  }, [connect]);

  return { isConnected };
}
