import { apiClient } from '@/src/shared/api/client';

import type { ServiceToken, SocialLoginProvider } from '../model/types';

type SocialLoginRequest = {
  provider: SocialLoginProvider;
  token: string;
};

type SocialLoginResponse = {
  data: {
    token: ServiceToken;
    isNew: boolean;
  };
  datetime: string;
};

export async function socialLoginApi(provider: SocialLoginProvider, token: string) {
  const response = await apiClient.post<SocialLoginResponse, SocialLoginRequest>('/api/auth/login', {
    provider,
    token,
  });

  return response.data.token;
}
