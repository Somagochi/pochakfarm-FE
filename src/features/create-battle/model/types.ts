import type { BattleState } from '@/src/entities/battle';

export type CreateBattleEntry = {
  animalId: number;
  orderNo: number;
};

export type CreateBattleRequest = {
  gymLeaderId: number;
  clientRequestId: string;
  entries: CreateBattleEntry[];
};

export type CreateBattleParams = Omit<
  CreateBattleRequest,
  'clientRequestId'
>;

export type CreatedBattle = {
  battleId: number;
};

export type CreateBattleResult = {
  battleId: number;
  initialState: BattleState;
};
