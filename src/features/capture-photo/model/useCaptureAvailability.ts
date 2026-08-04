import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { getCaptureAvailabilityApi } from '../api/getCaptureAvailabilityApi';
import type { CaptureAvailability } from './types';

export function useCaptureAvailability() {
  const [availability, setAvailability] =
    useState<CaptureAvailability | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setAvailability(await getCaptureAvailabilityApi());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '포착 가능 정보를 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAvailability();
    }, [loadAvailability]),
  );

  return {
    availability,
    errorMessage,
    isLoading,
    reload: loadAvailability,
  };
}
