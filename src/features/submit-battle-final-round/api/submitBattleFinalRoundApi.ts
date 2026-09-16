import { apiClient } from '@/src/shared/api/client';

import type {
  SubmitBattleFinalRoundRequest,
  SubmitBattleFinalRoundResult,
} from '../model/types';

type SubmitBattleFinalRoundResponse = {
  data: SubmitBattleFinalRoundResult;
  datetime: string;
};

export async function submitBattleFinalRoundApi(
  battleId: number,
  body: SubmitBattleFinalRoundRequest,
) {
  const response = await apiClient.post<
    SubmitBattleFinalRoundResponse,
    SubmitBattleFinalRoundRequest
  >(`/api/battles/${battleId}/final-round/result`, body);

  return response.data;
}
