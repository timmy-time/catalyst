import EmptyState from '../../components/shared/EmptyState';

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
        <p className="text-sm text-slate-400">System overview and quick insights.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {["Servers", "Nodes", "Alerts"].map((title) => (
          <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
            <div className="text-sm text-slate-400">{title}</div>
            <div className="text-3xl font-semibold text-slate-50">—</div>
          </div>
        ))}
      </div>
      <EmptyState
        title="Metrics coming soon"
        description="We will plug real-time stats and activity feed here."
      />
    </div>
  );
}

export default DashboardPage;
