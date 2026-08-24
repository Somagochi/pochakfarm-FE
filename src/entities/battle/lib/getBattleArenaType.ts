import type { BattleArenaType, BattleCoachId } from '../model/types';

const MIXED_ARENA_TYPES: readonly BattleArenaType[] = [
  'ground',
  'sky',
  'sea',
  'space',
];

const COACH_ARENA_TYPES: Record<BattleCoachId, BattleArenaType | 'mixed'> = {
  moru: 'ground',
  haru: 'sky',
  nio: 'sea',
  raon: 'mixed',
  byeoli: 'space',
  gaon: 'mixed',
  daon: 'mixed',
  ion: 'mixed',
};

export function isBattleCoachId(value: string): value is BattleCoachId {
  return value in COACH_ARENA_TYPES;
}

export function getBattleArenaType(
  coachId: BattleCoachId,
  randomValue = Math.random(),
): BattleArenaType {
  const arenaType = COACH_ARENA_TYPES[coachId];

  if (arenaType !== 'mixed') {
    return arenaType;
  }

  const randomIndex = Math.min(
    Math.floor(randomValue * MIXED_ARENA_TYPES.length),
    MIXED_ARENA_TYPES.length - 1,
  );

  return MIXED_ARENA_TYPES[randomIndex];
}
