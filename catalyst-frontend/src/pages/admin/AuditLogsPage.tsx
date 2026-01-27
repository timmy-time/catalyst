import AdminTabs from '../../components/admin/AdminTabs';
import EmptyState from '../../components/shared/EmptyState';

function AuditLogsPage() {
  return (
    <div className="space-y-4">
      <AdminTabs />
      <h1 className="text-2xl font-semibold text-slate-50">Audit Logs</h1>
      <EmptyState
        title="No logs yet"
        description="User actions will be streamed here once endpoints and WebSockets are wired."
      />
    </div>
  );
}

export default AuditLogsPage;
