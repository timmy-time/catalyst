import { useParams } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';

function ServerConsolePage() {
  const { serverId } = useParams();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-50">Console • {serverId}</h1>
      <EmptyState
        title="Console not connected"
        description="The WebSocket console will stream logs and accept commands here."
      />
    </div>
  );
}

export default ServerConsolePage;
