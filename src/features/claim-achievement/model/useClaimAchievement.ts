import { useCallback, useRef, useState } from 'react';

import { captureAnalyticsEvent } from '@/src/shared/lib/analytics';

import { claimAchievementApi } from '../api/claimAchievementApi';

export function useClaimAchievement() {
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isClaimingRef = useRef(false);

  const claimAchievement = useCallback(async (code: string) => {
    if (isClaimingRef.current) {
      return false;
    }

    isClaimingRef.current = true;
    setClaimingCode(code);
    setErrorMessage(null);

    try {
      await claimAchievementApi(code);
      captureAnalyticsEvent('achievement_claimed', {
        achievement_code: code,
      });
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '업적 보상을 받지 못했습니다.',
      );
      return false;
    } finally {
      isClaimingRef.current = false;
      setClaimingCode(null);
    }
  }, []);

  return {
    claimAchievement,
    claimingCode,
    clearError: () => setErrorMessage(null),
    errorMessage,
  };
}
