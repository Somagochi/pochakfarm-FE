import { apiClient } from '@/src/shared/api/client';

export type PlaceCapturedAnimalRequest = {
  animalImageKey: string;
  floorNum: number;
  slotNum: number;
  replacedAnimalId: number | null;
};

export function placeCapturedAnimalApi(
  captureId: number,
  body: PlaceCapturedAnimalRequest,
) {
  return apiClient.post<unknown, PlaceCapturedAnimalRequest>(
    `/api/captures/${captureId}/animal`,
    body,
  );
}

export function getCapturePlacementApi(captureId: number) {
  return apiClient.get<unknown>(`/api/captures/${captureId}`);
}
