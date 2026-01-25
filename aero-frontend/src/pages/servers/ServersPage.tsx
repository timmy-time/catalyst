import EmptyState from '../../components/shared/EmptyState';

function ServersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Servers</h1>
          <p className="text-sm text-slate-400">Create, start, and observe your game servers.</p>
        </div>
        <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500">
          New Server
        </button>
      </div>
      <EmptyState
        title="No servers yet"
        description="Connect your first node or create a server from a template."
      />
    </div>
  );
}

export default ServersPage;
