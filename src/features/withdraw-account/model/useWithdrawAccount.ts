import { useRef, useState } from 'react';

import { getUserAccountApi } from '@/src/entities/user';
import {
  clearServiceToken,
  getServiceToken,
} from '@/src/shared/lib/auth/tokenStorage';

import { withdrawAccountApi } from '../api/withdrawAccountApi';
import { clearSocialSdkSession } from '../lib/clearSocialSdkSession';
import type { WithdrawalReason } from './types';

export function useWithdrawAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const isRequestingRef = useRef(false);

  async function withdrawAccount(withdrawalReason: WithdrawalReason) {
    if (isRequestingRef.current) {
      return false;
    }

    isRequestingRef.current = true;
    setIsLoading(true);

    try {
      const token = await getServiceToken();

      if (!token) {
        throw new Error('저장된 로그인 토큰이 없습니다.');
      }

      const account = await getUserAccountApi();
      await withdrawAccountApi(token.refreshToken, withdrawalReason);

      try {
        await clearSocialSdkSession(account.provider);
      } catch (error) {
        console.warn('소셜 로그인 SDK 정보를 초기화하지 못했습니다.', error);
      } finally {
        await clearServiceToken();
      }

      return true;
    } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    withdrawAccount,
  };
}
