import { useCallback, useEffect, useRef, useState } from 'react';

import type { Animal, AnimalCardType } from '@/src/entities/creature';

import { searchAnimalsApi } from '../api/searchAnimalsApi';

type UseSearchAnimalsOptions = {
  enabled?: boolean;
  keyword: string;
  type?: AnimalCardType;
};

export function useSearchAnimals({
  enabled = true,
  keyword,
  type,
}: UseSearchAnimalsOptions) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isLoadingNextPageRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    isLoadingNextPageRef.current = false;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const page = await searchAnimalsApi({ keyword, type });

      if (requestId !== requestIdRef.current) return;

      setAnimals(page.content);
      setNextCursor(page.nextCursor);
      setHasNext(page.hasNext);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '동물 검색 결과를 불러오지 못했습니다.',
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [keyword, type]);

  useEffect(() => {
    if (enabled) {
      void loadFirstPage();
    } else {
      requestIdRef.current += 1;
      setIsLoading(false);
    }
  }, [enabled, loadFirstPage]);

  const loadNextPage = useCallback(async () => {
    if (
      !enabled ||
      !hasNext ||
      nextCursor === null ||
      isLoadingNextPageRef.current
    ) {
      return;
    }

    const requestId = requestIdRef.current;
    isLoadingNextPageRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const page = await searchAnimalsApi({
        cursor: nextCursor,
        keyword,
        type,
      });

      if (requestId !== requestIdRef.current) return;

      setAnimals((currentAnimals) => {
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
      if (requestId !== requestIdRef.current) return;

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '동물 검색 결과를 불러오지 못했습니다.',
      );
    } finally {
      if (requestId === requestIdRef.current) {
        isLoadingNextPageRef.current = false;
        setIsLoading(false);
      }
    }
  }, [enabled, hasNext, keyword, nextCursor, type]);

  return {
    animals,
    clearError: () => setErrorMessage(null),
    errorMessage,
    hasNext,
    isLoading,
    loadNextPage,
    reload: loadFirstPage,
  };
}
