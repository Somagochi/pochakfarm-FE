import { useState } from 'react';

import { ApiError } from '@/src/shared/api/client';

import { checkNicknameApi } from '../api/checkNicknameApi';

export function useCheckNickname() {
  const [isChecking, setIsChecking] = useState(false);

  async function checkNickname(nickname: string) {
    try {
      setIsChecking(true);
      await checkNicknameApi(nickname);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        return false;
      }

      throw error;
    } finally {
      setIsChecking(false);
    }
  }

  return {
    checkNickname,
    isChecking,
  };
}
