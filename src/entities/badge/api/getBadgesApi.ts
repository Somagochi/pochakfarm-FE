import { apiClient } from '@/src/shared/api/client';

import type { BadgesPage } from '../model/types';

type BadgesResponse = {
  data: BadgesPage;
  datetime: string;
};

type GetBadgesParams = {
  cursor?: number;
};

export async function getBadgesApi({ cursor }: GetBadgesParams = {}) {
  const query =
    cursor === undefined
      ? '?category=GYM_LEADER'
      : `?category=GYM_LEADER&cursor=${encodeURIComponent(cursor)}`;
  const response = await apiClient.get<BadgesResponse>(
    `/api/badges${query}`,
  );

  return response.data;
}
