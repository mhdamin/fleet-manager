export default function sortBy<T>(items: readonly T[], iteratee: ((item: T) => unknown) | keyof T) {
  const getValue =
    typeof iteratee === 'function'
      ? iteratee
      : (item: T) => item[iteratee];

  return [...items].sort((left, right) => {
    const leftValue = getValue(left);
    const rightValue = getValue(right);

    if (leftValue == null && rightValue == null) {
      return 0;
    }
    if (leftValue == null) {
      return 1;
    }
    if (rightValue == null) {
      return -1;
    }

    if (leftValue < rightValue) {
      return -1;
    }
    if (leftValue > rightValue) {
      return 1;
    }
    return 0;
  });
}
