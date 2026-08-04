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
