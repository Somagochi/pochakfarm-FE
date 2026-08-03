import { useState } from 'react';

import { ApiError } from '@/src/shared/api/client';

import { completeCouponApi } from '../api/completeCouponApi';

const DEFAULT_ERROR_MESSAGE = '쿠폰 보상을 받지 못했습니다.';

export function useCompleteCoupon() {
  const [isLoading, setIsLoading] = useState(false);

  async function completeCoupon(
    couponCode: string,
    animalImageKey: string,
  ) {
    try {
      setIsLoading(true);

      const response = await completeCouponApi({
        couponCode,
        animalImageKey,
      });

      return response.status === 200 ? null : DEFAULT_ERROR_MESSAGE;
    } catch (error) {
      return error instanceof ApiError
        ? error.message
        : DEFAULT_ERROR_MESSAGE;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    completeCoupon,
    isLoading,
  };
}
