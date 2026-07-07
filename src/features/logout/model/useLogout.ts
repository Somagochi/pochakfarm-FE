import { useState } from 'react';

import { clearServiceToken, getServiceToken } from '@/src/shared/lib/auth/tokenStorage';

import { logoutApi } from '../api/logoutApi';

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    try {
      setIsLoading(true);

      const token = await getServiceToken();

      if (!token) {
        throw new Error('저장된 로그인 토큰이 없습니다.');
      }

      await logoutApi(token.accessToken, token.refreshToken);
      await clearServiceToken();
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    logout,
  };
}
