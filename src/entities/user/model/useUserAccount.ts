import { useCallback, useEffect, useState } from 'react';

import { getUserAccountApi } from '../api/getUserAccountApi';
import type { UserAccount } from './types';

export function useUserAccount() {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    try {
      setErrorMessage(null);
      setAccount(await getUserAccountApi());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '계정 정보를 불러오지 못했습니다.',
      );
    }
  }, []);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  return {
    account,
    clearError: () => setErrorMessage(null),
    errorMessage,
    reload: loadAccount,
  };
}
