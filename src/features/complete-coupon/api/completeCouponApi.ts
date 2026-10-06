import { invalidateUserProfile } from '@/src/entities/user';
import { apiClient } from '@/src/shared/api/client';

type CompleteCouponRequest = {
  couponCode: string;
};

export async function completeCouponApi(body: CompleteCouponRequest) {
  const response = await apiClient.postWithResponse<unknown, CompleteCouponRequest>(
    '/api/coupons/complete',
    body,
  );

  invalidateUserProfile();
  return response;
}
