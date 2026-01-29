import * as React from 'react';

import { useDebouncedCallback } from '@/shared/hooks/use-debounced-callback';

type AutosaveState = {
  saving: boolean;
  error: string | null;
  lastSavedAt: number | null;
};

export function useFormAutosave<TValue>(props: {
  delayMs: number;
  enabled: boolean;
  scopeKey?: string;
  initialValue?: TValue;
  onSave: (value: TValue) => Promise<void>;
}) {
  const [state, setState] = React.useState<AutosaveState>({
    saving: false,
    error: null,
    lastSavedAt: null,
  });

  const pendingValueRef = React.useRef<TValue | null>(null);
  const inFlightRef = React.useRef<Promise<void> | null>(null);
  const lastSavedKeyRef = React.useRef<string | null>(null);

  const saveNow = React.useCallback(async () => {
    if (!props.enabled) return;
    const value = pendingValueRef.current;
    if (value === null) return;

    const key = JSON.stringify(value);
    if (lastSavedKeyRef.current === key) return;

    // Wait if a save is already in-flight.
    if (inFlightRef.current) {
      try {
        await inFlightRef.current;
      } catch {
        // ignore; next save attempt will handle.
      }
    }

    setState((s) => ({ ...s, saving: true, error: null }));

    const p = props
      .onSave(value)
      .then(() => {
        lastSavedKeyRef.current = key;
        setState({ saving: false, error: null, lastSavedAt: Date.now() });
      })
      .catch((e: unknown) => {
        setState({
          saving: false,
          error: e instanceof Error ? e.message : 'Failed to save',
          lastSavedAt: null,
        });
        throw e;
      })
      .finally(() => {
        inFlightRef.current = null;
      });

    inFlightRef.current = p;
    await p;
  }, [props]);

  const debounced = useDebouncedCallback(() => saveNow(), props.delayMs);

  React.useEffect(() => {
    // Reset internal state when switching context (e.g., applicationId).
    debounced.cancel();
    pendingValueRef.current = null;
    inFlightRef.current = null;
    lastSavedKeyRef.current =
      props.initialValue === undefined ? null : JSON.stringify(props.initialValue);
    setState({ saving: false, error: null, lastSavedAt: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.scopeKey]);

  const schedule = React.useCallback(
    (value: TValue) => {
      if (!props.enabled) return;
      const key = JSON.stringify(value);
      if (lastSavedKeyRef.current === key) return;
      pendingValueRef.current = value;
      debounced.call();
    },
    [debounced, props.enabled]
  );

  const flush = React.useCallback(async () => {
    if (!props.enabled) return;
    debounced.flush();
    try {
      await inFlightRef.current;
    } catch {
      // surfaced via state.error
    }
  }, [debounced, props.enabled]);

  return {
    ...state,
    schedule,
    flush,
  };
}
