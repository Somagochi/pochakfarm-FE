import { apiClient } from '@/src/shared/api/client';

import type { UserProfile } from '../model/types';

type UserProfileResponse = {
  data: UserProfile;
  datetime: string;
};

export async function getUserProfileApi() {
  const response = await apiClient.get<UserProfileResponse>(
    '/api/users/profile',
  );

  return response.data;
}
