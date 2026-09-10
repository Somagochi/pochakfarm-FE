import { apiClient } from '@/src/shared/api/client';

import type {
  CreateBattleRequest,
  CreatedBattle,
} from '../model/types';

type CreateBattleResponse = {
  data: CreatedBattle;
  datetime: string;
};

export async function createBattleApi(body: CreateBattleRequest) {
  const response = await apiClient.post<
    CreateBattleResponse,
    CreateBattleRequest
  >('/api/battles', body);

  return response.data;
}
