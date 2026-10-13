import { invalidateFarm } from '@/src/entities/farm';
import { apiClient } from '@/src/shared/api/client';

export type MoveFarmCreatureRequest = {
  targetFloorNum: number;
  targetSlotNum: number;
};

export async function moveFarmCreatureApi(
  animalId: number,
  body: MoveFarmCreatureRequest,
) {
  const response = await apiClient.patch<unknown, MoveFarmCreatureRequest>(
    `/api/animals/${animalId}/slot`,
    body,
  );

  invalidateFarm();
  return response;
}
