import { useCallback, useEffect, useRef, useState } from 'react';

import { getGymLeaderDetailApi } from '../api/getGymLeaderDetailApi';
import type { GymLeaderDetail } from './types';

export function useGymLeaderDetail(gymLeaderId?: number) {
  const [gymLeaderDetail, setGymLeaderDetail] =
    useState<GymLeaderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (gymLeaderId === undefined) {
      setGymLeaderDetail(null);
      setErrorMessage('관장 정보가 올바르지 않습니다.');
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const detail = await getGymLeaderDetailApi(gymLeaderId);

      if (requestId === requestIdRef.current) {
        setGymLeaderDetail(detail);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '관장 정보를 불러오지 못했습니다.',
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [gymLeaderId]);

  useEffect(() => {
    void reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return {
    errorMessage,
    gymLeaderDetail,
    isLoading,
    reload,
  };
}
