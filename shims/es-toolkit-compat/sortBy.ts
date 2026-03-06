import { getValue } from './helpers';

export default function sortBy<T>(items: readonly T[], iteratee: ((item: T) => unknown) | keyof T | string) {
  return [...items].sort((left, right) => {
    const leftValue = getValue(left, iteratee);
    const rightValue = getValue(right, iteratee);

    if (leftValue == null && rightValue == null) return 0;
    if (leftValue == null) return 1;
    if (rightValue == null) return -1;
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
    return 0;
  });
}
