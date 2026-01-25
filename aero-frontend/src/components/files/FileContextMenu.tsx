import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FileEntry } from '../../types/file';

type Props = {
  entry: FileEntry;
  onOpen: () => void;
  onDownload?: () => void;
  onDelete: () => void;
  onCompress?: () => void;
  onDecompress?: () => void;
  contextPosition?: { x: number; y: number } | null;
  onRequestClose?: () => void;
};

function FileContextMenu({
  entry,
  onOpen,
  onDownload,
  onDelete,
  onCompress,
  onDecompress,
  contextPosition,
  onRequestClose,
}: Props) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const wrap = (action?: () => void) => () => {
    action?.();
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
    onRequestClose?.();
  };

  const menu = useMemo(
    () => (
      <div
        ref={menuRef}
        className="w-36 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs shadow-xl"
      >
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-2 py-1 text-slate-200 hover:bg-slate-900"
          onClick={wrap(onOpen)}
        >
          {entry.isDirectory ? 'Open folder' : 'Open file'}
        </button>
        {onDownload ? (
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-1 text-slate-200 hover:bg-slate-900"
            onClick={wrap(onDownload)}
          >
            Download
          </button>
        ) : null}
        {onCompress ? (
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-1 text-slate-200 hover:bg-slate-900"
            onClick={wrap(onCompress)}
          >
            Compress
          </button>
        ) : null}
        {onDecompress ? (
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-1 text-slate-200 hover:bg-slate-900"
            onClick={wrap(onDecompress)}
          >
            Decompress
          </button>
        ) : null}
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-2 py-1 text-rose-200 hover:bg-rose-950/40"
          onClick={wrap(onDelete)}
        >
          Delete
        </button>
      </div>
    ),
    [entry.isDirectory, onCompress, onDecompress, onDelete, onDownload, onOpen],
  );

  useLayoutEffect(() => {
    if (!contextPosition || !menuRef.current) {
      setMenuPosition(null);
      return;
    }
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 12;
    let nextX = contextPosition.x;
    let nextY = contextPosition.y;
    if (nextX + rect.width > window.innerWidth - padding) {
      nextX = Math.max(padding, window.innerWidth - rect.width - padding);
    }
    if (nextY + rect.height > window.innerHeight - padding) {
      nextY = Math.max(padding, window.innerHeight - rect.height - padding);
    }
    nextX = Math.max(padding, nextX);
    nextY = Math.max(padding, nextY);
    setMenuPosition({ x: nextX, y: nextY });
  }, [contextPosition]);

  if (contextPosition && menuPosition) {
    return (
      <div
        data-file-context-menu="true"
        className="fixed z-50"
        style={{ left: menuPosition.x, top: menuPosition.y }}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {menu}
      </div>
    );
  }

  return (
    <details ref={detailsRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <summary
        className="list-none flex cursor-pointer items-center justify-center rounded-md border border-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-700 [&::-webkit-details-marker]:hidden"
        aria-label="File actions"
      >
        ...
      </summary>
      <div className="absolute right-0 z-10 mt-2">{menu}</div>
    </details>
  );
}

export default FileContextMenu;
