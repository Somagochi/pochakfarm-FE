import { apiClient } from '@/src/shared/api/client';

export function claimAchievementApi(code: string) {
  return apiClient.postWithoutBody<unknown>(
    `/api/achievements/${encodeURIComponent(code)}/claim`,
  );
}
