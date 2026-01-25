import EmptyState from '../../components/shared/EmptyState';

function NodesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Nodes</h1>
          <p className="text-sm text-slate-400">Track connected infrastructure nodes.</p>
        </div>
        <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500">
          Register Node
        </button>
      </div>
      <EmptyState
        title="No nodes detected"
        description="Install the Aero agent and register nodes to begin."
      />
    </div>
  );
}

export default NodesPage;
