import type { FileEntry } from '../../types/file';
import { formatBytes } from '../../utils/formatters';
import EmptyState from '../shared/EmptyState';
import FileContextMenu from './FileContextMenu';

type Props = {
  files: FileEntry[];
  selectedPaths: Set<string>;
  isLoading: boolean;
  isError: boolean;
  onOpen: (entry: FileEntry) => void;
  onSelect: (entry: FileEntry, selected: boolean) => void;
  onDownload: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
  onCompress: (entry: FileEntry) => void;
  onDecompress: (entry: FileEntry) => void;
};

const isArchive = (name: string) =>
  name.endsWith('.tar.gz') || name.endsWith('.tgz') || name.endsWith('.zip');

function FileList({
  files,
  selectedPaths,
  isLoading,
  isError,
  onOpen,
  onSelect,
  onDownload,
  onDelete,
  onCompress,
  onDecompress,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-6 text-sm text-slate-200">
        Loading files...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-6 text-sm text-rose-200">
        Unable to load file listing.
      </div>
    );
  }

  if (!files.length) {
    return <EmptyState title="No files here" description="Upload or create a file to get started." />;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px] divide-y divide-slate-800">
        <div className="grid grid-cols-[24px,1fr,120px,160px,36px] gap-3 px-4 py-2 text-[11px] uppercase tracking-wide text-slate-500">
          <span />
          <span>Name</span>
          <span>Size</span>
          <span>Modified</span>
          <span className="text-right">Actions</span>
        </div>
        {files.map((entry) => {
          const selected = selectedPaths.has(entry.path);
          return (
            <div
              key={entry.path}
              className={`grid grid-cols-[24px,1fr,120px,160px,36px] items-center gap-3 px-4 py-2 text-sm ${
                selected ? 'bg-slate-900/70' : 'hover:bg-slate-900/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={(event) => onSelect(entry, event.target.checked)}
                onClick={(event) => event.stopPropagation()}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500"
              />
              <button
                type="button"
                className="flex items-center gap-2 text-left text-slate-100"
                onClick={() => onOpen(entry)}
              >
                <span
                  className={`rounded-md px-2 py-1 text-[10px] uppercase tracking-wide ${
                    entry.isDirectory ? 'bg-sky-500/10 text-sky-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {entry.isDirectory ? 'dir' : 'file'}
                </span>
                <span className="truncate">{entry.name}</span>
              </button>
              <span className="text-xs text-slate-400">
                {entry.isDirectory ? '-' : formatBytes(entry.size)}
              </span>
              <span className="text-xs text-slate-500">
                {entry.modified ? new Date(entry.modified).toLocaleString() : '-'}
              </span>
              <div className="flex justify-end">
                <FileContextMenu
                  entry={entry}
                  onOpen={() => onOpen(entry)}
                  onDownload={!entry.isDirectory ? () => onDownload(entry) : undefined}
                  onCompress={() => onCompress(entry)}
                  onDecompress={
                    !entry.isDirectory && isArchive(entry.name) ? () => onDecompress(entry) : undefined
                  }
                  onDelete={() => onDelete(entry)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FileList;
