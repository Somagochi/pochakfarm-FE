import { apiClient } from '@/src/shared/api/client';

export function releaseAnimalApi(animalId: number) {
  return apiClient.delete<unknown>(`/api/animals/${animalId}`);
}
