import { apiClient } from '@/src/shared/api/client';

import type { GymLeaderDetail } from '../model/types';

type GymLeaderDetailResponse = {
  data: GymLeaderDetail;
  datetime: string;
};

export async function getGymLeaderDetailApi(gymLeaderId: number) {
  const response = await apiClient.get<GymLeaderDetailResponse>(
    `/api/battles/gym-leaders/${gymLeaderId}`,
  );

  return {
    ...response.data,
    animals: [...response.data.animals].sort(
      (firstAnimal, secondAnimal) => firstAnimal.orderNo - secondAnimal.orderNo,
    ),
  };
}
