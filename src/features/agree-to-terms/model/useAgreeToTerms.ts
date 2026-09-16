import { useState } from 'react';

import { captureAnalyticsEvent } from '@/src/shared/lib/analytics';

import {
  agreeToTermsApi,
  type TermsAgreementRequest,
} from '../api/agreeToTermsApi';

export function useAgreeToTerms() {
  const [isLoading, setIsLoading] = useState(false);

  async function agreeToTerms(agreement: TermsAgreementRequest) {
    try {
      setIsLoading(true);
      await agreeToTermsApi(agreement);
      captureAnalyticsEvent('signup_completed', {
        marketing_agreed: agreement.marketingAgreed,
        service_quality_agreed: agreement.serviceQualityAgreed,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return {
    agreeToTerms,
    isLoading,
  };
}
