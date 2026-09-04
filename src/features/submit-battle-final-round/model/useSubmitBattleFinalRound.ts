import { useCallback, useRef, useState } from 'react';

import { getBattleStateApi } from '@/src/entities/battle';
import { ApiError } from '@/src/shared/api/client';

import { submitBattleFinalRoundApi } from '../api/submitBattleFinalRoundApi';
import type {
  SubmitBattleFinalRoundParams,
  SubmitBattleFinalRoundResult,
} from './types';

type FinalRoundResultAttempt = {
  battleId: number;
  result: SubmitBattleFinalRoundResult | null;
  submissionExpiresAt: string | null;
  serverTimeOffsetMs: number;
  tapCount: number;
};

function toFinalRoundResult(
  state: Awaited<ReturnType<typeof getBattleStateApi>>,
): SubmitBattleFinalRoundResult {
  return {
    battleId: state.battleId,
    battleStatus: state.status,
    battleResult: state.result,
    barPosition: state.barPosition,
    finalRound: state.finalRound,
    reward: state.reward,
  };
}

function canRetrySubmission(error: unknown) {
  return !(error instanceof ApiError) || error.status >= 500;
}

function getCurrentServerTimeMs(serverTimeOffsetMs: number) {
  return Date.now() + serverTimeOffsetMs;
}

export function useSubmitBattleFinalRound() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const attemptRef = useRef<FinalRoundResultAttempt | null>(null);
  const isRequestingRef = useRef(false);

  const submitBattleFinalRound = useCallback(
    async (params: SubmitBattleFinalRoundParams) => {
      if (isRequestingRef.current) {
        return null;
      }

      const currentAttempt = attemptRef.current;

      if (currentAttempt?.battleId === params.battleId && currentAttempt.result) {
        return currentAttempt.result;
      }

      const attempt =
        currentAttempt?.battleId === params.battleId
          ? currentAttempt
          : {
              battleId: params.battleId,
              result: null,
              serverTimeOffsetMs: params.serverTimeOffsetMs,
              submissionExpiresAt: params.submissionExpiresAt,
              tapCount: params.tapCount,
            };
      attemptRef.current = attempt;
      isRequestingRef.current = true;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const submissionDeadlineMs = attempt.submissionExpiresAt
          ? Date.parse(attempt.submissionExpiresAt)
          : Number.NaN;
        const isSubmissionDeadlineValid = Number.isFinite(
          submissionDeadlineMs,
        );
        let submissionError: unknown = null;
        let result: SubmitBattleFinalRoundResult | null = null;

        if (
          !isSubmissionDeadlineValid ||
          getCurrentServerTimeMs(attempt.serverTimeOffsetMs) <=
            submissionDeadlineMs
        ) {
          try {
            result = await submitBattleFinalRoundApi(attempt.battleId, {
              tapCount: attempt.tapCount,
            });
          } catch (error) {
            submissionError = error;

            if (
              canRetrySubmission(error) &&
              (!isSubmissionDeadlineValid ||
                getCurrentServerTimeMs(attempt.serverTimeOffsetMs) <=
                  submissionDeadlineMs)
            ) {
              try {
                result = await submitBattleFinalRoundApi(attempt.battleId, {
                  tapCount: attempt.tapCount,
                });
              } catch (retryError) {
                submissionError = retryError;
              }
            }
          }
        }

        if (!result) {
          const state = await getBattleStateApi(attempt.battleId);

          if (state.status === 'IN_PROGRESS') {
            throw (
              submissionError ??
              new Error('최종 승부 결과가 아직 확정되지 않았습니다.')
            );
          }

          result = toFinalRoundResult(state);
        }

        attempt.result = result;
        return result;
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '최종 승부 결과를 제출하지 못했습니다.',
        );
        return null;
      } finally {
        isRequestingRef.current = false;
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    errorMessage,
    isLoading,
    submitBattleFinalRound,
  };
}
