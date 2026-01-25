import EmptyState from '../../components/shared/EmptyState';

function UsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-50">User Management</h1>
      <EmptyState
        title="No users loaded"
        description="Invite teammates and manage roles once backend wiring is ready."
      />
    </div>
  );
}

export default UsersPage;
