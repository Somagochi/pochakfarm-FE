export type CaptureCardType = 'SKY' | 'GROUND' | 'SEA' | 'SPACE';

export type CaptureTier = 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type CaptureOverview = {
  level: {
    currentLevel: number;
    currentExperience: number;
    requiredExperience: number;
    remainingExperience: number;
  };
  captureCounts: {
    cardType: CaptureCardType;
    count: number;
  }[];
  tierProbabilities: {
    tier: CaptureTier;
    probabilityPercent: number;
  }[];
};

export type CaptureAvailability = {
  attempts: {
    remaining: number;
  };
  attemptPurchaseCost: number;
  coins: number;
};

export type CreateCaptureResult = {
  captureId: number;
  tier: CaptureTier;
  cardType: CaptureCardType;
  difficulty: {
    ringShrinkDurationMs: number;
  };
  upload: {
    url: string;
    key: string;
    expiresAt: string;
  };
  attempts: {
    remaining: number;
  };
  gameResultExpiresAt: string;
};

export type CaptureThrowResult = {
  round: number;
  succeeded: boolean;
};

export type CaptureProgression = {
  level: number;
  experience: number;
  requiredExperienceForNextLevel: number;
};

export type CaptureGameResult = {
  captureId: number;
  gameStatus: string;
  reward: {
    experienceReward: number;
    levelUpCoinReward: number;
  } | null;
  progression: {
    before: CaptureProgression | null;
    after: CaptureProgression;
  };
};

export type CaptureDetail = {
  captureId: number;
  tier: CaptureTier;
  cardType: CaptureCardType;
  generationStatus: string;
  gameStatus: string;
  sceneImageUrl: string | null;
  cardImageUrl: string;
  animalImageUrl: string | null;
  elapsedMs: number;
  failureReason: string | null;
};
