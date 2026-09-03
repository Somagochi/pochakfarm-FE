import { apiClient } from '@/src/shared/api/client';

import type { GymLeader } from '../model/types';

type GymLeadersResponse = {
  data: GymLeader[];
  datetime: string;
};

export async function getGymLeadersApi() {
  const response = await apiClient.get<GymLeadersResponse>(
    '/api/battles/gym-leaders',
  );

  return [...response.data].sort(
    (firstLeader, secondLeader) =>
      firstLeader.challengeOrder - secondLeader.challengeOrder,
  );
}
