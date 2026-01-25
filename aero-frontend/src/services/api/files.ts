import apiClient from './client';
import type { FileEntry, FileListing } from '../../types/file';
import { joinPath, normalizePath } from '../../utils/filePaths';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type FileListingPayload =
  | Array<{
      name: string;
      size?: number;
      isDirectory?: boolean;
      type?: string;
      modified?: string;
    }>
  | {
      path?: string;
      files?: Array<{
        name: string;
        size?: number;
        isDirectory?: boolean;
        type?: string;
        modified?: string;
      }>;
      message?: string;
    };

const normalizeModified = (value: unknown) => {
  if (!value) return undefined;
  const parsed = new Date(typeof value === 'number' ? value : String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const normalizeEntry = (
  entry: { name: string; size?: number; isDirectory?: boolean; type?: string; modified?: string },
  basePath: string,
): FileEntry => {
  const name = entry.name ?? 'unknown';
  const numericSize = Number(entry.size);
  const size = Number.isFinite(numericSize) ? numericSize : 0;
  const typeValue = entry.type ?? '';
  const isDirectory = Boolean(
    entry.isDirectory ?? ['directory', 'dir', 'folder'].includes(typeValue),
  );
  return {
    name,
    path: joinPath(basePath, name),
    size,
    isDirectory,
    modified: normalizeModified(entry.modified),
  };
};

const normalizeListing = (payload: FileListingPayload | undefined, requestedPath: string): FileListing => {
  const normalizedPath = normalizePath(requestedPath);
  if (!payload) {
    return { path: normalizedPath, files: [] };
  }

  if (Array.isArray(payload)) {
    return {
      path: normalizedPath,
      files: payload.map((entry) => normalizeEntry(entry, normalizedPath)),
    };
  }

  const basePath = normalizePath(payload.path ?? normalizedPath);
  const files = payload.files ? payload.files.map((entry) => normalizeEntry(entry, basePath)) : [];
  return {
    path: basePath,
    files,
    message: payload.message,
  };
};

export const filesApi = {
  list: async (serverId: string, path = '/') => {
    const normalizedPath = normalizePath(path);
    const { data } = await apiClient.get<ApiResponse<FileListingPayload>>(
      `/api/servers/${serverId}/files`,
      { params: { path: normalizedPath } },
    );
    return normalizeListing(data.data, normalizedPath);
  },
  download: async (serverId: string, path: string) => {
    const normalizedPath = normalizePath(path);
    const response = await apiClient.get<Blob>(`/api/servers/${serverId}/files/download`, {
      params: { path: normalizedPath },
      responseType: 'blob',
    });
    return response.data;
  },
  readText: async (serverId: string, path: string) => {
    const blob = await filesApi.download(serverId, path);
    return blob.text();
  },
  upload: async (serverId: string, path: string, files: File[]) => {
    const normalizedPath = normalizePath(path);
    await Promise.all(
      files.map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', normalizedPath);
        return apiClient.post<ApiResponse<void>>(
          `/api/servers/${serverId}/files/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          },
        );
      }),
    );
  },
  create: async (
    serverId: string,
    payload: { path: string; isDirectory: boolean; content?: string },
  ) => {
    const normalizedPath = normalizePath(payload.path);
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/servers/${serverId}/files/create`,
      { ...payload, path: normalizedPath },
    );
    return data;
  },
  write: async (serverId: string, path: string, content: string) => {
    const normalizedPath = normalizePath(path);
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/servers/${serverId}/files/write`,
      { path: normalizedPath, content },
    );
    return data;
  },
  remove: async (serverId: string, path: string) => {
    const normalizedPath = normalizePath(path);
    const { data } = await apiClient.delete<ApiResponse<void>>(
      `/api/servers/${serverId}/files/delete`,
      { params: { path: normalizedPath } },
    );
    return data;
  },
  compress: async (
    serverId: string,
    payload: { paths: string[]; archiveName: string },
  ) => {
    const normalizedPaths = payload.paths.map((path) => normalizePath(path));
    const { data } = await apiClient.post<ApiResponse<{ archivePath?: string }>>(
      `/api/servers/${serverId}/files/compress`,
      { ...payload, paths: normalizedPaths },
    );
    return data.data;
  },
  decompress: async (
    serverId: string,
    payload: { archivePath: string; targetPath: string },
  ) => {
    const normalizedArchive = normalizePath(payload.archivePath);
    const normalizedTarget = normalizePath(payload.targetPath);
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/servers/${serverId}/files/decompress`,
      { archivePath: normalizedArchive, targetPath: normalizedTarget },
    );
    return data;
  },
};
