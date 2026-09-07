import type { BattleCoachId, BattleState } from '@/src/entities/battle';

export type ActiveBattleSession = {
  battleId: number;
  coach: BattleCoachId;
  npcParty: string;
  party: string;
};

export type ResumedBattle = {
  session: ActiveBattleSession | null;
  state: BattleState;
};
