import { apiClient } from '@/src/shared/api/client';

export type UpdateMarketingConsentRequest = {
  marketingAgreed: boolean;
};

export function updateMarketingConsentApi(marketingAgreed: boolean) {
  return apiClient.patch<unknown, UpdateMarketingConsentRequest>(
    '/api/users/me/terms-agreement',
    { marketingAgreed },
  );
}
