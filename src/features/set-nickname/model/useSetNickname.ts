import { useState } from 'react';

import { ApiError } from '@/src/shared/api/client';

import { setNicknameApi } from '../api/setNicknameApi';
import { isUsableNickname } from '../lib/validateNickname';

const DUPLICATE_NICKNAME_PATTERN = /중복|이미.*닉네임|닉네임.*이미/;

export function useSetNickname() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function setNickname(nickname: string) {
    if (!isUsableNickname(nickname)) {
      setErrorMessage('사용할 수 없는 이름입니다.');
      return false;
    }

    try {
      setIsLoading(true);
      await setNicknameApi(nickname);
      return true;
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 409 || DUPLICATE_NICKNAME_PATTERN.test(error.message))
      ) {
        setErrorMessage('이미있는 닉네임입니다.');
        return false;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    clearError: () => setErrorMessage(null),
    errorMessage,
    isLoading,
    setNickname,
  };
}
