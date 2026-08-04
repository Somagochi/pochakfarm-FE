import { apiClient } from '@/src/shared/api/client';

import type { CreateCaptureResult } from '../model/types';

export type CreateCaptureRequest = {
  clientRequestId: string;
  contentType: string;
  animalName: string;
  allowCoinPayment: boolean;
};

type CreateCaptureResponse = {
  data: CreateCaptureResult;
};

export async function createCaptureApi(body: CreateCaptureRequest) {
  const response = await apiClient.post<
    CreateCaptureResponse,
    CreateCaptureRequest
  >(
    '/api/captures',
    body,
  );

  return response.data;
}
