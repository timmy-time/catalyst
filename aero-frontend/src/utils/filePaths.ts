export const normalizePath = (value: string) => {
  if (!value) return '/';
  const replaced = value.replace(/\\/g, '/').trim();
  if (!replaced) return '/';
  const parts = replaced.split('/').filter(Boolean);
  return `/${parts.join('/')}`;
};

export const joinPath = (base: string, segment: string) => {
  const normalizedBase = normalizePath(base);
  const normalizedSegment = segment.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalizedSegment) return normalizedBase;
  if (normalizedBase === '/') return normalizePath(`/${normalizedSegment}`);
  return normalizePath(`${normalizedBase}/${normalizedSegment}`);
};

export const splitPath = (value: string) => normalizePath(value).split('/').filter(Boolean);

export const getParentPath = (value: string) => {
  const parts = splitPath(value);
  if (parts.length <= 1) return '/';
  return `/${parts.slice(0, -1).join('/')}`;
};

export const buildBreadcrumbs = (value: string) => {
  const segments = splitPath(value);
  const breadcrumbs: Array<{ name: string; path: string }> = [];
  let current = '/';
  segments.forEach((segment) => {
    current = joinPath(current, segment);
    breadcrumbs.push({ name: segment, path: current });
  });
  return breadcrumbs;
};
