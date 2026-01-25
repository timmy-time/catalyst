import { create } from 'zustand';
import { WebSocketManager } from '../services/websocket/WebSocketManager';

interface WebSocketState {
  isConnected: boolean;
  subscriptions: Set<string>;
  connect: () => void;
  subscribe: (serverId: string) => void;
  unsubscribe: (serverId: string) => void;
  sendCommand: (serverId: string, command: string) => void;
}

const manager = new WebSocketManager();

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  isConnected: false,
  subscriptions: new Set<string>(),
  connect: () => {
    manager.connect({
      onOpen: () => set({ isConnected: true }),
      onClose: () => set({ isConnected: false }),
    });
  },
  subscribe: (serverId) => {
    manager.subscribe(serverId);
    const next = new Set(get().subscriptions);
    next.add(serverId);
    set({ subscriptions: next });
  },
  unsubscribe: (serverId) => {
    manager.unsubscribe(serverId);
    const next = new Set(get().subscriptions);
    next.delete(serverId);
    set({ subscriptions: next });
  },
  sendCommand: (serverId, command) => manager.sendCommand(serverId, command),
}));
