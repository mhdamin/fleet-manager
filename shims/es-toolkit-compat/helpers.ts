export const getPathParts = (path: string | Array<string | number>): Array<string | number> => {
  if (Array.isArray(path)) {
    return path;
  }

  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
};

export const getValue = <T>(item: T, iteratee: ((value: T) => unknown) | keyof T | string): unknown => {
  if (typeof iteratee === 'function') {
    return iteratee(item);
  }

  if (typeof iteratee === 'string' && iteratee.includes('.')) {
    return getPathParts(iteratee).reduce<unknown>((current, key) => {
      if (current == null) {
        return undefined;
      }
      return (current as Record<string | number, unknown>)[key];
    }, item as unknown);
  }

  return (item as Record<string | number, unknown>)[iteratee as string | number];
};
