import { invalidateUserProfile } from '@/src/entities/user';
import { apiClient } from '@/src/shared/api/client';

type SetNicknameRequest = {
  nickname: string;
};

export async function setNicknameApi(nickname: string) {
  const response = await apiClient.patch<unknown, SetNicknameRequest>(
    '/api/users/me/nickname',
    { nickname },
  );

  invalidateUserProfile();
  return response;
}
