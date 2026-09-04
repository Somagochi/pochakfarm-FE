import { apiClient } from '@/src/shared/api/client';

import type { StartBattleFinalRoundResult } from '../model/types';

type StartBattleFinalRoundResponse = {
  data: Omit<StartBattleFinalRoundResult, 'serverTimeOffsetMs'>;
  datetime: string;
};

export async function startBattleFinalRoundApi(battleId: number) {
  const requestedAtMs = Date.now();
  const response = await apiClient.postWithoutBody<StartBattleFinalRoundResponse>(
    `/api/battles/${battleId}/final-round/start`,
  );
  const receivedAtMs = Date.now();
  const serverDatetimeMs = Date.parse(response.datetime);
  const estimatedClientTimeAtResponseMs =
    requestedAtMs + (receivedAtMs - requestedAtMs) / 2;

  return {
    ...response.data,
    serverTimeOffsetMs: Number.isFinite(serverDatetimeMs)
      ? serverDatetimeMs - estimatedClientTimeAtResponseMs
      : 0,
  };
}
