import EmptyState from '../../components/shared/EmptyState';

function AlertsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Alerts</h1>
          <p className="text-sm text-slate-400">Monitor incidents and resolve alerts in real time.</p>
        </div>
        <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500">
          Create Rule
        </button>
      </div>
      <EmptyState
        title="All clear"
        description="No active alerts. Create rules to get notified when something breaks."
      />
    </div>
  );
}

export default AlertsPage;
