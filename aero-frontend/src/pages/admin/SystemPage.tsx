import EmptyState from '../../components/shared/EmptyState';

function SystemPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-50">System Health</h1>
      <EmptyState
        title="System metrics"
        description="Database, WebSocket, and agent connectivity dashboards will render here."
      />
    </div>
  );
}

export default SystemPage;
