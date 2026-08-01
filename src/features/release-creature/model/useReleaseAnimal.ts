import { useRef, useState } from 'react';

import { releaseAnimalApi } from '../api/releaseAnimalApi';

export function useReleaseAnimal() {
  const [isReleasing, setIsReleasing] = useState(false);
  const isRequestingRef = useRef(false);

  async function releaseAnimal(animalId: number) {
    if (isRequestingRef.current) {
      return false;
    }

    isRequestingRef.current = true;
    setIsReleasing(true);

    try {
      await releaseAnimalApi(animalId);
      return true;
    } finally {
      isRequestingRef.current = false;
      setIsReleasing(false);
    }
  }

  return {
    isReleasing,
    releaseAnimal,
  };
}
