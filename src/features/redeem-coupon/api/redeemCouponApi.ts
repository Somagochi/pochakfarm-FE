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
  animalImageUpload: {
    uploadUrl: string;
    key: string;
    expiresAt: string;
  };
};

type RedeemCouponResponse = {
  data: RedeemedCouponReward;
  datetime: string;
};

export function redeemCouponApi(couponCode: string) {
  return apiClient.postWithResponse<
    RedeemCouponResponse,
    RedeemCouponRequest
  >(
    '/api/coupons/redeem',
    { couponCode },
  );
}
