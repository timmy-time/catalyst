function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10 text-slate-200">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-sky-400" />
    </div>
  );
}

export default LoadingSpinner;
