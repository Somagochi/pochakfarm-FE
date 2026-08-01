import { apiClient } from '@/src/shared/api/client';

type SetNicknameRequest = {
  nickname: string;
};

export function setNicknameApi(nickname: string) {
  return apiClient.patch<unknown, SetNicknameRequest>(
    '/api/users/me/nickname',
    { nickname },
  );
}
