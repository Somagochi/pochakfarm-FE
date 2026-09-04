import { useCallback, useRef, useState } from 'react';

import { getBattleStateApi } from '@/src/entities/battle';
import { ApiError } from '@/src/shared/api/client';

import { submitBattleActionApi } from '../api/submitBattleActionApi';
import type {
  SubmitBattleActionParams,
  SubmitBattleActionResult,
} from './types';

type BattleActionAttempt = {
  actionSeq: number;
  battleId: number;
  result: SubmitBattleActionResult | null;
  skill: string | null;
};

export function useSubmitBattleAction() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const attemptRef = useRef<BattleActionAttempt | null>(null);
  const isRequestingRef = useRef(false);

  const submitBattleAction = useCallback(
    async (params: SubmitBattleActionParams) => {
      if (isRequestingRef.current) {
        return null;
      }

      const currentAttempt = attemptRef.current;
      const isSameAction =
        currentAttempt?.battleId === params.battleId &&
        currentAttempt.actionSeq === params.actionSeq;

      if (isSameAction && currentAttempt.result) {
        return currentAttempt.result;
      }

      const attempt = isSameAction
        ? currentAttempt
        : {
            actionSeq: params.actionSeq,
            battleId: params.battleId,
            result: null,
            skill: params.skill,
          };
      attemptRef.current = attempt;
      isRequestingRef.current = true;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        let action;

        try {
          action = await submitBattleActionApi(attempt.battleId, {
            actionSeq: attempt.actionSeq,
            skill: attempt.skill,
          });
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.code === 'BATTLE_ACTION_SEQUENCE_MISMATCH'
          ) {
            const state = await getBattleStateApi(attempt.battleId);
            const result = { action: null, state };

            if (
              state.status === 'IN_PROGRESS' &&
              state.nextActionSeq === attempt.actionSeq
            ) {
              attemptRef.current = null;
            } else {
              attempt.result = result;
            }

            return result;
          } else {
            throw error;
          }
        }

        const state = await getBattleStateApi(attempt.battleId);
        const result = { action, state };
        attempt.result = result;
        return result;
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '대전 행동을 처리하지 못했습니다.',
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
    clearError: () => setErrorMessage(null),
    errorMessage,
    isLoading,
    submitBattleAction,
  };
}
