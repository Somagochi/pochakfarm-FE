import type { FarmType } from '@/src/entities/farm';
import { apiClient } from '@/src/shared/api/client';

export function expandFarmFloorApi(type: FarmType) {
  return apiClient.postWithoutBody<unknown>(`/api/farms/${type}/floors`);
}
