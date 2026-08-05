import { apiClient } from '@/src/shared/api/client';

import type {
  AchievementCategory,
  AchievementsPage,
} from '../model/types';

type AchievementsResponse = {
  data: AchievementsPage;
  datetime: string;
};

type GetAchievementsParams = {
  category?: AchievementCategory;
  cursor?: number;
};

export async function getAchievementsApi({
  category,
  cursor,
}: GetAchievementsParams = {}) {
  const queryParams: string[] = [];

  if (category !== undefined) {
    queryParams.push(`category=${encodeURIComponent(category)}`);
  }

  if (cursor !== undefined) {
    queryParams.push(`cursor=${encodeURIComponent(cursor)}`);
  }

  const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  const response = await apiClient.get<AchievementsResponse>(
    `/api/achievements${query}`,
  );

  return response.data;
}
