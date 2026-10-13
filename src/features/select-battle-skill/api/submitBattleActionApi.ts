import { invalidateUserProfile } from '@/src/entities/user';
import { apiClient } from '@/src/shared/api/client';

import type {
  BattleActionRequest,
  BattleActionResult,
} from '../model/types';

type BattleActionResponse = {
  data: BattleActionResult;
  datetime: string;
};

export async function submitBattleActionApi(
  battleId: number,
  body: BattleActionRequest,
) {
  const response = await apiClient.post<
    BattleActionResponse,
    BattleActionRequest
  >(`/api/battles/${battleId}/actions`, body);

  if (
    response.data?.battleStatus === 'FINISHED' ||
    response.data?.reward?.rewardGranted === true
  ) {
    invalidateUserProfile();
  }

  return response.data;
}
