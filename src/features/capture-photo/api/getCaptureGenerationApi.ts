import { ApiError, apiClient } from '@/src/shared/api/client';

import type { CaptureDetail } from '../model/types';

type CaptureGenerationResponse = Partial<CaptureDetail> & {
  data?: CaptureDetail;
  message?: string;
};

export async function getCaptureGenerationApi(captureId: number) {
  const response = await apiClient.getWithResponse<CaptureGenerationResponse>(
    `/api/captures/${captureId}`,
  );

  if (response.status !== 200) {
    throw new ApiError(
      response.data.message ?? '카드 생성 상태를 불러오지 못했습니다.',
      response.status,
    );
  }

  const capture = response.data.data ?? response.data;

  if (typeof capture.generationStatus !== 'string') {
    throw new Error('카드 생성 상태 응답이 올바르지 않습니다.');
  }

  if (capture.generationStatus === 'SUCCEEDED') {
    const isCompleteCapture =
      typeof capture.captureId === 'number' &&
      typeof capture.tier === 'string' &&
      typeof capture.cardType === 'string' &&
      typeof capture.gameStatus === 'string' &&
      typeof capture.cardImageUrl === 'string' &&
      typeof capture.animalImageUrl === 'string' &&
      typeof capture.elapsedMs === 'number' &&
      (typeof capture.failureReason === 'string' ||
        capture.failureReason === null);

    if (!isCompleteCapture) {
      throw new Error('완성된 카드 결과 응답이 올바르지 않습니다.');
    }
  }

  return capture;
}
