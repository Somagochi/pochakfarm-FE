import { useCallback, useEffect, useRef, useState } from 'react';

import { getAnimalsApi } from '../api/getAnimalsApi';
import type { Animal } from './types';

type UseAnimalsOptions = {
  enabled?: boolean;
};

export function useAnimals({ enabled = true }: UseAnimalsOptions = {}) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRequestingRef = useRef(false);

  const loadPage = useCallback(async (cursor?: number) => {
    if (isRequestingRef.current) {
      return;
    }

    isRequestingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const page = await getAnimalsApi(cursor);

      setAnimals((currentAnimals) => {
        if (cursor === undefined) {
          return page.content;
        }

        const animalIds = new Set(
          currentAnimals.map((animal) => animal.animalId),
        );
        const newAnimals = page.content.filter(
          (animal) => !animalIds.has(animal.animalId),
        );

        return [...currentAnimals, ...newAnimals];
      });
      setNextCursor(page.nextCursor);
      setHasNext(page.hasNext);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '동물 목록을 불러오지 못했습니다.',
      );
    } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void loadPage();
    }
  }, [enabled, loadPage]);

  const loadNextPage = useCallback(() => {
    if (!hasNext || nextCursor === null) {
      return;
    }

    void loadPage(nextCursor);
  }, [hasNext, loadPage, nextCursor]);

  return {
    animals,
    clearError: () => setErrorMessage(null),
    errorMessage,
    hasNext,
    isLoading,
    loadNextPage,
    reload: () => loadPage(),
  };
}
