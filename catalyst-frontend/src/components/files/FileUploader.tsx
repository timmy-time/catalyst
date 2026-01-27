import { useRef, useState } from 'react';

type Props = {
  path: string;
  isUploading: boolean;
  onUpload: (files: File[]) => void;
  onClose: () => void;
};

function FileUploader({ path, isUploading, onUpload, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    onUpload(Array.from(files));
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-4 text-sm text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-100">Upload files</div>
          <div className="text-xs text-slate-500">Target: {path}</div>
        </div>
        <button
          type="button"
          className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:border-slate-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div
        className={`mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition ${
          isDragActive ? 'border-sky-500 bg-sky-500/10 text-sky-200' : 'border-slate-700 text-slate-400'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="text-sm font-semibold">Drag files here</div>
        <div className="mt-1 text-xs text-slate-500">or select from your device</div>
        <div className="mt-4 flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <button
            type="button"
            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-sky-500 disabled:opacity-60"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            Choose files
          </button>
          {isUploading ? <span className="text-xs text-slate-500">Uploading...</span> : null}
        </div>
      </div>
    </div>
  );
}

export default FileUploader;
