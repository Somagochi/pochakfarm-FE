import { apiClient } from '@/src/shared/api/client';

import type { AnimalDetail } from '../model/types';

type AnimalDetailResponse = {
  data: AnimalDetail;
  datetime: string;
};

export async function getAnimalDetailApi(animalId: number) {
  const response = await apiClient.get<AnimalDetailResponse>(
    `/api/animals/${animalId}`,
  );

  return response.data;
}
