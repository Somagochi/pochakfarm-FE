import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
let activeRequestCount = 0;

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function beginApiRequest() {
  activeRequestCount += 1;
  emitChange();

  let hasEnded = false;

  return () => {
    if (hasEnded) return;

    hasEnded = true;
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    emitChange();
  };
}

export function useActiveApiRequestCount() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => activeRequestCount,
    () => 0,
  );
}
