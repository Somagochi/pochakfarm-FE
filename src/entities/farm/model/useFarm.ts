import { useCallback, useEffect, useRef, useState } from 'react';

import { getFarmApi } from '../api/getFarmApi';
import type { Farm, FarmType } from './types';

export function useFarm(type: FarmType) {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadFarm = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setErrorMessage(null);

    try {
      const nextFarm = await getFarmApi(type);

      if (requestId === requestIdRef.current) {
        setFarm(nextFarm);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '농장 정보를 불러오지 못했습니다.',
        );
      }
    }
  }, [type]);

  useEffect(() => {
    setFarm(null);

    void loadFarm();
  }, [loadFarm]);

  return {
    clearError: () => setErrorMessage(null),
    errorMessage,
    farm,
    reload: loadFarm,
  };
}
