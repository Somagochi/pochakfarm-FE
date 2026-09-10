import { getBattleStateApi } from '@/src/entities/battle';
import { ApiError } from '@/src/shared/api/client';

import {
  readActiveBattleSession,
  removeActiveBattleSession,
} from './battleSessionStorage';

export async function restoreStoredBattle() {
  const session = await readActiveBattleSession();

  if (!session) {
    return null;
  }

  try {
    const state = await getBattleStateApi(session.battleId);
    return { session, state };
  } catch (error) {
    if (
      error instanceof ApiError &&
      [403, 404, 410].includes(error.status)
    ) {
      await removeActiveBattleSession().catch(() => undefined);
    }

    throw error;
  }
}

export async function discardStoredBattle() {
  await removeActiveBattleSession();
}
