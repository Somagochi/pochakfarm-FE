import { apiClient } from '@/src/shared/api/client';

import type { CaptureAvailability } from '../model/types';

type CaptureAvailabilityResponse = {
  data: CaptureAvailability;
  datetime: string;
};

export async function getCaptureAvailabilityApi() {
  const response = await apiClient.get<CaptureAvailabilityResponse>(
    '/api/captures/availability',
  );

  return response.data;
}
