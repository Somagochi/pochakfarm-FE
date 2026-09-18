import { useCallback, useEffect, useRef, useState } from 'react';

import { getBadgesApi } from '../api/getBadgesApi';
import type { Badge } from './types';

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRequestingRef = useRef(false);

  const loadPage = useCallback(
    async (cursor?: number) => {
      if (isRequestingRef.current) {
        return;
      }

      isRequestingRef.current = true;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const page = await getBadgesApi({ cursor });

        setBadges((currentBadges) =>
          cursor === undefined
            ? page.content
            : [...currentBadges, ...page.content],
        );
        setNextCursor(page.nextCursor);
        setHasNext(page.hasNext);

        return page;
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
    },
    [],
  );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const loadNextPage = useCallback(() => {
    if (isRequestingRef.current || !hasNext || nextCursor === null) {
      return;
    }

    void loadPage(nextCursor);
  }, [hasNext, loadPage, nextCursor]);

  return {
    badges,
    clearError: () => setErrorMessage(null),
    errorMessage,
    hasNext,
    isLoading,
    loadNextPage,
    reload: () => loadPage(),
  };
}
