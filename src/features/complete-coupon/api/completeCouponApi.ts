import { apiClient } from '@/src/shared/api/client';

type CompleteCouponRequest = {
  couponCode: string;
  animalImageKey: string;
};

export function completeCouponApi(body: CompleteCouponRequest) {
  return apiClient.postWithResponse<unknown, CompleteCouponRequest>(
    '/api/coupons/complete',
    body,
  );
}
