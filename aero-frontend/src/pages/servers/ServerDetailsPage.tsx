import { useParams } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';

function ServerDetailsPage() {
  const { serverId } = useParams();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-50">Server {serverId}</h1>
      <EmptyState
        title="Server details"
        description="Configuration, resource graphs, and actions will appear here."
      />
    </div>
  );
}

export default ServerDetailsPage;
