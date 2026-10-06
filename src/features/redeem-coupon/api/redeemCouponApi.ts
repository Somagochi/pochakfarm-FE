import { invalidateFarm } from '@/src/entities/farm';
import { apiClient } from '@/src/shared/api/client';

type RedeemCouponRequest = {
  couponCode: string;
};

export type RedeemedCouponReward = {
  captureId: number;
  animalName: string;
  cardType: string;
  tier: string;
  cardNo: string;
  cardImageUrl: string;
};

type RedeemCouponResponse = {
  data: RedeemedCouponReward;
  datetime: string;
};

export async function redeemCouponApi(couponCode: string) {
  const response = await apiClient.postWithResponse<
    RedeemCouponResponse,
    RedeemCouponRequest
  >(
    '/api/coupons/redeem',
    { couponCode },
  );

  invalidateFarm();
  return response;
}
