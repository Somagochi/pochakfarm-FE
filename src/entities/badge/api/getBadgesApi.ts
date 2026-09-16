import { apiClient } from '@/src/shared/api/client';

import type { Badge } from '../model/types';

type BadgesResponse = {
  data: Badge[];
  datetime: string;
};

export async function getBadgesApi() {
  const response = await apiClient.get<BadgesResponse>('/api/badges');

  return response.data;
}
