import { useCallback, useRef, useState } from 'react';

import { startBattleFinalRoundApi } from '../api/startBattleFinalRoundApi';
import type { StartBattleFinalRoundResult } from './types';

type FinalRoundStartAttempt = {
  battleId: number;
  result: StartBattleFinalRoundResult | null;
};

export function useStartBattleFinalRound() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const attemptRef = useRef<FinalRoundStartAttempt | null>(null);
  const isRequestingRef = useRef(false);

  const startBattleFinalRound = useCallback(async (battleId: number) => {
    if (isRequestingRef.current) {
      return null;
    }

    const currentAttempt = attemptRef.current;

    if (currentAttempt?.battleId === battleId && currentAttempt.result) {
      return currentAttempt.result;
    }

    const attempt =
      currentAttempt?.battleId === battleId
        ? currentAttempt
        : { battleId, result: null };
    attemptRef.current = attempt;
    isRequestingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await startBattleFinalRoundApi(attempt.battleId);
      attempt.result = result;
      return result;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '최종 승부를 시작하지 못했습니다.',
      );
      return null;
    } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  return {
    errorMessage,
    isLoading,
    startBattleFinalRound,
  };
}
