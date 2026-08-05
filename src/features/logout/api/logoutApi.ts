import { apiClient } from '@/src/shared/api/client';

type LogoutRequest = {
  refreshToken: string;
};

export function logoutApi(refreshToken: string) {
  return apiClient.post<unknown, LogoutRequest>(
    '/api/auth/logout',
    {
      refreshToken,
    },
  );
}
