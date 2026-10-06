import { apiClient } from '@/src/shared/api/client';

import { measureUserProfileRequest } from '../lib/measureUserProfileRequest';
import type { UserProfile } from '../model/types';

type UserProfileResponse = {
  data: UserProfile;
  datetime: string;
};

export async function getUserProfileApi() {
  const response = await measureUserProfileRequest(() =>
    apiClient.get<UserProfileResponse>('/api/users/profile'),
  );

  return response.data;
}
