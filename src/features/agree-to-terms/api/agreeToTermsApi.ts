import { apiClient } from '@/src/shared/api/client';

export type TermsAgreementRequest = {
  ageRequirementAgreed: boolean;
  termsOfServiceAgreed: boolean;
  privacyPolicyAgreed: boolean;
  serviceQualityAgreed: boolean;
  marketingAgreed: boolean;
};

export function agreeToTermsApi(agreement: TermsAgreementRequest) {
  return apiClient.post<unknown, TermsAgreementRequest>(
    '/api/users/me/terms-agreement',
    agreement,
  );
}
