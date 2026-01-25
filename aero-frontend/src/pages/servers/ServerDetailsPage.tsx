import { Link, useParams } from 'react-router-dom';
import { useServer } from '../../hooks/useServer';
import { useServerMetrics } from '../../hooks/useServerMetrics';
import { useServerEvents } from '../../hooks/useServerEvents';
import { useWebSocketStore } from '../../stores/websocketStore';
import ServerControls from '../../components/servers/ServerControls';
import ServerStatusBadge from '../../components/servers/ServerStatusBadge';
import ServerMetrics from '../../components/servers/ServerMetrics';
import UpdateServerModal from '../../components/servers/UpdateServerModal';
import TransferServerModal from '../../components/servers/TransferServerModal';
import DeleteServerDialog from '../../components/servers/DeleteServerDialog';

function ServerDetailsPage() {
  const { serverId } = useParams();
  const { data: server, isLoading, isError } = useServer(serverId);
  const liveMetrics = useServerMetrics(serverId, server?.allocatedMemoryMb);
  const events = useServerEvents(serverId);
  const { isConnected } = useWebSocketStore();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-slate-200">
        Loading server...
      </div>
    );
  }

  if (isError || !server) {
    return (
      <div className="rounded-xl border border-rose-800 bg-rose-950/40 px-4 py-6 text-rose-200">
        Unable to load server details.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-50">{server.name}</h1>
            <ServerStatusBadge status={server.status} />
          </div>
          <div className="text-sm text-slate-400">Node: {server.nodeName ?? server.nodeId}</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            to={`/servers/${server.id}/console`}
            className="rounded-md border border-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-700"
          >
            Console
          </Link>
          <Link
            to={`/servers/${server.id}/files`}
            className="rounded-md border border-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-700"
          >
            Files
          </Link>
          <UpdateServerModal serverId={server.id} />
          <TransferServerModal serverId={server.id} />
          <DeleteServerDialog serverId={server.id} serverName={server.name} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm text-slate-300">Controls</div>
            <div className="text-xs text-slate-500">Start, stop, restart, or kill the server.</div>
          </div>
          <ServerControls serverId={server.id} status={server.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ServerMetrics
          cpu={liveMetrics?.cpuPercent ?? server?.cpuPercent ?? 0}
          memory={liveMetrics?.memoryPercent ?? server?.memoryPercent ?? 0}
        />
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-100">Recent events</div>
            <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            {events.length > 0 ? (
              events.map((event) => (
                <li key={event.id} className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="uppercase tracking-wide">{event.stream ?? 'event'}</span>
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-100">{event.message}</div>
                </li>
              ))
            ) : (
              <>
                <li className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
                  {isConnected
                    ? 'Connected to WebSocket - ready for real-time updates.'
                    : 'Connecting to real-time updates...'}
                </li>
                <li className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
                  {liveMetrics ? 'Receiving live metrics updates.' : 'Waiting for metrics stream...'}
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ServerDetailsPage;
