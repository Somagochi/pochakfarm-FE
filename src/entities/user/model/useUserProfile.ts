import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import {
  getUserProfileSnapshot,
  loadUserProfile,
  subscribeToUserProfile,
} from './userProfileStore';

export function useUserProfile() {
  const { profile, isLoading, isRefreshing } = useSyncExternalStore(
    subscribeToUserProfile,
    getUserProfileSnapshot,
    getUserProfileSnapshot,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async (force: boolean) => {
    try {
      setErrorMessage(null);
      await loadUserProfile({ force });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '사용자 정보를 불러오지 못했습니다.',
      );
    }
  }, []);
  const reload = useCallback(() => loadProfile(true), [loadProfile]);
  const refreshIfStale = useCallback(() => loadProfile(false), [loadProfile]);
  const clearError = useCallback(() => setErrorMessage(null), []);

  useEffect(() => {
    const current = getUserProfileSnapshot();

    // 최초 실패 후 새 화면의 마운트가 자동 재시도 루프를 만들지 않게 합니다.
    if (!current.hasInitialLoadCompleted || current.profile !== null) {
      void refreshIfStale();
    }
  }, [refreshIfStale]);

  return {
    clearError,
    errorMessage,
    isLoading,
    isRefreshing,
    profile,
    refreshIfStale,
    reload,
  };
}
