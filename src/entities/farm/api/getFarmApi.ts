import { apiClient } from '@/src/shared/api/client';

import type { Farm, FarmType } from '../model/types';

type FarmResponse = {
  data: Farm;
  datetime: string;
};

export async function getFarmApi(type: FarmType) {
  const response = await apiClient.get<FarmResponse>(
    `/api/farms/${type}?page=0`,
  );

  return response.data;
}
