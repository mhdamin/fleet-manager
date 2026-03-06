import { getValue } from './helpers';

export default function uniqBy<T>(items: readonly T[], iteratee: ((item: T) => unknown) | keyof T | string) {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    const value = getValue(item, iteratee);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
