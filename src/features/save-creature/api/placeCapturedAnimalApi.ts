import { invalidateFarm } from '@/src/entities/farm';
import { apiClient } from '@/src/shared/api/client';

export type PlaceCapturedAnimalRequest = {
  floorNum: number;
  slotNum: number;
  replacedAnimalId: number | null;
};

export async function placeCapturedAnimalApi(
  captureId: number,
  body: PlaceCapturedAnimalRequest,
) {
  const response = await apiClient.post<unknown, PlaceCapturedAnimalRequest>(
    `/api/captures/${captureId}/animal`,
    body,
  );

  invalidateFarm();
  return response;
}

export function getCapturePlacementApi(captureId: number) {
  return apiClient.get<unknown>(`/api/captures/${captureId}`);
}
