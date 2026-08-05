import { apiClient } from '@/src/shared/api/client';

export type MoveFarmCreatureRequest = {
  targetFloorNum: number;
  targetSlotNum: number;
};

export function moveFarmCreatureApi(
  animalId: number,
  body: MoveFarmCreatureRequest,
) {
  return apiClient.patch<unknown, MoveFarmCreatureRequest>(
    `/api/animals/${animalId}/slot`,
    body,
  );
}
