import { apiClient } from '@/src/shared/api/client';

type PurchaseCaptureAttemptRequest = {
  clientRequestId: string;
};

export type PurchaseCaptureAttemptResult = {
  remaining: number;
  chargedCoins: number;
  currentCoins: number;
  resetsAt: string;
};

type PurchaseCaptureAttemptResponse = {
  data: PurchaseCaptureAttemptResult;
  datetime: string;
};

export async function purchaseCaptureAttemptApi(clientRequestId: string) {
  const response = await apiClient.post<
    PurchaseCaptureAttemptResponse,
    PurchaseCaptureAttemptRequest
  >(
    '/api/captures/attempts/purchase',
    { clientRequestId },
  );

  return response.data;
}
