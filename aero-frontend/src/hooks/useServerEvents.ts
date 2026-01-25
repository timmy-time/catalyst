import { useEffect, useMemo, useState } from 'react';
import { serversApi } from '../services/api/servers';
import { useWebSocketStore } from '../stores/websocketStore';
import type { ServerLogEntry } from '../types/server';

type ServerEvent = {
  id: string;
  message: string;
  timestamp: string;
  stream?: string;
};

const MAX_EVENTS = 8;

const toIsoString = (timestamp?: number | string) => {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'number') return new Date(timestamp).toISOString();
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const logToEvent = (log: ServerLogEntry, index: number): ServerEvent => ({
  id: `${log.timestamp}-${index}`,
  message: log.data,
  timestamp: log.timestamp,
  stream: log.stream,
});

export function useServerEvents(serverId?: string) {
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketStore();
  const serverKey = useMemo(() => serverId ?? '', [serverId]);

  useEffect(() => {
    if (!serverKey) return;
    let isActive = true;

    const loadInitialLogs = async () => {
      try {
        const logs = await serversApi.logs(serverKey, { lines: 20 });
        if (!isActive) return;
        const normalized = logs.map(logToEvent).reverse().slice(0, MAX_EVENTS);
        setEvents(normalized);
      } catch {
        if (!isActive) return;
        setEvents([]);
      }
    };

    loadInitialLogs();

    return () => {
      isActive = false;
    };
  }, [serverKey]);

  useEffect(() => {
    if (!serverKey || !isConnected) return;

    subscribe(serverKey);

    const unsubscribeHandler = onMessage((message) => {
      if (!('serverId' in message) || message.serverId !== serverKey) return;

      if (message.type === 'console_output') {
        if (!message.data) return;
        const entry: ServerEvent = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          message: message.data,
          timestamp: toIsoString(message.timestamp),
          stream: message.stream ?? 'stdout',
        };
        setEvents((previous) => [entry, ...previous].slice(0, MAX_EVENTS));
      }

      if (message.type === 'server_log') {
        if (!message.line) return;
        const entry: ServerEvent = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          message: message.line,
          timestamp: toIsoString(message.timestamp),
          stream: 'system',
        };
        setEvents((previous) => [entry, ...previous].slice(0, MAX_EVENTS));
      }

      if (message.type === 'server_state_update' || message.type === 'server_state') {
        const detail = message.reason ? ` (${message.reason})` : '';
        const entry: ServerEvent = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          message: `Status changed to ${message.state}${detail}`,
          timestamp: toIsoString(message.timestamp),
          stream: 'system',
        };
        setEvents((previous) => [entry, ...previous].slice(0, MAX_EVENTS));
      }
    });

    return () => {
      unsubscribeHandler();
      unsubscribe(serverKey);
    };
  }, [serverKey, isConnected, subscribe, unsubscribe, onMessage]);

  return events;
}
