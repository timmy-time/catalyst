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

  connect(callbacks?: Callbacks) {
    const token = useAuthStore.getState().token;
    const url = `${import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000/ws'}?token=${token ?? ''}`;
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
    this.send({ type: 'console_input', serverId, input: command });
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
