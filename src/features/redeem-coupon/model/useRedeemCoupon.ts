import { useState } from 'react';

import { ApiError } from '@/src/shared/api/client';

import { redeemCouponApi } from '../api/redeemCouponApi';

export function useRedeemCoupon() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function redeemCoupon(couponCode: string) {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await redeemCouponApi(couponCode);

      if (response.status === 200) {
        return response.data.data;
      }

      setErrorMessage('쿠폰 등록에 실패했습니다.');
      return null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 419) {
        setErrorMessage(error.message);
        return null;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '쿠폰 등록에 실패했습니다.',
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
    redeemCoupon,
  };
}
