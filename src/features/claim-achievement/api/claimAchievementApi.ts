import { invalidateUserProfile } from '@/src/entities/user';
import { apiClient } from '@/src/shared/api/client';

export async function claimAchievementApi(code: string) {
  const response = await apiClient.postWithoutBody<unknown>(
    `/api/achievements/${encodeURIComponent(code)}/claim`,
  );

  invalidateUserProfile();
  return response;
}
