import { useCallback, useRef, useState } from 'react';

import { getBattleStateApi } from '@/src/entities/battle';
import { ApiError } from '@/src/shared/api/client';

import {
  readActiveBattleSession,
  removeActiveBattleSession,
  writeActiveBattleSession,
} from './battleSessionStorage';
import type { ActiveBattleSession, ResumedBattle } from './types';

export function useResumeBattle() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isRequestingRef = useRef(false);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const saveBattleSession = useCallback(
    async (session: ActiveBattleSession) => {
      try {
        await writeActiveBattleSession(session);
        return true;
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '대전 복구 정보를 저장하지 못했습니다.',
        );
        return false;
      }
    },
    [],
  );

  const clearBattleSession = useCallback(async () => {
    try {
      await removeActiveBattleSession();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '대전 복구 정보를 정리하지 못했습니다.',
      );
    }
  }, []);

  const resumeBattle = useCallback(
    async (battleId?: number): Promise<ResumedBattle | null> => {
      if (isRequestingRef.current) {
        return null;
      }

      isRequestingRef.current = true;
      setIsLoading(true);
      setErrorMessage(null);
      let isSavedSessionRequest = false;

      try {
        const savedSession = await readActiveBattleSession();
        const requestedBattleId = battleId ?? savedSession?.battleId;

        if (!requestedBattleId) {
          return null;
        }

        isSavedSessionRequest = savedSession?.battleId === requestedBattleId;

        const state = await getBattleStateApi(requestedBattleId);
        return {
          session:
            savedSession?.battleId === requestedBattleId
              ? savedSession
              : null,
          state,
        };
      } catch (error) {
        if (
          isSavedSessionRequest &&
          error instanceof ApiError &&
          [403, 404, 410].includes(error.status)
        ) {
          await removeActiveBattleSession().catch(() => undefined);
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : '진행 중인 대전을 불러오지 못했습니다.',
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
    clearBattleSession,
    clearError,
    errorMessage,
    isLoading,
    resumeBattle,
    saveBattleSession,
  };
}
