export type BattleCoachId =
  | 'moru'
  | 'haru'
  | 'nio'
  | 'raon'
  | 'byeoli'
  | 'gaon'
  | 'daon'
  | 'ion';

export type BattleArenaType = 'ground' | 'sky' | 'sea' | 'space';

export type GymLeaderUnlock = {
  unlocked: boolean;
  requiredLevel: number;
  levelSatisfied: boolean;
  previousBadgeCode: string | null;
  previousBadgeSatisfied: boolean;
};

export type GymLeader = {
  gymLeaderId: number;
  code: string;
  name: string;
  challengeOrder: number;
  imageUrl: string;
  badgeCode: string;
  cleared: boolean;
  unlock: GymLeaderUnlock;
};

export type GymLeaderAnimalCardType = 'GROUND' | 'SEA' | 'SKY' | 'SPACE';

export type GymLeaderAnimal = {
  orderNo: number;
  animalName: string;
  cardType: GymLeaderAnimalCardType;
  tier: string;
  animalImageUrl: string;
};

export type GymLeaderDetail = {
  gymLeader: GymLeader;
  animals: GymLeaderAnimal[];
};
