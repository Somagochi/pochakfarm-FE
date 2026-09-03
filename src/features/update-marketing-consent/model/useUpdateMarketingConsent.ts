import { useCallback, useState } from 'react';

import {
  getTermsAgreementApi,
  updateMarketingConsentApi,
} from '../api/updateMarketingConsentApi';

export function useUpdateMarketingConsent() {
  const [isLoading, setIsLoading] = useState(false);

  const getTermsAgreement = useCallback(async () => {
    try {
      setIsLoading(true);
      return await getTermsAgreementApi();
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function updateMarketingConsent(marketingAgreed: boolean) {
    if (isLoading) {
      return false;
    }

    try {
      setIsLoading(true);
      await updateMarketingConsentApi(marketingAgreed);
      return true;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    getTermsAgreement,
    isLoading,
    updateMarketingConsent,
  };
}
