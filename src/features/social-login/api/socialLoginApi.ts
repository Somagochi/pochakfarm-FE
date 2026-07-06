import { apiClient } from '@/src/shared/api/client';

import type { ServiceToken, SocialLoginProvider } from '../model/types';

type SocialLoginRequest = {
  provider: SocialLoginProvider;
  token: string;
};

export function socialLoginApi(provider: SocialLoginProvider, token: string) {
  return apiClient.post<ServiceToken, SocialLoginRequest>('/api/auth/login', {
    provider,
    token,
  });
}
