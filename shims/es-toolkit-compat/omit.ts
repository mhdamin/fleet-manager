export default function omit<T extends Record<string, unknown>, K extends keyof T>(value: T, keys: readonly K[]) {
  const next = { ...value };
  for (const key of keys) {
    delete next[key];
  }
  return next;
}
