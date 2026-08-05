import { apiClient } from '@/src/shared/api/client';

import type { UserAccount } from '../model/types';

type UserAccountResponse = {
  data: {
    email: string | null;
    provider: string | null;
  };
  datetime: string;
};

const SOCIAL_LOGIN_PROVIDERS = ['apple', 'kakao', 'naver'] as const;

function normalizeSocialLoginProvider(
  provider: string | null,
): UserAccount['provider'] {
  const normalizedProvider = provider?.toLowerCase() ?? null;

  return SOCIAL_LOGIN_PROVIDERS.find(
    (candidate) => candidate === normalizedProvider,
  ) ?? null;
}

export async function getUserAccountApi() {
  const response = await apiClient.get<UserAccountResponse>('/api/users/me');

  return {
    ...response.data,
    provider: normalizeSocialLoginProvider(response.data.provider),
  } satisfies UserAccount;
}
