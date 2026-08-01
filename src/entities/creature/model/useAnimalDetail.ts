import { useCallback, useEffect, useState } from 'react';

import { getAnimalDetailApi } from '../api/getAnimalDetailApi';
import type { AnimalDetail } from './types';

export function useAnimalDetail(animalId?: number) {
  const [animal, setAnimal] = useState<AnimalDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnimal = useCallback(async () => {
    if (animalId === undefined) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      setAnimal(await getAnimalDetailApi(animalId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '동물 상세 정보를 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    setAnimal(null);
    void loadAnimal();
  }, [loadAnimal]);

  return {
    animal,
    errorMessage,
    isLoading,
    reload: loadAnimal,
  };
}
