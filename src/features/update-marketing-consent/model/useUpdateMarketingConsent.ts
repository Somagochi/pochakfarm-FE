import { useState } from 'react';

import { updateMarketingConsentApi } from '../api/updateMarketingConsentApi';

export function useUpdateMarketingConsent() {
  const [isLoading, setIsLoading] = useState(false);

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
    isLoading,
    updateMarketingConsent,
  };
}
