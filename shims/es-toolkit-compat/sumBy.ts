import { getValue } from './helpers';

export default function sumBy<T>(items: readonly T[], iteratee: ((item: T) => unknown) | keyof T | string) {
  return items.reduce((total, item) => total + Number(getValue(item, iteratee) ?? 0), 0);
}
