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
export type BattleStatus = 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';
export type BattleResult = 'WIN' | 'LOSE' | null;
export type BattleSide = 'USER' | 'NPC';

export type BattleEntrySkill = {
  skill: string;
  name: string;
  battleType: string;
  triggerPercentage: number;
  point: number;
};

export type BattleEntry = {
  side: BattleSide;
  orderNo: number;
  captureId: number;
  animalName: string;
  cardType: GymLeaderAnimalCardType;
  tier: string;
  skills: BattleEntrySkill[] | null;
};

export type BattleFinalRound = {
  required: boolean;
  started: boolean;
  startExpiresAt: string | null;
  inputExpiresAt: string | null;
  submissionExpiresAt: string | null;
  tapCount: number | null;
  point: number | null;
};

export type BattleReward = {
  firstClear: boolean;
  rewardGranted: boolean;
  gymLeaderCoins: number;
  experience: number;
  badgeCode: string | null;
  levelUp: boolean;
  levelBefore: number;
  levelAfter: number;
  experienceAfter: number;
  requiredExperienceForNextLevel: number;
  levelUpCoins: number;
  coinsAfter: number;
};

export type BattleBroadcastEventCode =
  | 'TIER_ADVANTAGE'
  | 'TYPE_ADVANTAGE'
  | 'SKILL_NOT_SELECTED'
  | 'SKILL_TRIGGERED'
  | 'SKILL_FAILED'
  | 'SKILL_OFFSET'
  | 'BATTLE_POINT_APPLIED';

export type BattleBroadcastEvent = {
  eventSeq: number;
  actionSeq: number;
  entryOrder: number;
  eventCode: BattleBroadcastEventCode;
  animalSide?: BattleSide | null;
  skill?: string | null;
  skillName?: string | null;
  winnerSide?: BattleSide | null;
  point?: number | null;
};

export type BattleState = {
  battleId: number;
  gymLeaderId: number;
  status: BattleStatus;
  result: BattleResult;
  barPosition: number;
  minBarPosition: number;
  maxBarPosition: number;
  completedActionCount: number;
  totalActionCount: number;
  currentEntryOrder: number;
  nextActionSeq: number | null;
  userEntry: BattleEntry;
  npcEntry: BattleEntry;
  finalRound: BattleFinalRound;
  reward: BattleReward | null;
  broadcastEvents: BattleBroadcastEvent[];
  serverTimeOffsetMs: number;
};

export type GymLeaderUnlock = {
  unlocked: boolean;
  requiredLevel: number;
  levelSatisfied: boolean;
  previousBadgeCode: string | null;
  previousBadgeSatisfied: boolean;
};

export type GymLeader = {
  gymLeaderId: number;
  name: string;
  challengeOrder: number;
  thumbnailUrl: string;
  cleared: boolean;
  unlocked: boolean;
};

export type GymLeaderDetailLeader = {
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
  gymLeader: GymLeaderDetailLeader;
  animals: GymLeaderAnimal[];
};
