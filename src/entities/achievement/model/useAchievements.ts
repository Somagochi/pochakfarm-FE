import { useCallback, useEffect, useRef, useState } from 'react';

import { getAchievementsApi } from '../api/getAchievementsApi';
import type { Achievement, AchievementCategory } from './types';

type UseAchievementsOptions = {
  category?: AchievementCategory;
};

export function useAchievements({ category }: UseAchievementsOptions = {}) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
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
        const page = await getAchievementsApi({ category, cursor });

        setAchievements((currentAchievements) =>
          cursor === undefined
            ? page.content
            : [...currentAchievements, ...page.content],
        );
        setNextCursor(page.nextCursor);
        setHasNext(page.hasNext);

        return page;
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '업적 목록을 불러오지 못했습니다.',
        );
      } finally {
        isRequestingRef.current = false;
        setIsLoading(false);
      }
    },
    [category],
  );

  useEffect(() => {
    setAchievements([]);
    setNextCursor(null);
    setHasNext(true);
    void loadPage();
  }, [loadPage]);

  const loadNextPage = useCallback(() => {
    if (isRequestingRef.current || !hasNext || nextCursor === null) {
      return;
    }

    void loadPage(nextCursor);
  }, [hasNext, loadPage, nextCursor]);

  return {
    achievements,
    clearError: () => setErrorMessage(null),
    errorMessage,
    hasNext,
    isLoading,
    loadNextPage,
    reload: () => loadPage(),
  };
}
