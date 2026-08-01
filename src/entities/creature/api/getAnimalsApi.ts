import { apiClient } from '@/src/shared/api/client';

import type { AnimalsPage } from '../model/types';

type AnimalsResponse = {
  data: AnimalsPage;
  datetime: string;
};

export async function getAnimalsApi(cursor?: number) {
  const query = cursor === undefined ? '' : `?cursor=${cursor}`;
  const response = await apiClient.get<AnimalsResponse>(
    `/api/animals${query}`,
  );

  return response.data;
}
