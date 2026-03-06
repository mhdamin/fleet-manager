import { getValue } from './helpers';

export default function maxBy<T>(items: readonly T[], iteratee: ((item: T) => unknown) | keyof T | string) {
  return items.reduce<T | undefined>((current, item) => {
    if (current == null) return item;
    return (getValue(item, iteratee) as number) > (getValue(current, iteratee) as number) ? item : current;
  }, undefined);
}
