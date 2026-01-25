import { useMemo, useState } from 'react';
import { useWebSocketStore } from '../stores/websocketStore';

export function useConsole(serverId: string) {
  const [lines, setLines] = useState<string[]>([]);
  const { sendCommand, subscribe, unsubscribe } = useWebSocketStore();

  useMemo(() => {
    if (!serverId) return undefined;
    subscribe(serverId);
    return () => unsubscribe(serverId);
  }, [serverId, subscribe, unsubscribe]);

  const send = (command: string) => sendCommand(serverId, command);

  return { lines, send };
}
