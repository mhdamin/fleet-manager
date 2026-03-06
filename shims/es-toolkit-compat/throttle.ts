export default function throttle<T extends (...args: any[]) => void>(fn: T, wait = 0) {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const invoke = (args: Parameters<T>) => {
    lastCall = Date.now();
    fn(...args);
  };

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      invoke(args);
      return;
    }

    pendingArgs = args;
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        if (pendingArgs) {
          invoke(pendingArgs);
          pendingArgs = null;
        }
      }, remaining);
    }
  };
}
