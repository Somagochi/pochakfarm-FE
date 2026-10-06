import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { getFarmSnapshot, loadFarm, subscribeToFarm } from './farmStore';
import type { FarmType } from './types';

export function useFarm(type: FarmType) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToFarm(type, listener),
    [type],
  );
  const getSnapshot = useCallback(() => getFarmSnapshot(type), [type]);
  const { farm, isLoading, isRefreshing } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
  const [error, setError] = useState<{
    type: FarmType;
    message: string;
  } | null>(null);
  const currentTypeRef = useRef(type);
  const requestIdRef = useRef(0);
  currentTypeRef.current = type;

  const load = useCallback(async (force: boolean) => {
    const requestId = ++requestIdRef.current;
    setError(null);

    try {
      return await loadFarm(type, { force });
    } catch (error) {
      if (currentTypeRef.current === type && requestId === requestIdRef.current) {
        setError({
          type,
          message: error instanceof Error
            ? error.message
            : '농장 정보를 불러오지 못했습니다.',
        });
      }

      return null;
    }
  }, [type]);
  const reload = useCallback(() => load(true), [load]);
  const refreshIfStale = useCallback(() => load(false), [load]);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    void refreshIfStale();
  }, [refreshIfStale]);

  return {
    clearError,
    errorMessage: error?.type === type ? error.message : null,
    farm,
    isLoading,
    isRefreshing,
    refreshIfStale,
    reload,
  };
}
