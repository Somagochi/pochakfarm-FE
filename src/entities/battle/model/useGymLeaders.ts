import { useCallback, useEffect, useRef, useState } from 'react';

import { getGymLeadersApi } from '../api/getGymLeadersApi';
import type { GymLeader } from './types';

export function useGymLeaders() {
  const [gymLeaders, setGymLeaders] = useState<GymLeader[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRequestingRef = useRef(false);

  const reload = useCallback(async () => {
    if (isRequestingRef.current) {
      return;
    }

    isRequestingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextGymLeaders = await getGymLeadersApi();
      setGymLeaders(nextGymLeaders);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '관장 목록을 불러오지 못했습니다.',
      );
    } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    errorMessage,
    gymLeaders,
    isLoading,
    reload,
  };
}
