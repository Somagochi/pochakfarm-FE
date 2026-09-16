import type {
  BattleFinalRound,
  BattleResult,
  BattleReward,
  BattleStatus,
} from '@/src/entities/battle';

export type StartBattleFinalRoundResult = {
  battleId: number;
  battleStatus: BattleStatus;
  battleResult: BattleResult;
  finalRound: BattleFinalRound;
  reward: BattleReward | null;
  serverTimeOffsetMs: number;
};
