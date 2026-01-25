import { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import EmptyState from '../shared/EmptyState';

type FileDraft = {
  path: string;
  name: string;
  content: string;
  originalContent: string;
};

type Props = {
  file: FileDraft | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
};

const resolveLanguage = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  switch (extension) {
    case 'json':
      return 'json';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'js':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'sh':
      return 'shell';
    case 'properties':
      return 'ini';
    case 'toml':
      return 'toml';
    default:
      return 'plaintext';
  }
};

function FileEditor({ file, isLoading, isSaving, isDirty, onChange, onSave, onReset, onClose }: Props) {
  const language = useMemo(() => (file ? resolveLanguage(file.name) : 'plaintext'), [file]);

  if (!file) {
    return (
      <EmptyState
        title="Select a file to edit"
        description="Choose a file from the list to view or edit its contents."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{file.name}</div>
          <div className="text-xs text-slate-500">{file.path}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isDirty ? <span className="text-amber-300">Unsaved changes</span> : null}
          <button
            type="button"
            className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:border-slate-700 disabled:opacity-60"
            onClick={onReset}
            disabled={!isDirty || isSaving || isLoading}
          >
            Revert
          </button>
          <button
            type="button"
            className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-sky-500 disabled:opacity-60"
            onClick={onSave}
            disabled={!isDirty || isSaving || isLoading}
          >
            Save
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:border-slate-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-slate-400">Loading file contents...</div>
        ) : (
          <Editor
            height="360px"
            theme="vs-dark"
            language={language}
            value={file.content}
            onChange={(value) => onChange(value ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        )}
      </div>
    </div>
  );
}

export default FileEditor;
