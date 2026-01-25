import { useAuthStore } from '../../stores/authStore';
import type { WebSocketMessage } from './types';

type Callbacks = {
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
};

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly subscriptions = new Set<string>();

  private buildWsUrl(token: string | null) {
    const normalizeScheme = (url: string) => {
      if (url.startsWith('http://')) return `ws://${url.slice('http://'.length)}`;
      if (url.startsWith('https://')) return `wss://${url.slice('https://'.length)}`;
      return url;
    };

    const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
    let wsUrl: URL;

    if (envUrl) {
      wsUrl = new URL(normalizeScheme(envUrl), window.location.origin);
      if (!wsUrl.pathname || wsUrl.pathname === '/') {
        wsUrl.pathname = '/ws';
      }
    } else {
      const apiBase =
        (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
      const apiUrl = new URL(apiBase, window.location.origin);
      wsUrl = new URL('/ws', apiUrl);
      wsUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    }

    if (import.meta.env.DEV) {
      if (wsUrl.hostname === 'localhost' || wsUrl.hostname === '::1') {
        wsUrl.hostname = '127.0.0.1';
      }
    }

    if (token) {
      wsUrl.searchParams.set('token', token);
    }

    return wsUrl.toString();
  }

  connect(callbacks?: Callbacks) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = useAuthStore.getState().token;
    const url = this.buildWsUrl(token);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      callbacks?.onOpen?.();
      this.subscriptions.forEach((serverId) => this.subscribe(serverId));
    };

    this.ws.onclose = () => {
      callbacks?.onClose?.();
      this.scheduleReconnect(callbacks);
    };

    this.ws.onerror = (error) => {
      callbacks?.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      callbacks?.onMessage?.(message);
    };
  }

  subscribe(serverId: string) {
    this.subscriptions.add(serverId);
    this.send({ type: 'subscribe', serverId });
  }

  unsubscribe(serverId: string) {
    this.subscriptions.delete(serverId);
    this.send({ type: 'unsubscribe', serverId });
  }

  sendCommand(serverId: string, command: string) {
    this.send({ type: 'console_input', serverId, data: command });
  }

  private send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect(callbacks?: Callbacks) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts += 1;
    const delay = 1000 * this.reconnectAttempts;
    setTimeout(() => this.connect(callbacks), delay);
  }
}
