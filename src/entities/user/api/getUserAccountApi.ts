import { apiClient } from '@/src/shared/api/client';

import type { UserAccount } from '../model/types';

type UserAccountResponse = {
  data: UserAccount;
  datetime: string;
};

export async function getUserAccountApi() {
  const response = await apiClient.get<UserAccountResponse>('/api/users/me');

  return response.data;
}
