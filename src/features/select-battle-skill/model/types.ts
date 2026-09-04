import type {
  BattleBroadcastEvent,
  BattleFinalRound,
  BattleResult,
  BattleReward,
  BattleState,
  BattleStatus,
} from '@/src/entities/battle';

export type BattleActionRequest = {
  actionSeq: number;
  skill: string | null;
};

export type BattleActionParticipantStatus =
  | 'NOT_SELECTED'
  | 'ACTIVATED'
  | 'FAILED';

export type BattleActionParticipant = {
  skill: string | null;
  skillName: string | null;
  battleType: string | null;
  status: BattleActionParticipantStatus;
  point: number;
};

export type BattleActionResult = {
  battleId: number;
  actionSeq: number;
  entryOrder: number;
  actionNoInEntry: number;
  user: BattleActionParticipant;
  npc: BattleActionParticipant;
  netPoint: number;
  barPosition: number;
  minBarPosition: number;
  maxBarPosition: number;
  battleStatus: BattleStatus;
  battleResult: BattleResult;
  nextActionSeq: number | null;
  finalRound: BattleFinalRound;
  reward: BattleReward | null;
  broadcastEvents: BattleBroadcastEvent[];
};

export type SubmitBattleActionParams = BattleActionRequest & {
  battleId: number;
};

export type SubmitBattleActionResult = {
  action: BattleActionResult | null;
  state: BattleState;
};
