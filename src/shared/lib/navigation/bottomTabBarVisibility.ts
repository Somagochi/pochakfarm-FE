import { useSyncExternalStore } from 'react';

let isHidden = false;
const listeners = new Set<() => void>();

export function setBottomTabBarHidden(nextIsHidden: boolean) {
  if (isHidden === nextIsHidden) return;

  isHidden = nextIsHidden;
  listeners.forEach((listener) => listener());
}

export function useIsBottomTabBarHidden() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => isHidden,
    () => false,
  );
}
