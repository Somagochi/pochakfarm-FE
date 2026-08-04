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
      setOverview(await getCaptureOverviewApi());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '포착 확률을 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void loadOverview();
    }
  }, [enabled, loadOverview]);

  return { errorMessage, isLoading, overview, reload: loadOverview };
}
