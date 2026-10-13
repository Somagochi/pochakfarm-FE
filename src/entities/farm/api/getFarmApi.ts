import { apiClient } from '@/src/shared/api/client';

import type { Farm, FarmType } from '../model/types';

type FarmResponse = {
  data: Farm;
  datetime: string;
};

export async function getFarmApi(
  type: FarmType,
  { background = false }: { background?: boolean } = {},
) {
  const response = await apiClient.get<FarmResponse>(
    `/api/farms/${type}?page=0`,
    { affectsScreenLoading: !background },
  );

  return response.data;
}
