import { getPathParts } from './helpers';

export default function get<T>(value: T, path: string | Array<string | number>, defaultValue?: unknown) {
  const result = getPathParts(path).reduce<unknown>((current, key) => {
    if (current == null) {
      return undefined;
    }

    return (current as Record<string | number, unknown>)[key];
  }, value as unknown);

  return result === undefined ? defaultValue : result;
}
