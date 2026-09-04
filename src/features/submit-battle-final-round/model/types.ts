import type {
  BattleFinalRound,
  BattleResult,
  BattleReward,
  BattleStatus,
} from '@/src/entities/battle';

export type SubmitBattleFinalRoundRequest = {
  tapCount: number;
};

export type SubmitBattleFinalRoundResult = {
  battleId: number;
  battleStatus: BattleStatus;
  battleResult: BattleResult;
  barPosition: number;
  finalRound: BattleFinalRound;
  reward: BattleReward | null;
};

export type SubmitBattleFinalRoundParams =
  SubmitBattleFinalRoundRequest & {
    battleId: number;
    serverTimeOffsetMs: number;
    submissionExpiresAt: string | null;
  };
