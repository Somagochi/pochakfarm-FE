import type { BattleArenaType, BattleCoachId } from '../model/types';

const MIXED_ARENA_TYPES: readonly BattleArenaType[] = [
  'ground',
  'sky',
  'sea',
  'space',
];

const BATTLE_COACH_IDS: readonly BattleCoachId[] = [
  'moru',
  'haru',
  'nio',
  'raon',
  'byeoli',
  'gaon',
  'daon',
  'ion',
];

export function isBattleCoachId(value: string): value is BattleCoachId {
  return BATTLE_COACH_IDS.includes(value as BattleCoachId);
}

export function getBattleArenaType(
  leaderType: string,
  randomValue = Math.random(),
): BattleArenaType {
  const normalizedLeaderType = leaderType.trim().toUpperCase();

  if (normalizedLeaderType !== 'MIXED') {
    switch (normalizedLeaderType) {
      case 'GROUND':
        return 'ground';
      case 'SKY':
        return 'sky';
      case 'SEA':
        return 'sea';
      case 'SPACE':
        return 'space';
      default:
        return 'ground';
    }
  }

  const randomIndex = Math.min(
    Math.floor(randomValue * MIXED_ARENA_TYPES.length),
    MIXED_ARENA_TYPES.length - 1,
  );

  return MIXED_ARENA_TYPES[randomIndex];
}
