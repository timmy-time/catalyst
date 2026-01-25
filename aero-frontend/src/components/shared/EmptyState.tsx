type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/50 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
