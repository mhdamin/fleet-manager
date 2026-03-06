export default function last<T>(items: readonly T[]) {
  return items.at(-1);
}
