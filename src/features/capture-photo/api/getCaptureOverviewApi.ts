import { apiClient } from '@/src/shared/api/client';

import type { CaptureOverview } from '../model/types';

type CaptureOverviewResponse = {
  data: CaptureOverview;
  datetime: string;
};

export async function getCaptureOverviewApi() {
  const response = await apiClient.get<CaptureOverviewResponse>(
    '/api/captures/overview',
  );

  return response.data;
}
