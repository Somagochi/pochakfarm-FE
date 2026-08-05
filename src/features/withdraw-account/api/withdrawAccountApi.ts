import { apiClient } from '@/src/shared/api/client';

import type { WithdrawalReason } from '../model/types';

type WithdrawAccountRequest = {
  refreshToken: string;
  withdrawalReason: WithdrawalReason;
};

export function withdrawAccountApi(
  refreshToken: string,
  withdrawalReason: WithdrawalReason,
) {
  return apiClient.deleteWithBody<unknown, WithdrawAccountRequest>(
    '/api/users/me',
    {
      refreshToken,
      withdrawalReason,
    },
  );
}
