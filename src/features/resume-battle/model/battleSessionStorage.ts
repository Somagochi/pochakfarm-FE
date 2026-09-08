import AsyncStorage from '@react-native-async-storage/async-storage';

import { isBattleCoachId } from '@/src/entities/battle';

import type { ActiveBattleSession } from './types';

const ACTIVE_BATTLE_SESSION_KEY = 'pochakfarm:active-battle-session';

function isActiveBattleSession(value: unknown): value is ActiveBattleSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as Partial<ActiveBattleSession>;

  return (
    Number.isSafeInteger(session.battleId) &&
    Number(session.battleId) > 0 &&
    typeof session.coach === 'string' &&
    isBattleCoachId(session.coach) &&
    (session.lastPlayedEventSeq === undefined ||
      (Number.isSafeInteger(session.lastPlayedEventSeq) &&
        Number(session.lastPlayedEventSeq) >= 0)) &&
    typeof session.party === 'string' &&
    typeof session.npcParty === 'string'
  );
}

export async function updateActiveBattleSessionProgress(
  battleId: number,
  lastPlayedEventSeq: number,
) {
  const session = await readActiveBattleSession();

  if (!session || session.battleId !== battleId) {
    return;
  }

  await writeActiveBattleSession({
    ...session,
    lastPlayedEventSeq: Math.max(
      session.lastPlayedEventSeq ?? 0,
      lastPlayedEventSeq,
    ),
  });
}

export async function readActiveBattleSession() {
  const serializedSession = await AsyncStorage.getItem(
    ACTIVE_BATTLE_SESSION_KEY,
  );

  if (!serializedSession) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(serializedSession);

    if (isActiveBattleSession(session)) {
      return session;
    }
  } catch {
    // 손상된 저장값은 아래에서 제거한다.
  }

  await AsyncStorage.removeItem(ACTIVE_BATTLE_SESSION_KEY);
  return null;
}

export async function writeActiveBattleSession(
  session: ActiveBattleSession,
) {
  await AsyncStorage.setItem(
    ACTIVE_BATTLE_SESSION_KEY,
    JSON.stringify(session),
  );
}

export async function removeActiveBattleSession() {
  await AsyncStorage.removeItem(ACTIVE_BATTLE_SESSION_KEY);
}
