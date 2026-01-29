import * as React from 'react';

type Debounced<TArgs extends unknown[]> = {
  call: (...args: TArgs) => void;
  flush: () => void;
  cancel: () => void;
};

export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delayMs: number
): Debounced<TArgs> {
  const fnRef = React.useRef(fn);
  const timerRef = React.useRef<number | null>(null);
  const lastArgsRef = React.useRef<TArgs | null>(null);

  React.useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const cancel = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  const flush = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const args = lastArgsRef.current;
    lastArgsRef.current = null;
    if (!args) return;
    void fnRef.current(...args);
  }, []);

  const call = React.useCallback(
    (...args: TArgs) => {
      lastArgsRef.current = args;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const latest = lastArgsRef.current;
        lastArgsRef.current = null;
        if (!latest) return;
        void fnRef.current(...latest);
      }, delayMs);
    },
    [delayMs]
  );

  React.useEffect(() => cancel, [cancel]);

  return { call, flush, cancel };
}
