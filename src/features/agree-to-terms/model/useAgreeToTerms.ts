import { useState } from 'react';

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
    } finally {
      setIsLoading(false);
    }
  }

  return {
    agreeToTerms,
    isLoading,
  };
}
