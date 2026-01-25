import EmptyState from '../../components/shared/EmptyState';

function TemplatesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Templates</h1>
          <p className="text-sm text-slate-400">Define server templates with images and start commands.</p>
        </div>
        <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500">
          New Template
        </button>
      </div>
      <EmptyState
        title="No templates"
        description="Create a template to bootstrap new game servers quickly."
      />
    </div>
  );
}

export default TemplatesPage;
