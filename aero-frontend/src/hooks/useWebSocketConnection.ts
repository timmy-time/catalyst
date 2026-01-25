import { useEffect } from 'react';
import { useWebSocketStore } from '../stores/websocketStore';
import { useAuthStore } from '../stores/authStore';

export function useWebSocketConnection() {
  const { connect } = useWebSocketStore();
  const { isAuthenticated, isReady, token } = useAuthStore();

  useEffect(() => {
    // Only connect if authenticated
    if (isReady && isAuthenticated && token) {
      connect();
    }
  }, [isReady, isAuthenticated, token, connect]);
}
