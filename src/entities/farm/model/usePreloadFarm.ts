import { useEffect } from 'react';
import { AppState } from 'react-native';

import { preloadFarm } from './farmStore';
import type { FarmType } from './types';

export function usePreloadFarm(type: FarmType, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let frameId: number | null = null;
    let isCancelled = false;

    const cancelScheduledPreload = () => {
      if (frameId === null) return;

      cancelAnimationFrame(frameId);
      frameId = null;
    };
    const schedulePreload = () => {
      if (
        isCancelled ||
        frameId !== null ||
        AppState.currentState !== 'active'
      ) {
        return;
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;
        if (!isCancelled && AppState.currentState === 'active') {
          void preloadFarm(type);
        }
      });
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        schedulePreload();
      } else {
        cancelScheduledPreload();
      }
    });

    schedulePreload();

    return () => {
      isCancelled = true;
      cancelScheduledPreload();
      subscription.remove();
    };
  }, [enabled, type]);
}
