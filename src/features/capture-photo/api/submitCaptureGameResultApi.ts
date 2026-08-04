import { ApiError, apiClient } from '@/src/shared/api/client';

import type { CaptureThrowResult } from '../model/types';

type SubmitCaptureGameResultRequest = {
  throws: CaptureThrowResult[];
};

function getResponseMessage(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  if ('message' in data && typeof data.message === 'string') {
    return data.message;
  }

  if (
    'data' in data &&
    typeof data.data === 'object' &&
    data.data !== null &&
    'message' in data.data &&
    typeof data.data.message === 'string'
  ) {
    return data.data.message;
  }

  return null;
}

export async function submitCaptureGameResultApi(
  captureId: number,
  throws: CaptureThrowResult[],
) {
  const response = await apiClient.postWithResponse<
    unknown,
    SubmitCaptureGameResultRequest
  >(
    `/api/captures/${captureId}/game-result`,
    { throws },
  );

  if (response.status !== 200) {
    throw new ApiError(
      getResponseMessage(response.data) ??
        '미니게임 결과를 전송하지 못했습니다.',
      response.status,
    );
  }
}
