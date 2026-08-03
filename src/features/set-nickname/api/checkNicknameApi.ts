import { apiClient } from '@/src/shared/api/client';

export function checkNicknameApi(nickname: string) {
  return apiClient.get<unknown>(
    `/api/users/nickname/check?nickname=${encodeURIComponent(nickname)}`,
  );
}
