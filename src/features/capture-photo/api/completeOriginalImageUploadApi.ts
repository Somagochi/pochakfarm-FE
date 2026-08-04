import { ApiError, apiClient } from '@/src/shared/api/client';

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

export async function completeOriginalImageUploadApi(captureId: number) {
  const response = await apiClient.postWithoutBodyWithResponse<unknown>(
    `/api/captures/${captureId}/original-image/complete`,
  );

  if (response.status !== 202) {
    throw new ApiError(
      getResponseMessage(response.data) ??
        '원본 이미지 업로드 완료 요청에 실패했습니다.',
      response.status,
    );
  }
}
