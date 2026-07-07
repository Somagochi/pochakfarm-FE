import { apiClient } from '@/src/shared/api/client';

type LogoutRequest = {
  refreshToken: string;
};

export function logoutApi(accessToken: string, refreshToken: string) {
  return apiClient.post<unknown, LogoutRequest>(
    '/api/auth/logout',
    {
      refreshToken,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
