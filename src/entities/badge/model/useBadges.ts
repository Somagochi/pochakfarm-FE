import { useCallback, useEffect, useRef, useState } from 'react';

import { getBadgesApi } from '../api/getBadgesApi';
import type { Badge } from './types';

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
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
      const nextBadges = await getBadgesApi();
      setBadges(nextBadges);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '관장뱃지를 불러오지 못했습니다.',
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
    badges,
    clearError: () => setErrorMessage(null),
    errorMessage,
    isLoading,
    reload,
  };
}
