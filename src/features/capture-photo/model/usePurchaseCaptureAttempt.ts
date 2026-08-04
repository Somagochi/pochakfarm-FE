import * as Crypto from 'expo-crypto';
import { useState } from 'react';

import { formatRequestError } from '@/src/shared/api/formatRequestError';

import { purchaseCaptureAttemptApi } from '../api/purchaseCaptureAttemptApi';

export function usePurchaseCaptureAttempt() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function purchaseAttempt() {
    if (isLoading) {
      return null;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      return await purchaseCaptureAttemptApi(Crypto.randomUUID());
    } catch (error) {
      setErrorMessage(
        formatRequestError(
          'POST /api/captures/attempts/purchase',
          error,
        ),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    clearError: () => setErrorMessage(null),
    errorMessage,
    isLoading,
    purchaseAttempt,
  };
}
