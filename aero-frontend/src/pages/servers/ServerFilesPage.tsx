import { useParams } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';

function ServerFilesPage() {
  const { serverId } = useParams();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-50">Files • {serverId}</h1>
      <EmptyState
        title="File manager coming soon"
        description="Upload, edit, and download server files with Monaco + SFTP bridge."
      />
    </div>
  );
}

export default ServerFilesPage;
