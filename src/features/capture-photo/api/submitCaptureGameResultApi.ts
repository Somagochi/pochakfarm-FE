import { ApiError, apiClient } from '@/src/shared/api/client';

import type {
  CaptureGameResult,
  CaptureThrowResult,
} from '../model/types';

type SubmitCaptureGameResultRequest = {
  throws: CaptureThrowResult[];
};

type SubmitCaptureGameResultResponse = {
  data: CaptureGameResult;
  datetime: string;
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
    SubmitCaptureGameResultResponse,
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

  if (!response.data.data?.progression?.after) {
    throw new Error('미니게임 결과 응답이 올바르지 않습니다.');
  }

  return response.data.data;
}
