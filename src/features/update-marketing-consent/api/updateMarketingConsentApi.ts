import { apiClient } from '@/src/shared/api/client';

export type UpdateMarketingConsentRequest = {
  marketingAgreed: boolean;
};

export type TermsAgreement = {
  requiredTermsAgreed: boolean;
  requiredTermsAgreedAt: string | null;
  serviceQualityAgreed: boolean;
  serviceQualityAgreedAt: string | null;
  marketingAgreed: boolean;
  marketingAgreedAt: string | null;
};

type TermsAgreementResponse = {
  data: TermsAgreement;
  datetime: string;
};

export async function getTermsAgreementApi() {
  const response = await apiClient.get<TermsAgreementResponse>(
    '/api/users/me/terms-agreement',
  );

  return response.data;
}

export function updateMarketingConsentApi(marketingAgreed: boolean) {
  return apiClient.patch<unknown, UpdateMarketingConsentRequest>(
    '/api/users/me/terms-agreement',
    { marketingAgreed },
  );
}
