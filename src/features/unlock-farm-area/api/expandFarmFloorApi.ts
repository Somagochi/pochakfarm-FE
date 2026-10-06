import type { FarmType } from '@/src/entities/farm';
import { invalidateUserProfile } from '@/src/entities/user';
import { apiClient } from '@/src/shared/api/client';

export async function expandFarmFloorApi(type: FarmType) {
  const response = await apiClient.postWithoutBody<unknown>(
    `/api/farms/${type}/floors`,
  );

  invalidateUserProfile();
  return response;
}
