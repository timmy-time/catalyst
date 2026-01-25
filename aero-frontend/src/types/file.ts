export type FileEntry = {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  mode?: number;
  modified?: string;
};

export type FileListing = {
  path: string;
  files: FileEntry[];
  message?: string;
};
