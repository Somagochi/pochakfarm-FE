import { useState } from 'react';

import { ApiError } from '@/src/shared/api/client';
import { uploadImageToPresignedUrl } from '@/src/shared/api/uploadImageToPresignedUrl';
import { downloadRemoteImage } from '@/src/shared/lib/image/downloadRemoteImage';
import { removePhotoBackground } from '@/src/shared/lib/image/subjectSegmentation';

import { redeemCouponApi } from '../api/redeemCouponApi';

const COUPON_ERROR_MESSAGES: Record<number, string> = {
  400: '만료된 쿠폰 입니다.',
  404: '존재하지 않는 쿠폰 입니다.',
  409: '이미 사용된 쿠폰이거나 이미 쿠폰을 사용한 유저입니다.',
};

export function useRedeemCoupon() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFarmFull, setIsFarmFull] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function redeemCoupon(couponCode: string) {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setIsFarmFull(false);

      const response = await redeemCouponApi(couponCode);

      if (response.status === 200) {
        const reward = response.data.data;

        try {
          const cardImageUri = await downloadRemoteImage(reward.cardImageUrl);
          const animalImageUri = await removePhotoBackground(cardImageUri);
          await uploadImageToPresignedUrl({
            contentType: 'image/png',
            imageUri: animalImageUri,
            uploadUrl: reward.animalImageUpload.uploadUrl,
          });
        } catch {
          setErrorMessage('쿠폰 보상 이미지를 처리하지 못했습니다.');
          return null;
        }

        return reward;
      }

      setErrorMessage('쿠폰 등록에 실패했습니다.');
      return null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 419) {
        setIsFarmFull(true);
        return null;
      }

      const message =
        error instanceof ApiError
          ? COUPON_ERROR_MESSAGES[error.status]
          : undefined;

      setErrorMessage(message ?? '쿠폰 등록에 실패했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    clearError: () => setErrorMessage(null),
    closeFarmFullModal: () => setIsFarmFull(false),
    errorMessage,
    isFarmFull,
    isLoading,
    redeemCoupon,
  };
}
