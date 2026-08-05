export type UserProfile = {
  nickname: string | null;
  level: number;
  coins: number;
  currentExperience: number;
  requiredExperience: number;
  remainingExperience: number;
};

export type UserAccount = {
  email: string | null;
  provider: 'apple' | 'kakao' | 'naver' | null;
};
