import { apiClient } from '@/src/shared/api/client';
import { parseApiDatetime } from '@/src/shared/lib/date/parseApiDatetime';

import type { BattleState } from '../model/types';

type BattleStateResponse = {
  data: Omit<BattleState, 'serverTimeOffsetMs'>;
  datetime: string;
};

export async function getBattleStateApi(battleId: number) {
  const requestedAtMs = Date.now();
  const response = await apiClient.get<BattleStateResponse>(
    `/api/battles/${battleId}`,
  );
  const receivedAtMs = Date.now();
  const serverDatetimeMs = parseApiDatetime(response.datetime);
  const estimatedClientTimeAtResponseMs =
    requestedAtMs + (receivedAtMs - requestedAtMs) / 2;

  return {
    ...response.data,
    serverTimeOffsetMs: Number.isFinite(serverDatetimeMs)
      ? serverDatetimeMs - estimatedClientTimeAtResponseMs
      : 0,
  };
}
