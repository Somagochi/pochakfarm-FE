import { useCallback, useEffect, useState } from 'react';

import { getUserProfileApi } from '../api/getUserProfileApi';
import type { UserProfile } from './types';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setErrorMessage(null);
      setProfile(await getUserProfileApi());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '사용자 정보를 불러오지 못했습니다.',
      );
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return {
    clearError: () => setErrorMessage(null),
    errorMessage,
    profile,
    reload: loadProfile,
  };
}
