import { invalidateFarm } from '@/src/entities/farm';
import { apiClient } from '@/src/shared/api/client';

export async function releaseAnimalApi(animalId: number) {
  const response = await apiClient.delete<unknown>(`/api/animals/${animalId}`);

  invalidateFarm();
  return response;
}
