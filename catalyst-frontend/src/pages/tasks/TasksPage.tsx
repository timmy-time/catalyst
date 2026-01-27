import EmptyState from '../../components/shared/EmptyState';

function TasksPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Scheduled Tasks</h1>
          <p className="text-sm text-slate-400">Automate backups, restarts, and commands.</p>
        </div>
        <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500">
          Create Task
        </button>
      </div>
      <EmptyState
        title="No tasks yet"
        description="Create cron-like schedules to automate server operations."
      />
    </div>
  );
}

export default TasksPage;
