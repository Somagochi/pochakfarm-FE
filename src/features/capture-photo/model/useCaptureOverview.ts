import { useCallback, useEffect, useState } from 'react';

import { getCaptureOverviewApi } from '../api/getCaptureOverviewApi';
import type { CaptureOverview } from './types';

export function useCaptureOverview(enabled: boolean) {
  const [overview, setOverview] = useState<CaptureOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const nextOverview = await getCaptureOverviewApi();
      setOverview(nextOverview);
      return nextOverview;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '포착 확률을 불러오지 못했습니다.',
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void loadOverview();
    }
  }, [enabled, loadOverview]);

  return {
    clearError: () => setErrorMessage(null),
    errorMessage,
    isLoading,
    overview,
    reload: loadOverview,
  };
}
