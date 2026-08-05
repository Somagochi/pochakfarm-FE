export type AchievementCategory = 'EVENT' | 'COLLECTION' | 'FARM';

export type Achievement = {
  achieved: boolean;
  code: string;
  hidden: boolean;
  imageUrl?: string;
  progress?: {
    current: number;
    target: number;
  };
  rewards?: (
    | {
        amount: number;
        type: 'COIN';
      }
    | {
        badgeName: string;
        type: 'BADGE';
      }
  )[];
  title?: string;
  description?: string;
  [key: string]: unknown;
};

export type AchievementsPage = {
  content: Achievement[];
  nextCursor: number | null;
  hasNext: boolean;
};
