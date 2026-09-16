import * as Crypto from 'expo-crypto';
import { useCallback, useRef, useState } from 'react';

import { getBattleStateApi } from '@/src/entities/battle';
import { captureAnalyticsEvent } from '@/src/shared/lib/analytics';

import { createBattleApi } from '../api/createBattleApi';
import type { CreateBattleParams, CreateBattleResult } from './types';

type BattleRequestAttempt = {
  clientRequestId: string;
  requestKey: string;
  result: CreateBattleResult | null;
};

function getRequestKey(params: CreateBattleParams) {
  return JSON.stringify(params);
}

export function useCreateBattle() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const attemptRef = useRef<BattleRequestAttempt | null>(null);
  const lastErrorRef = useRef<unknown>(null);
  const isRequestingRef = useRef(false);

  const createBattle = useCallback(async (params: CreateBattleParams) => {
    if (isRequestingRef.current) {
      return null;
    }

    const requestKey = getRequestKey(params);
    const currentAttempt = attemptRef.current;

    if (currentAttempt?.requestKey === requestKey && currentAttempt.result) {
      return currentAttempt.result;
    }

    const attempt =
      currentAttempt?.requestKey === requestKey
        ? currentAttempt
        : {
            clientRequestId: Crypto.randomUUID(),
            requestKey,
            result: null,
          };
    attemptRef.current = attempt;
    isRequestingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    lastErrorRef.current = null;

    try {
      const createdBattle = await createBattleApi({
        ...params,
        clientRequestId: attempt.clientRequestId,
      });
      const initialState = await getBattleStateApi(createdBattle.battleId);
      const result = {
        battleId: createdBattle.battleId,
        initialState,
      };
      attempt.result = result;
      captureAnalyticsEvent('battle_started', {
        battle_id: result.battleId,
        gym_leader_id: params.gymLeaderId,
        party_size: params.entries.length,
      });
      return result;
    } catch (error) {
      lastErrorRef.current = error;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '대전을 시작하지 못했습니다.',
      );
      return null;
    } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);
  const getLastError = useCallback(() => lastErrorRef.current, []);

  return {
    clearError,
    createBattle,
    errorMessage,
    getLastError,
    isLoading,
  };
}
