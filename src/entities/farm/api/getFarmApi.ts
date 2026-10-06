import { apiClient } from '@/src/shared/api/client';

import { measureFarmRequest } from '../lib/measureFarmRequest';
import type { Farm, FarmType } from '../model/types';

type FarmResponse = {
  data: Farm;
  datetime: string;
};

export async function getFarmApi(
  type: FarmType,
  { background = false }: { background?: boolean } = {},
) {
  return measureFarmRequest(
    type,
    async (onRequestTiming) => {
      const response = await apiClient.get<FarmResponse>(
        `/api/farms/${type}?page=0`,
        { onRequestTiming, affectsScreenLoading: !background },
      );

      return response.data;
    },
    { background },
  );
}
